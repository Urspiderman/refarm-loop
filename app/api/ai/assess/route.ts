import { NextResponse } from "next/server";
import { gemini } from "@/lib/gemini/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const fd = await req.formData();

    const file = fd.get("file") as File | null;
    const surplusId = fd.get("surplus_id") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Foto wajib diunggah." },
        { status: 400 }
      );
    }

    if (!surplusId) {
      return NextResponse.json(
        { error: "surplus_id wajib dikirim." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Pastikan user sudah login
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    // Pastikan surplus memang milik user yang sedang login
    const { data: surplus, error: surplusError } = await supabase
      .from("surplus_listings")
      .select("id")
      .eq("id", surplusId)
      .eq("supplier_id", user.id)
      .single();

    if (surplusError || !surplus) {
      return NextResponse.json(
        { error: "Surplus tidak ditemukan atau bukan milik Anda." },
        { status: 403 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const model = gemini().getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    });

    const prompt = `
Anda adalah ReFarm AI, modul assessment awal untuk surplus pertanian.

Analisis foto dan metadata berikut.

PENTING:
- Jangan menyatakan material aman untuk pakan, kompos,
  pangan, atau penggunaan lain secara pasti.
- Jangan memberikan sertifikasi.
- Berikan rekomendasi pathway secara preliminer.
- Jika foto tidak cukup jelas untuk menentukan material,
  nyatakan ketidakpastian dalam explanation.
- Confidence harus mencerminkan tingkat keyakinan model.
- Kembalikan JSON valid saja.
- Jangan menggunakan markdown atau code block.

Schema JSON:
{
  "material_type": "string",
  "condition": "string",
  "recovery_potential": 0,
  "recommended_pathways": [],
  "explanation": "string",
  "confidence": 0
}

Aturan:
- recovery_potential harus berupa angka 0-100.
- confidence harus berupa angka 0-1.
- recommended_pathways hanya boleh menggunakan:
  animal_feed,
  compost,
  organic_fertilizer,
  food_processing,
  bioconversion,
  other.

Metadata:
Nama material: ${fd.get("material_name") || ""}
Kondisi input: ${fd.get("condition") || ""}
Catatan: ${fd.get("notes") || ""}
`;

    const result = await model.generateContent([
      {
        text: prompt,
      },
      {
        inlineData: {
          data: bytes.toString("base64"),
          mimeType: file.type,
        },
      },
    ]);

    const text = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    const assessment = JSON.parse(text);

    // Validasi nilai dasar dari hasil AI
    const recoveryPotential = Math.max(
      0,
      Math.min(100, Number(assessment.recovery_potential) || 0)
    );

    const confidence = Math.max(
      0,
      Math.min(1, Number(assessment.confidence) || 0)
    );

    const allowedPathways = [
      "animal_feed",
      "compost",
      "organic_fertilizer",
      "food_processing",
      "bioconversion",
      "other",
    ];

    const recommendedPathways = Array.isArray(
      assessment.recommended_pathways
    )
      ? assessment.recommended_pathways.filter((pathway: unknown) =>
          allowedPathways.includes(String(pathway))
        )
      : [];

    // Simpan hasil assessment ke Supabase
    const { data: savedAssessment, error: assessmentError } =
      await supabase
        .from("material_assessments")
        .insert({
          surplus_id: surplusId,
          material_type: String(
            assessment.material_type || ""
          ),
          condition: String(
            assessment.condition || ""
          ),
          recovery_potential: recoveryPotential,
          recommended_pathways: recommendedPathways,
          explanation: String(
            assessment.explanation || ""
          ),
          confidence,
          model_name:
            process.env.GEMINI_MODEL || "gemini-3.6-flash",
        })
        .select()
        .single();

    if (assessmentError) {
      console.error(
        "Failed to save AI assessment:",
        assessmentError.message,
        assessmentError.details,
        assessmentError.hint,
        assessmentError.code
      );

      return NextResponse.json(
        {
          error: "AI berhasil menganalisis, tetapi hasil gagal disimpan.",
          details: assessmentError.message,
          assessment,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      assessment: savedAssessment,
    });
  } catch (e: any) {
    console.error("ReFarm AI assessment error:", e);

    return NextResponse.json(
      {
        error: e?.message || "AI assessment gagal",
      },
      {
        status: 500,
      }
    );
  }
}
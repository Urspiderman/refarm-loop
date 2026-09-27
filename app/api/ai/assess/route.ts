import { NextResponse } from "next/server";
import { gemini } from "@/lib/gemini/client";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_MODEL = "gemini-3.6-flash";
const FALLBACK_MODEL = "gemini-2.5-flash";

const MAX_RETRIES = 2;

function isTemporaryGeminiError(error: any) {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("503") ||
    message.includes("service unavailable") ||
    message.includes("high demand") ||
    message.includes("temporarily unavailable") ||
    message.includes("overloaded")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(
  prompt: string,
  imageData: string,
  mimeType: string
) {
  const configuredModel =
    process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const models = [
    configuredModel,
    FALLBACK_MODEL,
  ].filter(
    (model, index, array) =>
      model && array.indexOf(model) === index
  );

  let lastError: any = null;

  for (const modelName of models) {
    const model = gemini().getGenerativeModel({
      model: modelName,
    });

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(
          `[ReFarm AI] Trying model: ${modelName}, attempt: ${
            attempt + 1
          }`
        );

        const result = await model.generateContent([
          {
            text: prompt,
          },
          {
            inlineData: {
              data: imageData,
              mimeType,
            },
          },
        ]);

        return {
          result,
          modelName,
        };
      } catch (error: any) {
        lastError = error;

        console.error(
          `[ReFarm AI] Model ${modelName} failed on attempt ${
            attempt + 1
          }:`,
          error?.message || error
        );

        // Kalau bukan temporary error, jangan retry
        if (!isTemporaryGeminiError(error)) {
          throw error;
        }

        // Kalau masih ada kesempatan retry
        if (attempt < MAX_RETRIES) {
          const delay = 1000 * Math.pow(2, attempt);

          console.log(
            `[ReFarm AI] Temporary error. Retrying in ${delay}ms...`
          );

          await sleep(delay);
        }
      }
    }

    console.warn(
      `[ReFarm AI] Model ${modelName} unavailable. Trying fallback model...`
    );
  }

  throw lastError || new Error("Semua model Gemini tidak tersedia.");
}

export async function POST(req: Request) {
  try {
    const fd = await req.formData();

    const file = fd.get("file") as File | null;
    const surplusId = fd.get("surplus_id") as string | null;

    if (!file) {
      return NextResponse.json(
        {
          error: "Foto wajib diunggah.",
        },
        {
          status: 400,
        }
      );
    }

    if (!surplusId) {
      return NextResponse.json(
        {
          error: "surplus_id wajib dikirim.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = await createClient();

    // ==========================================
    // 1. CEK USER
    // ==========================================

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Anda harus login terlebih dahulu.",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // 2. CEK SURPLUS MILIK USER
    // ==========================================

    const { data: surplus, error: surplusError } =
      await supabase
        .from("surplus_listings")
        .select("id")
        .eq("id", surplusId)
        .eq("supplier_id", user.id)
        .single();

    if (surplusError || !surplus) {
      return NextResponse.json(
        {
          error:
            "Surplus tidak ditemukan atau bukan milik Anda.",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // 3. SIAPKAN IMAGE
    // ==========================================

    const bytes = Buffer.from(
      await file.arrayBuffer()
    );

    const imageBase64 = bytes.toString("base64");

    // ==========================================
    // 4. PROMPT RE FARM AI
    // ==========================================

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

    // ==========================================
    // 5. GEMINI + RETRY + FALLBACK
    // ==========================================

    const { result, modelName } =
      await generateWithRetry(
        prompt,
        imageBase64,
        file.type
      );

    const text = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    // ==========================================
    // 6. PARSE JSON
    // ==========================================

    let assessment: any;

    try {
      assessment = JSON.parse(text);
    } catch (parseError) {
      console.error(
        "[ReFarm AI] Invalid JSON from Gemini:",
        text
      );

      return NextResponse.json(
        {
          error:
            "ReFarm AI memberikan hasil yang tidak dapat diproses.",
          raw_response: text,
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // 7. VALIDASI RECOVERY POTENTIAL
    // ==========================================

    const recoveryPotential = Math.max(
      0,
      Math.min(
        100,
        Number(
          assessment.recovery_potential
        ) || 0
      )
    );

    // ==========================================
    // 8. VALIDASI CONFIDENCE
    // ==========================================

    const confidence = Math.max(
      0,
      Math.min(
        1,
        Number(assessment.confidence) || 0
      )
    );

    // ==========================================
    // 9. VALIDASI PATHWAY
    // ==========================================

    const allowedPathways = [
      "animal_feed",
      "compost",
      "organic_fertilizer",
      "food_processing",
      "bioconversion",
      "other",
    ];

    const recommendedPathways =
      Array.isArray(
        assessment.recommended_pathways
      )
        ? assessment.recommended_pathways.filter(
            (pathway: unknown) =>
              allowedPathways.includes(
                String(pathway)
              )
          )
        : [];

    // ==========================================
    // 10. SIMPAN ASSESSMENT
    // ==========================================

    const {
      data: savedAssessment,
      error: assessmentError,
    } = await supabase
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
        recommended_pathways:
          recommendedPathways,
        explanation: String(
          assessment.explanation || ""
        ),
        confidence,
        model_name: modelName,
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
          error:
            "AI berhasil menganalisis, tetapi hasil gagal disimpan.",
          details: assessmentError.message,
          assessment,
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // 11. SUCCESS
    // ==========================================

    return NextResponse.json({
      assessment: savedAssessment,
      model: modelName,
    });
  } catch (e: any) {
    console.error(
      "ReFarm AI assessment error:",
      e
    );

    const message =
      e?.message ||
      "AI assessment gagal.";

    // ==========================================
    // GEMINI TEMPORARY FAILURE
    // ==========================================

    if (isTemporaryGeminiError(e)) {
      return NextResponse.json(
        {
          error:
            "ReFarm AI sedang mengalami lonjakan penggunaan. Silakan coba lagi beberapa saat.",
          details: message,
        },
        {
          status: 503,
        }
      );
    }

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}
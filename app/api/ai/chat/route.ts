import { NextResponse } from "next/server";
import { gemini } from "@/lib/gemini/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let context: any = {
      role: user?.user_metadata?.role || null,
    };

    if (user) {
      const { data: surplus } = await supabase
        .from("surplus_listings")
        .select(
          "material_name,quantity,unit,condition,status"
        )
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      context.surplus = surplus || [];
    }

    const model = gemini().getGenerativeModel({
      model:
        process.env.GEMINI_MODEL || "gemini-3.6-flash",
    });

    const prompt = `
Anda adalah ReFarm AI, asisten AI untuk platform
circular agricultural supply chain ReFarm Loop.

Tugas Anda:
- Memahami masalah atau surplus yang disampaikan pengguna.
- Memberikan rekomendasi yang praktis dan actionable.
- Menggunakan data database yang diberikan jika tersedia.
- Jangan mengarang partner, harga, transaksi, kapasitas,
  lokasi, atau ketersediaan.
- Jika informasi tidak tersedia di database, katakan
  bahwa informasi tersebut belum tersedia.
- Jangan mengklaim suatu material aman untuk pakan,
  kompos, pangan, atau penggunaan lain sebagai bentuk
  sertifikasi. Anda hanya memberikan advisory awal.
- Jika relevan, sarankan langkah berikutnya yang dapat
  dilakukan pengguna di ReFarm Loop.
- Jawab dalam Bahasa Indonesia.
- Jawab secara ringkas, jelas, dan mudah dipahami.

Database context:
${JSON.stringify(context)}

User:
${message}
`;

    const result = await model.generateContent(prompt);

    const reply = result.response.text();

    return NextResponse.json({
      reply,
    });
  } catch (e: any) {
    console.error("ReFarm AI chat error:", e);

    return NextResponse.json(
      {
        error: e?.message || "Chat AI gagal",
      },
      {
        status: 500,
      }
    );
  }
}
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_PATHWAYS = [
  "animal_feed",
  "compost",
  "organic_fertilizer",
  "food_processing",
  "bioconversion",
  "other",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    // =========================
    // AUTH
    // =========================
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // =========================
    // GET TRANSACTION
    // =========================
    const { data: transaction, error: transactionError } =
      await supabase
        .from("transactions")
        .select(`
          id,
          surplus_id,
          buyer_id,
          status,
          quantity
        `)
        .eq("id", id)
        .eq("buyer_id", user.id)
        .single();

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    // =========================
    // VALIDATE STATUS
    // =========================
    if (
      transaction.status !== "paid" &&
      transaction.status !== "in_collection"
    ) {
      return NextResponse.json(
        {
          error:
            "Recovery belum dapat dicatat untuk status transaksi ini.",
        },
        { status: 400 }
      );
    }

    // =========================
    // CHECK EXISTING RECORD
    // =========================
    const { data: existingRecord, error: existingError } =
      await supabase
        .from("recovery_records")
        .select("id")
        .eq("transaction_id", transaction.id)
        .eq("recovery_partner_id", user.id)
        .maybeSingle();

    if (existingError) {
      console.error(
        "CHECK RECOVERY RECORD ERROR:",
        existingError
      );

      return NextResponse.json(
        { error: "Gagal memeriksa recovery record." },
        { status: 500 }
      );
    }

    if (existingRecord) {
      return NextResponse.json(
        {
          error: "Recovery untuk transaksi ini sudah dicatat.",
        },
        { status: 409 }
      );
    }

    // =========================
    // REQUEST BODY
    // =========================
    const body = await request.json();

    const {
      pathway,
      input_quantity,
      output_quantity,
      recovered_at,
      notes,
    } = body;

    // =========================
    // VALIDATE PATHWAY
    // =========================
    if (!pathway || !ALLOWED_PATHWAYS.includes(pathway)) {
      return NextResponse.json(
        { error: "Pathway recovery tidak valid." },
        { status: 400 }
      );
    }

    // =========================
    // VALIDATE QUANTITY
    // =========================
    const inputQuantity = Number(input_quantity);
    const outputQuantity = Number(output_quantity);

    if (!Number.isFinite(inputQuantity) || inputQuantity <= 0) {
      return NextResponse.json(
        { error: "Input quantity harus lebih dari 0." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(outputQuantity) || outputQuantity < 0) {
      return NextResponse.json(
        { error: "Output quantity tidak valid." },
        { status: 400 }
      );
    }

    if (outputQuantity > inputQuantity) {
      return NextResponse.json(
        {
          error:
            "Output quantity tidak boleh lebih besar dari input quantity.",
        },
        { status: 400 }
      );
    }

    // =========================
    // VALIDATE RECOVERED DATE
    // =========================
    let recoveredAt: string | null = null;

    if (recovered_at) {
      const date = new Date(recovered_at);

      if (Number.isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Tanggal recovery tidak valid." },
          { status: 400 }
        );
      }

      recoveredAt = date.toISOString();
    }

    // =========================
    // INSERT RECOVERY RECORD
    // =========================
    const { data: recoveryRecord, error: recoveryError } =
      await supabase
        .from("recovery_records")
        .insert({
          transaction_id: transaction.id,
          recovery_partner_id: user.id,
          pathway,
          input_quantity: inputQuantity,
          output_quantity: outputQuantity,
          recovered_at: recoveredAt,
          notes: notes?.trim() || null,
        })
        .select(`
          id,
          transaction_id,
          recovery_partner_id,
          pathway,
          input_quantity,
          output_quantity,
          recovered_at,
          notes,
          created_at
        `)
        .single();

    if (recoveryError || !recoveryRecord) {
      console.error(
        "INSERT RECOVERY RECORD ERROR:",
        recoveryError
      );

      return NextResponse.json(
        {
          error:
            recoveryError?.message ||
            "Gagal menyimpan recovery record.",
        },
        { status: 500 }
      );
    }

    // =========================
    // UPDATE TRANSACTION
    // =========================
    const { error: transactionUpdateError } =
      await supabase
        .from("transactions")
        .update({
          status: "completed",
        })
        .eq("id", transaction.id)
        .eq("buyer_id", user.id);

    if (transactionUpdateError) {
      console.error(
        "UPDATE TRANSACTION STATUS ERROR:",
        transactionUpdateError
      );

      return NextResponse.json(
        {
          error:
            "Recovery tersimpan, tetapi status transaksi gagal diperbarui.",
          recovery_record: recoveryRecord,
        },
        { status: 500 }
      );
    }

    // =========================
    // SUCCESS
    // =========================
    return NextResponse.json(
      {
        success: true,
        message: "Recovery berhasil dicatat.",
        recovery_record: recoveryRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST RECOVERY RECORD ERROR:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// =========================================================
// GET — AMBIL DAFTAR COLLECTOR
// =========================================================

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const { data: collectors, error } =
      await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          phone,
          address,
          latitude,
          longitude
        `)
        .eq("role", "collector")
        .order("full_name", {
          ascending: true,
        });

    if (error) {
      console.error(
        "GET COLLECTORS ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data Collector.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      collectors: collectors ?? [],
    });
  } catch (error) {
    console.error(
      "GET COLLECTORS EXCEPTION:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}

// =========================================================
// POST — ASSIGN COLLECTOR & CREATE PICKUP
// =========================================================

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      transactionId: string;
    }>;
  }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const { transactionId } =
      await context.params;

    const body = await request.json();

    const collectorId = body.collector_id;

    if (!collectorId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Collector belum dipilih.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // GET TRANSACTION
    // =====================================================

    const { data: transaction, error: transactionError } =
      await supabase
        .from("transactions")
        .select(`
          id,
          surplus_id,
          buyer_id,
          supplier_id,
          quantity,
          status
        `)
        .eq("id", transactionId)
        .eq("buyer_id", user.id)
        .single();

    if (transactionError || !transaction) {
      console.error(
        "TRANSACTION NOT FOUND:",
        transactionError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Transaction tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // VALIDATE STATUS
    // =====================================================

    if (transaction.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message:
            `Transaction tidak dapat dimulai karena status saat ini adalah ${transaction.status}.`,
        },
        { status: 400 }
      );
    }

    // =====================================================
    // CHECK EXISTING PICKUP
    // =====================================================

    const { data: existingPickup } =
      await supabase
        .from("pickups")
        .select("id, status, collector_id")
        .eq(
          "transaction_id",
          transaction.id
        )
        .maybeSingle();

    if (existingPickup) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pickup untuk transaction ini sudah dibuat.",
          pickup: existingPickup,
        },
        { status: 409 }
      );
    }

    // =====================================================
    // VALIDATE COLLECTOR
    // =====================================================

    const { data: collector, error: collectorError } =
      await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          role,
          phone,
          address,
          latitude,
          longitude
        `)
        .eq("id", collectorId)
        .eq("role", "collector")
        .single();

    if (collectorError || !collector) {
      console.error(
        "COLLECTOR NOT FOUND:",
        collectorError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Collector tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // GET SUPPLIER PROFILE
    // =====================================================

    const {
      data: supplierProfile,
      error: supplierError,
    } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        address,
        latitude,
        longitude
      `)
      .eq("id", transaction.supplier_id)
      .maybeSingle();

    if (supplierError) {
      console.error(
        "SUPPLIER PROFILE ERROR:",
        supplierError
      );
    }

    if (!supplierProfile) {
      console.warn(
        "SUPPLIER PROFILE NOT FOUND:",
        transaction.supplier_id
      );
    }

    // =====================================================
    // CREATE PICKUP
    // =====================================================

    const pickupPayload = {
      transaction_id: transaction.id,

      collector_id: collector.id,

      status: "scheduled",

      scheduled_at: null,

      pickup_latitude:
        supplierProfile?.latitude ?? null,

      pickup_longitude:
        supplierProfile?.longitude ?? null,

      delivery_latitude:
        collector.latitude ?? null,

      delivery_longitude:
        collector.longitude ?? null,

      actual_quantity: null,

      pickup_proof_path: null,

      delivery_proof_path: null,
    };

    const {
      data: pickup,
      error: pickupError,
    } = await supabase
      .from("pickups")
      .insert(pickupPayload)
      .select()
      .single();

    if (pickupError || !pickup) {
      console.error(
        "CREATE PICKUP ERROR:",
        pickupError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            pickupError?.message ||
            "Gagal membuat pickup.",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // CREATE INITIAL PICKUP EVENT
    // =====================================================

    const { error: eventError } =
      await supabase
        .from("pickup_events")
        .insert({
          pickup_id: pickup.id,
          status: "scheduled",
          latitude:
            supplierProfile?.latitude ?? null,
          longitude:
            supplierProfile?.longitude ?? null,
          note: "Pickup dibuat dan Collector ditugaskan.",
          proof_path: null,
        });

    if (eventError) {
      console.error(
        "CREATE PICKUP EVENT ERROR:",
        eventError
      );

      // Pickup sudah berhasil dibuat.
      // Jangan menggagalkan seluruh transaksi.
    }

    // =====================================================
    // UPDATE TRANSACTION
    // =====================================================

    const {
      error: updateTransactionError,
    } = await supabase
      .from("transactions")
      .update({
        status: "in_collection",
      })
      .eq("id", transaction.id)
      .eq("buyer_id", user.id);

    if (updateTransactionError) {
      console.error(
        "UPDATE TRANSACTION ERROR:",
        updateTransactionError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Pickup berhasil dibuat tetapi status transaction gagal diperbarui.",
          pickup,
        },
        { status: 500 }
      );
    }

    // =====================================================
    // SUCCESS
    // =====================================================

    return NextResponse.json({
      success: true,
      message:
        "Collector berhasil ditugaskan.",
      pickup,
    });
  } catch (error) {
    console.error(
      "START COLLECTION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// =========================================================
// GET /api/transactions
// Mengambil transaction milik supplier/user yang sedang login
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
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // -----------------------------------------------------
    // 1. Ambil transaction milik user
    // -----------------------------------------------------

    const { data: transactions, error: transactionError } =
      await supabase
        .from("transactions")
        .select(
          `
          id,
          surplus_id,
          buyer_id,
          supplier_id,
          quantity,
          unit_price,
          gross_amount,
          platform_fee,
          payment_fee,
          supplier_amount,
          status,
          created_at,
          updated_at,
          match_id
        `
        )
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false });

    if (transactionError) {
      console.error(
        "GET TRANSACTIONS ERROR:",
        transactionError
      );

      return NextResponse.json(
        {
          success: false,
          error: transactionError.message,
        },
        { status: 500 }
      );
    }

    const transactionRows = transactions ?? [];

    // -----------------------------------------------------
    // 2. Kalau belum ada transaction
    // -----------------------------------------------------

    if (transactionRows.length === 0) {
      return NextResponse.json({
        success: true,
        transactions: [],
      });
    }

    // -----------------------------------------------------
    // 3. Ambil surplus terkait
    // Schema surplus yang sudah kita pastikan:
    // id, supplier_id, material_name, quantity, unit,
    // condition, location_text
    // -----------------------------------------------------

    const surplusIds = [
      ...new Set(
        transactionRows
          .map((transaction) => transaction.surplus_id)
          .filter(Boolean)
      ),
    ];

    const { data: surplusRows, error: surplusError } =
      surplusIds.length > 0
        ? await supabase
            .from("surplus_listings")
            .select(
              "id, material_name, quantity, unit, condition, location_text"
            )
            .in("id", surplusIds)
        : { data: [], error: null };

    if (surplusError) {
      console.error(
        "GET TRANSACTION SURPLUS ERROR:",
        surplusError
      );
    }

    // -----------------------------------------------------
    // 4. Ambil recovery partner
    //
    // Kita menggunakan select("*") supaya route tidak
    // mengasumsikan nama kolom tertentu pada
    // recovery_partner_profiles.
    // -----------------------------------------------------

    const buyerIds = [
      ...new Set(
        transactionRows
          .map((transaction) => transaction.buyer_id)
          .filter(Boolean)
      ),
    ];

    const { data: partnerRows, error: partnerError } =
      buyerIds.length > 0
        ? await supabase
            .from("recovery_partner_profiles")
            .select("*")
            .in("id", buyerIds)
        : { data: [], error: null };

    if (partnerError) {
      console.error(
        "GET TRANSACTION PARTNER ERROR:",
        partnerError
      );
    }

    // -----------------------------------------------------
    // 5. Helper untuk mencari nama partner
    // -----------------------------------------------------

    function getPartnerName(partner: any, buyerId: string) {
      if (!partner) {
        return `Partner ${buyerId.slice(0, 8)}`;
      }

      return (
        partner.name ??
        partner.business_name ??
        partner.company_name ??
        partner.organization_name ??
        partner.partner_name ??
        `Partner ${buyerId.slice(0, 8)}`
      );
    }

    // -----------------------------------------------------
    // 6. Gabungkan data
    // -----------------------------------------------------

    const formattedTransactions = transactionRows.map(
      (transaction) => {
        const surplus = surplusRows?.find(
          (item) => item.id === transaction.surplus_id
        );

        const partner = partnerRows?.find(
          (item) => item.id === transaction.buyer_id
        );

        return {
          id: transaction.id,

          date: transaction.created_at,

          surplus: surplus?.material_name ?? "Surplus",

          quantity: Number(transaction.quantity ?? 0),

          unit: surplus?.unit ?? "unit",

          partner: getPartnerName(
            partner,
            transaction.buyer_id
          ),

          // Untuk sekarang pathway/recovery belum disimpan
          // langsung di transactions.
          recovery: surplus?.condition ?? "Recovery",

          // gross_amount adalah generated column
          amount: Number(transaction.gross_amount ?? 0),

          status: transaction.status,

          payment:
            transaction.status === "paid" ||
            transaction.status === "completed"
              ? "Paid"
              : transaction.status === "refunded"
              ? "Refunded"
              : "Waiting",

          // Data tambahan kalau nanti dibutuhkan
          surplus_id: transaction.surplus_id,
          buyer_id: transaction.buyer_id,
          supplier_id: transaction.supplier_id,
          match_id: transaction.match_id,
          unit_price: Number(
            transaction.unit_price ?? 0
          ),
          platform_fee: Number(
            transaction.platform_fee ?? 0
          ),
          payment_fee: Number(
            transaction.payment_fee ?? 0
          ),
          supplier_amount: Number(
            transaction.supplier_amount ?? 0
          ),
          updated_at: transaction.updated_at,
        };
      }
    );

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.error("GET /api/transactions ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan server.",
      },
      { status: 500 }
    );
  }
}

// =========================================================
// POST /api/transactions
// Membuat transaction baru
// =========================================================

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      match_id,
      surplus_id,
      recovery_partner_id,
      quantity,
    } = body;

    if (
      !match_id ||
      !surplus_id ||
      !recovery_partner_id ||
      !quantity
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Data transaction belum lengkap.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // Validasi match
    // -----------------------------------------------------

    const { data: match, error: matchError } =
      await supabase
        .from("matches")
        .select("id, surplus_id, status")
        .eq("id", match_id)
        .maybeSingle();

    if (matchError) {
      console.error(
        "MATCH VALIDATION ERROR:",
        matchError
      );

      return NextResponse.json(
        {
          success: false,
          error: matchError.message,
        },
        { status: 500 }
      );
    }

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: "Match tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (match.surplus_id !== surplus_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Surplus tidak sesuai dengan match.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // Validasi surplus
    // -----------------------------------------------------

    const { data: surplus, error: surplusError } =
      await supabase
        .from("surplus_listings")
        .select(
          "id, supplier_id, material_name, quantity, unit, status"
        )
        .eq("id", surplus_id)
        .maybeSingle();

    if (surplusError) {
      console.error(
        "SURPLUS VALIDATION ERROR:",
        surplusError
      );

      return NextResponse.json(
        {
          success: false,
          error: surplusError.message,
        },
        { status: 500 }
      );
    }

    if (!surplus) {
      return NextResponse.json(
        {
          success: false,
          error: "Surplus tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (surplus.supplier_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Kamu tidak memiliki akses ke surplus ini.",
        },
        { status: 403 }
      );
    }

    // -----------------------------------------------------
    // Validasi recovery partner
    // -----------------------------------------------------

    const { data: recoveryPartner, error: partnerError } =
      await supabase
        .from("recovery_partner_profiles")
        .select("*")
        .eq("id", recovery_partner_id)
        .maybeSingle();

    if (partnerError) {
      console.error(
        "PARTNER VALIDATION ERROR:",
        partnerError
      );

      return NextResponse.json(
        {
          success: false,
          error: partnerError.message,
        },
        { status: 500 }
      );
    }

    if (!recoveryPartner) {
      return NextResponse.json(
        {
          success: false,
          error: "Recovery partner tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------------------
    // Cek apakah transaction untuk match ini sudah ada
    // -----------------------------------------------------

    const { data: existingTransaction } =
      await supabase
        .from("transactions")
        .select("id, status")
        .eq("match_id", match_id)
        .maybeSingle();

    if (existingTransaction) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Transaction untuk matching ini sudah dibuat.",
          transaction: existingTransaction,
        },
        { status: 409 }
      );
    }

    // -----------------------------------------------------
    // Buyer ID = recovery partner
    //
    // gross_amount dan supplier_amount TIDAK dimasukkan
    // karena keduanya generated column.
    // -----------------------------------------------------

    const transactionPayload = {
      match_id: match_id,
      surplus_id: surplus_id,
      buyer_id: recovery_partner_id,
      supplier_id: user.id,
      quantity: Number(quantity),
      unit_price: 0,
      platform_fee: 0,
      payment_fee: 0,
      status: "pending",
    };

    console.log(
      "TRANSACTION PAYLOAD:",
      transactionPayload
    );

    const { data: transaction, error: insertError } =
      await supabase
        .from("transactions")
        .insert(transactionPayload)
        .select()
        .single();

    console.log(
      "TRANSACTION INSERT ERROR:",
      insertError
    );

    if (insertError) {
      return NextResponse.json(
        {
          success: false,
          error: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Transaction berhasil dibuat.",
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/transactions ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan server.",
      },
      { status: 500 }
    );
  }
}
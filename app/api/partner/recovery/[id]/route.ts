import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    // =====================================================
    // AUTH
    // =====================================================
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("AUTH ERROR:", authError);

      return NextResponse.json(
        {
          error: "Gagal membaca sesi login.",
          detail: authError.message,
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "User belum login.",
        },
        { status: 401 }
      );
    }

    console.log("=================================");
    console.log("RECOVERY API");
    console.log("USER:", user.id);
    console.log("TRANSACTION:", id);
    console.log("=================================");

    // =====================================================
    // GET TRANSACTION
    // =====================================================
    const {
      data: transaction,
      error: transactionError,
    } = await supabase
      .from("transactions")
      .select(`
        id,
        surplus_id,
        match_id,
        buyer_id,
        quantity,
        status
      `)
      .eq("id", id)
      .maybeSingle();

    if (transactionError) {
      console.error(
        "TRANSACTION QUERY ERROR:",
        transactionError
      );

      return NextResponse.json(
        {
          error: "Gagal mengambil transaksi.",
          detail: transactionError.message,
        },
        { status: 500 }
      );
    }

    if (!transaction) {
      console.error(
        "TRANSACTION NOT FOUND:",
        id
      );

      return NextResponse.json(
        {
          error: "Transaksi tidak ditemukan.",
          transaction_id: id,
        },
        { status: 404 }
      );
    }

    console.log(
      "TRANSACTION FOUND:",
      transaction
    );

    // =====================================================
    // VERIFY BUYER
    // =====================================================
    if (transaction.buyer_id !== user.id) {
      console.error(
        "BUYER MISMATCH:",
        {
          transactionBuyer:
            transaction.buyer_id,

          currentUser: user.id,
        }
      );

      return NextResponse.json(
        {
          error:
            "Transaksi ini bukan milik recovery partner yang sedang login.",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // GET SURPLUS
    // =====================================================
    const {
      data: surplus,
      error: surplusError,
    } = await supabase
      .from("surplus_listings")
      .select(`
        id,
        material_name,
        quantity,
        unit,
        condition
      `)
      .eq("id", transaction.surplus_id)
      .maybeSingle();

    if (surplusError) {
      console.error(
        "SURPLUS QUERY ERROR:",
        surplusError
      );

      return NextResponse.json(
        {
          error: "Gagal mengambil data surplus.",
          detail: surplusError.message,
          surplus_id: transaction.surplus_id,
        },
        { status: 500 }
      );
    }

    if (!surplus) {
      console.error(
        "SURPLUS NOT FOUND:",
        transaction.surplus_id
      );

      return NextResponse.json(
        {
          error: "Data surplus tidak ditemukan.",
          surplus_id: transaction.surplus_id,
        },
        { status: 404 }
      );
    }

    console.log(
      "SURPLUS FOUND:",
      surplus
    );

    // =====================================================
    // DEFAULT PATHWAY
    // =====================================================
    let pathway = "other";

    // =====================================================
    // GET MATCH
    // =====================================================
    if (transaction.match_id) {
      const {
        data: match,
        error: matchError,
      } = await supabase
        .from("matches")
        .select(`
          id,
          demand_id
        `)
        .eq("id", transaction.match_id)
        .maybeSingle();

      if (matchError) {
        console.error(
          "MATCH QUERY ERROR:",
          matchError
        );
      }

      if (match) {
        console.log(
          "MATCH FOUND:",
          match
        );

        // =================================================
        // GET DEMAND
        // =================================================
        if (match.demand_id) {
          const {
            data: demand,
            error: demandError,
          } = await supabase
            .from("material_demands")
            .select(`
              id,
              pathway,
              recovery_partner_id
            `)
            .eq("id", match.demand_id)
            .maybeSingle();

          if (demandError) {
            console.error(
              "DEMAND QUERY ERROR:",
              demandError
            );
          }

          if (demand) {
            console.log(
              "DEMAND FOUND:",
              demand
            );

            if (
              demand.recovery_partner_id ===
              user.id
            ) {
              pathway =
                demand.pathway ?? "other";
            }
          }
        }
      }
    }

    // =====================================================
    // RESPONSE
    // =====================================================
    return NextResponse.json({
      transaction: {
        id: transaction.id,
        quantity: transaction.quantity,
        status: transaction.status,
        material_name:
          surplus.material_name,
        unit: surplus.unit,
        condition: surplus.condition,
        pathway,
      },
    });
  } catch (error) {
    console.error(
      "RECOVERY API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Terjadi kesalahan server.",
      },
      { status: 500 }
    );
  }
}
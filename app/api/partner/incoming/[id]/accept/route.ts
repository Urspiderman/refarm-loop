import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const s = await createClient();

    const {
      data: { user },
    } = await s.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    /*
     * 1. Ambil match
     */
    const { data: match, error: matchError } =
      await s
        .from("matches")
        .select(`
          id,
          surplus_id,
          demand_id,
          status
        `)
        .eq("id", id)
        .single();

    if (matchError || !match) {
      return NextResponse.json(
        {
          error: "Match tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * 2. Ambil demand
     *
     * Pastikan demand memang milik
     * Recovery Partner yang sedang login.
     */
    const { data: demand, error: demandError } =
      await s
        .from("material_demands")
        .select(`
          id,
          recovery_partner_id,
          material_name,
          pathway,
          quantity_needed,
          capacity_available_kg,
          active
        `)
        .eq("id", match.demand_id)
        .eq("recovery_partner_id", user.id)
        .single();

    if (demandError || !demand) {
      return NextResponse.json(
        {
          error:
            "Anda tidak memiliki akses ke request ini.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * 3. Ambil surplus
     */
    const { data: surplus, error: surplusError } =
      await s
        .from("surplus_listings")
        .select(`
          id,
          supplier_id,
          material_name,
          quantity,
          unit,
          condition,
          location_text,
          status
        `)
        .eq("id", match.surplus_id)
        .single();

    if (surplusError || !surplus) {
      return NextResponse.json(
        {
          error: "Data surplus tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * 4. Pastikan match masih bisa diterima
     */
    if (match.status === "accepted") {
      return NextResponse.json(
        {
          error: "Request ini sudah diterima.",
        },
        {
          status: 409,
        }
      );
    }

    if (match.status === "rejected") {
      return NextResponse.json(
        {
          error: "Request ini sudah ditolak.",
        },
        {
          status: 409,
        }
      );
    }

    if (match.status === "completed") {
      return NextResponse.json(
        {
          error: "Request ini sudah selesai.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * 5. Cek apakah transaksi sudah ada
     *
     * Ini penting supaya tidak terjadi
     * duplicate transaction / error 409.
     */
    const { data: existingTransaction } =
      await s
        .from("transactions")
        .select(`
          id,
          match_id,
          status
        `)
        .eq("match_id", match.id)
        .maybeSingle();

    if (existingTransaction) {
      /*
       * Kalau transaction sudah ada tetapi
       * match belum accepted, sinkronkan status.
       */
      if (match.status !== "accepted") {
        const { error: updateMatchError } =
          await s
            .from("matches")
            .update({
              status: "accepted",
            })
            .eq("id", match.id);

        if (updateMatchError) {
          return NextResponse.json(
            {
              error:
                "Transaksi sudah ada, tetapi status match gagal diperbarui.",
              detail: updateMatchError.message,
            },
            {
              status: 500,
            }
          );
        }
      }

      return NextResponse.json({
        success: true,
        already_exists: true,
        transaction_id: existingTransaction.id,
        message: "Transaksi sudah tersedia.",
      });
    }

    /*
     * 6. Update match menjadi accepted
     */
    const { error: updateMatchError } =
      await s
        .from("matches")
        .update({
          status: "accepted",
        })
        .eq("id", match.id);

    if (updateMatchError) {
      return NextResponse.json(
        {
          error: "Gagal menerima request.",
          detail: updateMatchError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * 7. Buat transaction
     *
     * buyer_id = Recovery Partner
     * supplier_id = pemilik surplus
     *
     * Jangan memasukkan:
     * - gross_amount
     * - supplier_amount
     *
     * karena kedua kolom tersebut generated column.
     */
    const transactionPayload = {
      match_id: match.id,
      surplus_id: surplus.id,
      buyer_id: user.id,
      supplier_id: surplus.supplier_id,
      quantity: Number(surplus.quantity),
      unit_price: 0,
      platform_fee: 0,
      payment_fee: 0,
      status: "pending",
    };

    const { data: transaction, error: transactionError } =
      await s
        .from("transactions")
        .insert(transactionPayload)
        .select(`
          id,
          match_id,
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
          updated_at
        `)
        .single();

    /*
     * 8. Kalau transaction gagal,
     * kembalikan match ke proposed.
     */
    if (transactionError || !transaction) {
      await s
        .from("matches")
        .update({
          status: "proposed",
        })
        .eq("id", match.id);

      return NextResponse.json(
        {
          error: "Gagal membuat transaksi.",
          detail:
            transactionError?.message ||
            "Transaction tidak berhasil dibuat.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * 9. Response sukses
     */
    return NextResponse.json(
      {
        success: true,
        message:
          "Request berhasil diterima dan transaksi berhasil dibuat.",
        transaction,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "ACCEPT PARTNER REQUEST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Terjadi kesalahan pada server.",
      },
      {
        status: 500,
      }
    );
  }
}
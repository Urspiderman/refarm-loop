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
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Match ID tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "User belum login.",
        },
        { status: 401 }
      );
    }

    const {
      data: match,
      error: matchError,
    } = await supabase
      .from("matches")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (matchError) {
      console.error(
        "MATCH QUERY ERROR:",
        matchError
      );

      return NextResponse.json(
        {
          error: "Gagal mengambil match.",
          detail: matchError.message,
        },
        { status: 500 }
      );
    }

    if (!match) {
      return NextResponse.json(
        {
          error: "Match tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (!match.surplus_id) {
      return NextResponse.json(
        {
          error:
            "Match tidak memiliki surplus_id.",
        },
        { status: 400 }
      );
    }

    const {
      data: surplus,
      error: surplusError,
    } = await supabase
      .from("surplus_listings")
      .select(
        `
        id,
        supplier_id,
        material_name,
        quantity,
        unit,
        condition,
        location_text
        `
      )
      .eq("id", match.surplus_id)
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
        },
        { status: 500 }
      );
    }

    if (!surplus) {
      return NextResponse.json(
        {
          error: "Data surplus tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (surplus.supplier_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Anda tidak memiliki akses ke surplus ini.",
        },
        { status: 403 }
      );
    }

    if (match.status === "accepted") {
      return NextResponse.json(
        {
          error:
            "Match ini sudah diterima oleh recovery partner.",
        },
        { status: 409 }
      );
    }

    if (match.status === "rejected") {
      return NextResponse.json(
        {
          error:
            "Match ini sudah ditolak.",
        },
        { status: 409 }
      );
    }

    if (match.status === "proposed") {
      return NextResponse.json({
        success: true,
        already_proposed: true,
        match_id: match.id,
        status: "proposed",
        message:
          "Match sudah diajukan dan sedang menunggu recovery partner.",
      });
    }

    const {
      data: updatedMatch,
      error: updateError,
    } = await supabase
      .from("matches")
      .update({
        status: "proposed",
      })
      .eq("id", match.id)
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error(
        "MATCH UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          error: "Gagal mengajukan match.",
          detail: updateError.message,
          code: updateError.code,
          hint: updateError.hint,
        },
        { status: 500 }
      );
    }

    if (!updatedMatch) {
      return NextResponse.json(
        {
          error:
            "Match tidak berhasil diperbarui.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      already_proposed: false,
      match_id: updatedMatch.id,
      status: updatedMatch.status,
      message:
        "Match berhasil diajukan dan sedang menunggu recovery partner.",
    });
  } catch (error) {
    console.error(
      "POST /api/discover/[id]/request ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Terjadi kesalahan pada server.",
        detail:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}
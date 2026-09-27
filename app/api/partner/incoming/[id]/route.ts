import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Match ID tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const action = body?.action;

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Action tidak valid.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ==========================================
    // 1. CEK USER LOGIN
    // ==========================================
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "User belum login.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // 2. REJECT
    // ==========================================
    if (action === "reject") {
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("id, demand_id, surplus_id, status")
        .eq("id", id)
        .maybeSingle();

      if (matchError) {
        console.error("Reject match error:", matchError);

        return NextResponse.json(
          {
            success: false,
            error: matchError.message || "Gagal mengambil match.",
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

      // Pastikan demand memang milik partner yang login
      const { data: demand, error: demandError } = await supabase
        .from("material_demands")
        .select("id, recovery_partner_id")
        .eq("id", match.demand_id)
        .eq("recovery_partner_id", user.id)
        .maybeSingle();

      if (demandError) {
        console.error("Reject demand error:", demandError);

        return NextResponse.json(
          {
            success: false,
            error: demandError.message || "Gagal memverifikasi demand.",
          },
          { status: 500 }
        );
      }

      if (!demand) {
        return NextResponse.json(
          {
            success: false,
            error: "Match ini bukan milik recovery partner kamu.",
          },
          { status: 403 }
        );
      }

      if (match.status !== "proposed") {
        return NextResponse.json(
          {
            success: false,
            error: `Match sudah diproses. Status saat ini: ${match.status}.`,
          },
          { status: 409 }
        );
      }

      const { data: updatedMatch, error: updateError } = await supabase
        .from("matches")
        .update({
          status: "rejected",
        })
        .eq("id", id)
        .select("id, demand_id, surplus_id, status")
        .single();

      if (updateError) {
        console.error("Reject update error:", updateError);

        return NextResponse.json(
          {
            success: false,
            error: updateError.message || "Gagal menolak match.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: "reject",
        match: updatedMatch,
      });
    }

    // ==========================================
    // 3. ACCEPT
    // ==========================================
    // Accept sekarang ditangani oleh RPC
    // SECURITY DEFINER di database.
    //
    // RPC akan:
    // - memverifikasi partner
    // - mengambil surplus
    // - membuat transaction
    // - mengubah match menjadi accepted
    // ==========================================

    const { data: result, error: rpcError } = await supabase.rpc(
      "accept_partner_match",
      {
        p_match_id: id,
      }
    );

    if (rpcError) {
      console.error("Accept partner match RPC error:", rpcError);

      return NextResponse.json(
        {
          success: false,
          error:
            rpcError.message ||
            "Gagal menerima match.",
          details: rpcError.details ?? null,
          hint: rpcError.hint ?? null,
          code: rpcError.code ?? null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        action: "accept",
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Partner incoming API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
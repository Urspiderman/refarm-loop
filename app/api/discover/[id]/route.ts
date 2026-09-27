import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    // =========================================================
    // 1. CEK USER LOGIN
    // =========================================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "User belum login.",
          detail: userError?.message ?? null,
        },
        { status: 401 }
      );
    }

    // =========================================================
    // 2. AMBIL MATCH
    // =========================================================

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
        "DETAIL MATCH QUERY ERROR:",
        matchError
      );

      return NextResponse.json(
        {
          error: "Gagal mengambil data match.",
          detail: matchError.message,
          code: matchError.code,
          hint: matchError.hint,
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

    if (!match.demand_id) {
      return NextResponse.json(
        {
          error:
            "Match tidak memiliki demand_id.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 3. AMBIL SURPLUS
    //
    // SESUAI SCHEMA DATABASE:
    // id
    // supplier_id
    // material_name
    // quantity
    // unit
    // condition
    // location_text
    // =========================================================

    const {
      data: surplusRaw,
      error: surplusError,
    } = await supabase
      .from("surplus_listings")
      .select(`
        id,
        supplier_id,
        material_name,
        quantity,
        unit,
        condition,
        location_text
      `)
      .eq("id", match.surplus_id)
      .maybeSingle();

    if (surplusError) {
      console.error(
        "DETAIL SURPLUS QUERY ERROR:",
        surplusError
      );

      return NextResponse.json(
        {
          error: "Gagal mengambil data surplus.",
          detail: surplusError.message,
          code: surplusError.code,
          hint: surplusError.hint,
        },
        { status: 500 }
      );
    }

    if (!surplusRaw) {
      return NextResponse.json(
        {
          error: "Data surplus tidak ditemukan.",
          surplus_id: match.surplus_id,
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 4. CEK PEMILIK SURPLUS
    // =========================================================

    if (
      surplusRaw.supplier_id !== user.id
    ) {
      return NextResponse.json(
        {
          error:
            "Anda tidak memiliki akses ke surplus ini.",
        },
        { status: 403 }
      );
    }

    // =========================================================
    // 5. NORMALISASI SURPLUS
    // =========================================================

    const surplus = {
      id: surplusRaw.id,
      supplier_id:
        surplusRaw.supplier_id,
      material_name:
        surplusRaw.material_name ?? "",
      quantity: Number(
        surplusRaw.quantity ?? 0
      ),
      unit:
        surplusRaw.unit ?? "kg",
      condition:
        surplusRaw.condition ?? null,
      location_text:
        surplusRaw.location_text ?? null,
    };

    // =========================================================
    // 6. AMBIL DEMAND
    // =========================================================

    const {
      data: demandRaw,
      error: demandError,
    } = await supabase
      .from("material_demands")
      .select("*")
      .eq("id", match.demand_id)
      .maybeSingle();

    if (demandError) {
      console.error(
        "DETAIL DEMAND QUERY ERROR:",
        demandError
      );

      return NextResponse.json(
        {
          error: "Gagal mengambil data demand.",
          detail: demandError.message,
          code: demandError.code,
          hint: demandError.hint,
        },
        { status: 500 }
      );
    }

    if (!demandRaw) {
      return NextResponse.json(
        {
          error: "Demand tidak ditemukan.",
          demand_id: match.demand_id,
        },
        { status: 404 }
      );
    }

    if (
      !demandRaw.recovery_partner_id
    ) {
      return NextResponse.json(
        {
          error:
            "Demand tidak memiliki recovery_partner_id.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 7. NORMALISASI DEMAND
    // =========================================================

    const demand = {
      id: demandRaw.id,
      recovery_partner_id:
        demandRaw.recovery_partner_id,
      material_name:
        demandRaw.material_name ?? "",
      pathway:
        demandRaw.pathway ?? "other",
      quantity_needed: Number(
        demandRaw.quantity_needed ?? 0
      ),
      capacity_available_kg:
        demandRaw.capacity_available_kg !==
          null &&
        demandRaw.capacity_available_kg !==
          undefined
          ? Number(
              demandRaw.capacity_available_kg
            )
          : null,
    };

    // =========================================================
    // 8. AMBIL RECOVERY PARTNER
    // =========================================================

    const {
      data: partnerRaw,
      error: partnerError,
    } = await supabase
      .from("recovery_partner_profiles")
      .select("*")
      .eq(
        "id",
        demand.recovery_partner_id
      )
      .maybeSingle();

    if (partnerError) {
      console.error(
        "DETAIL PARTNER QUERY ERROR:",
        partnerError
      );

      return NextResponse.json(
        {
          error:
            "Gagal mengambil data recovery partner.",
          detail: partnerError.message,
          code: partnerError.code,
          hint: partnerError.hint,
        },
        { status: 500 }
      );
    }

    if (!partnerRaw) {
      return NextResponse.json(
        {
          error:
            "Recovery partner tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 9. NORMALISASI PARTNER
    // =========================================================

    const partner = {
      id: partnerRaw.id,
      organization_name:
        partnerRaw.organization_name ??
        "Recovery Partner",
      description:
        partnerRaw.description ?? null,
      capacity_kg_per_week:
        partnerRaw.capacity_kg_per_week !==
          null &&
        partnerRaw.capacity_kg_per_week !==
          undefined
          ? Number(
              partnerRaw.capacity_kg_per_week
            )
          : null,
      service_radius_km:
        partnerRaw.service_radius_km !==
          null &&
        partnerRaw.service_radius_km !==
          undefined
          ? Number(
              partnerRaw.service_radius_km
            )
          : null,
      verified:
        Boolean(partnerRaw.verified),
    };

    // =========================================================
    // 10. NORMALISASI MATCH
    // =========================================================

    const normalizedMatch = {
      id: match.id,
      surplus_id:
        match.surplus_id,
      demand_id:
        match.demand_id,
      score: Number(
        match.score ?? 0
      ),
      compatibility_score:
        match.compatibility_score !==
          null &&
        match.compatibility_score !==
          undefined
          ? Number(
              match.compatibility_score
            )
          : null,
      quantity_score:
        match.quantity_score !==
          null &&
        match.quantity_score !==
          undefined
          ? Number(
              match.quantity_score
            )
          : null,
      distance_score:
        match.distance_score !==
          null &&
        match.distance_score !==
          undefined
          ? Number(
              match.distance_score
            )
          : null,
      capacity_score:
        match.capacity_score !==
          null &&
        match.capacity_score !==
          undefined
          ? Number(
              match.capacity_score
            )
          : null,
      status:
        match.status ?? "pending",
    };

    // =========================================================
    // 11. RESPONSE
    // =========================================================

    return NextResponse.json({
      success: true,
      match: normalizedMatch,
      surplus,
      demand,
      partner,
    });
  } catch (error) {
    console.error(
      "GET /api/discover/[id] ERROR:",
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
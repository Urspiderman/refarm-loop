import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // =========================
    // 1. CEK USER
    // =========================
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("DISCOVER USER ERROR:", userError);

      return NextResponse.json(
        {
          success: false,
          error: "Gagal mendapatkan data user.",
          detail: userError.message,
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User belum login.",
        },
        { status: 401 }
      );
    }

    // =========================
    // 2. AMBIL SURPLUS USER
    // =========================
    const { data: surplusData, error: surplusError } = await supabase
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
      .eq("supplier_id", user.id);

    if (surplusError) {
      console.error("DISCOVER SURPLUS ERROR:", surplusError);

      return NextResponse.json(
        {
          success: false,
          error: "Gagal mengambil data surplus.",
          detail: surplusError.message,
        },
        { status: 500 }
      );
    }

    const surplus = surplusData ?? [];

    if (surplus.length === 0) {
      return NextResponse.json({
        success: true,
        partners: [],
        surplus: [],
        meta: {
          totalPartners: 0,
          compatiblePartners: 0,
          notCompatiblePartners: 0,
        },
      });
    }

    // Untuk sementara gunakan surplus terbaru
    const activeSurplus = surplus[0];

    // =========================
    // 3. AMBIL SEMUA PARTNER
    // =========================
    const {
      data: partnersData,
      error: partnersError,
    } = await supabase
      .from("recovery_partner_profiles")
      .select(`
        id,
        organization_name,
        description,
        capacity_kg_per_week,
        service_radius_km,
        verified
      `)
      .order("organization_name", { ascending: true });

    if (partnersError) {
      console.error("DISCOVER PARTNER ERROR:", partnersError);

      return NextResponse.json(
        {
          success: false,
          error: "Gagal mengambil data recovery partner.",
          detail: partnersError.message,
        },
        { status: 500 }
      );
    }

    const partners = partnersData ?? [];

    // =========================
    // 4. AMBIL SEMUA DEMAND
    // =========================
    const {
      data: demandsData,
      error: demandsError,
    } = await supabase
      .from("material_demands")
      .select(`
        id,
        recovery_partner_id,
        material_name,
        pathway,
        quantity_needed,
        capacity_available_kg
      `);

    if (demandsError) {
      console.error("DISCOVER DEMAND ERROR:", demandsError);

      return NextResponse.json(
        {
          success: false,
          error: "Gagal mengambil data kebutuhan partner.",
          detail: demandsError.message,
        },
        { status: 500 }
      );
    }

    const demands = demandsData ?? [];

    // =========================
    // 5. MATCHING
    // =========================
    const materialName = String(
      activeSurplus.material_name ?? ""
    ).toLowerCase();

    const surplusQuantity = Number(
      activeSurplus.quantity ?? 0
    );

    const result = [];

    for (const partner of partners) {
      const partnerDemands = demands.filter(
        (demand) =>
          demand.recovery_partner_id === partner.id
      );

      let bestDemand = null;
      let bestScore = 0;

      for (const demand of partnerDemands) {
        const demandMaterial = String(
          demand.material_name ?? ""
        ).toLowerCase();

        let materialScore = 0;

        if (
          materialName &&
          demandMaterial &&
          materialName === demandMaterial
        ) {
          materialScore = 100;
        } else if (
          materialName &&
          demandMaterial &&
          (
            materialName.includes(demandMaterial) ||
            demandMaterial.includes(materialName)
          )
        ) {
          materialScore = 75;
        }

        const quantityNeeded = Number(
          demand.quantity_needed ?? 0
        );

        let quantityScore = 50;

        if (quantityNeeded > 0) {
          if (surplusQuantity >= quantityNeeded) {
            quantityScore = 100;
          } else {
            quantityScore = Math.max(
              0,
              Math.min(
                100,
                (surplusQuantity / quantityNeeded) * 100
              )
            );
          }
        }

        const capacityAvailable = Number(
          demand.capacity_available_kg ??
            partner.capacity_kg_per_week ??
            0
        );

        let capacityScore = 50;

        if (capacityAvailable > 0) {
          if (surplusQuantity <= capacityAvailable) {
            capacityScore = 100;
          } else {
            capacityScore = Math.max(
              0,
              Math.min(
                100,
                (capacityAvailable / surplusQuantity) * 100
              )
            );
          }
        }

        // Jarak belum dihitung karena koordinat belum digunakan
        const distanceScore = 50;

        const totalScore =
          materialScore * 0.5 +
          quantityScore * 0.2 +
          distanceScore * 0.15 +
          capacityScore * 0.15;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestDemand = demand;
        }
      }

      const compatible = bestDemand !== null && bestScore >= 50;

      result.push({
        id: partner.id,
        name: partner.organization_name,
        description: partner.description,
        capacityKgPerWeek: partner.capacity_kg_per_week,
        serviceRadiusKm: partner.service_radius_km,
        verified: partner.verified,

        material: bestDemand?.material_name ?? null,
        pathway: bestDemand?.pathway ?? null,

        compatible,
        score: Math.round(bestScore),

        demandId: bestDemand?.id ?? null,
        matchId: null,
      });
    }

    // =========================
    // 6. BUAT MATCH UNTUK YANG COMPATIBLE
    // =========================
    for (const item of result) {
      if (!item.compatible || !item.demandId) {
        continue;
      }

      // Cek apakah match sudah ada
      const {
        data: existingMatch,
        error: existingMatchError,
      } = await supabase
        .from("matches")
        .select("id")
        .eq("surplus_id", activeSurplus.id)
        .eq("demand_id", item.demandId)
        .maybeSingle();

      if (existingMatchError) {
        console.error(
          "DISCOVER EXISTING MATCH ERROR:",
          existingMatchError
        );
        continue;
      }

      if (existingMatch) {
        item.matchId = existingMatch.id;
        continue;
      }

      // Buat match baru
      const {
        data: newMatch,
        error: newMatchError,
      } = await supabase
        .from("matches")
        .insert({
          surplus_id: activeSurplus.id,
          demand_id: item.demandId,
          score: item.score,
          compatibility_score: item.score,
          quantity_score: 50,
          distance_score: 50,
          capacity_score: 50,
          status: "suggested",
        })
        .select("id")
        .single();

      if (newMatchError) {
        console.error(
          "DISCOVER CREATE MATCH ERROR:",
          newMatchError
        );
        continue;
      }

      item.matchId = newMatch.id;
    }

    // =========================
    // 7. SORTING
    // =========================
    result.sort((a, b) => {
      if (a.compatible !== b.compatible) {
        return a.compatible ? -1 : 1;
      }

      return b.score - a.score;
    });

    // =========================
    // 8. RESPONSE
    // =========================
    console.log("DISCOVER SUCCESS:", {
      userId: user.id,
      surplusId: activeSurplus.id,
      totalPartners: result.length,
      compatiblePartners: result.filter(
        (item) => item.compatible
      ).length,
    });

    return NextResponse.json({
      success: true,

      partners: result,

      surplus: activeSurplus,

      meta: {
        totalPartners: result.length,
        compatiblePartners: result.filter(
          (item) => item.compatible
        ).length,
        notCompatiblePartners: result.filter(
          (item) => !item.compatible
        ).length,
      },
    });
  } catch (error) {
    console.error("DISCOVER API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan pada server.",
        detail:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      { status: 500 }
    );
  }
}
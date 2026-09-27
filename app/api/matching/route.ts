import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import {
  calculateMatchScore,
  type AssessmentInput,
  type DemandInput,
  type SupplierLocation,
  type SurplusInput,
} from "@/lib/matching/engine";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const body = await request.json();

    const surplusId = String(
      body?.surplus_id ?? ""
    ).trim();

    if (!surplusId) {
      return NextResponse.json(
        {
          error: "surplus_id wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 1. Ambil surplus milik user.
     */

    const { data: surplus, error: surplusError } =
      await supabase
        .from("surplus_listings")
        .select(
          `
            id,
            supplier_id,
            material_name,
            quantity,
            unit,
            condition,
            status
          `
        )
        .eq("id", surplusId)
        .eq("supplier_id", user.id)
        .maybeSingle();

    if (surplusError) {
      console.error(
        "Surplus fetch error:",
        surplusError
      );

      return NextResponse.json(
        {
          error: surplusError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!surplus) {
      return NextResponse.json(
        {
          error: "Surplus tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * 2. Ambil AI assessment jika sudah tersedia.
     */

    const { data: assessment } = await supabase
      .from("material_assessments")
      .select(
        `
          material_type,
          condition,
          recovery_potential,
          confidence
        `
      )
      .eq("surplus_id", surplus.id)
      .maybeSingle();

    /*
     * 3. Ambil lokasi supplier.
     */

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select(
          `
            latitude,
            longitude
          `
        )
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Supplier location error:",
        profileError
      );
    }

    const supplierLocation: SupplierLocation = {
      latitude: profile?.latitude ?? null,
      longitude: profile?.longitude ?? null,
    };

    /*
     * 4. Ambil seluruh demand aktif.
     */

    const { data: demands, error: demandError } =
      await supabase
        .from("material_demands")
        .select(
          `
            id,
            recovery_partner_id,
            material_name,
            pathway,
            quantity_needed,
            capacity_available_kg,
            min_condition,
            latitude,
            longitude,
            active
          `
        )
        .eq("active", true);

    if (demandError) {
      console.error(
        "Demand fetch error:",
        demandError
      );

      return NextResponse.json(
        {
          error: demandError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!demands || demands.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Belum ada demand aktif.",
        matches: [],
      });
    }

    /*
     * 5. Hitung skor setiap demand.
     */

    const surplusInput: SurplusInput = {
      id: surplus.id,
      supplier_id: surplus.supplier_id,
      material_name: surplus.material_name,
      quantity: Number(surplus.quantity),
      condition: surplus.condition,
    };

    const assessmentInput: AssessmentInput | null =
      assessment
        ? {
            material_type:
              assessment.material_type,
            condition: assessment.condition,
            recovery_potential:
              assessment.recovery_potential,
            confidence: assessment.confidence,
          }
        : null;

    const calculatedMatches = demands
      .map((demand) => {
        const demandInput: DemandInput = {
          id: demand.id,
          recovery_partner_id:
            demand.recovery_partner_id,
          material_name: demand.material_name,
          pathway: demand.pathway,
          quantity_needed:
            Number(demand.quantity_needed),
          capacity_available_kg:
            demand.capacity_available_kg === null
              ? null
              : Number(demand.capacity_available_kg),
          min_condition:
            demand.min_condition,
          latitude: demand.latitude,
          longitude: demand.longitude,
        };

        return calculateMatchScore({
          surplus: surplusInput,
          assessment: assessmentInput,
          demand: demandInput,
          supplierLocation,
        });
      })
      /*
       * Jangan simpan kandidat yang sama sekali
       * tidak kompatibel dengan material.
       */
      .filter(
        (match) =>
          match.compatibility_score > 0
      )
      .sort(
        (a, b) =>
          b.score - a.score
      );

    /*
     * 6. Simpan ke matches.
     *
     * Upsert supaya menjalankan matching ulang
     * tidak membuat duplicate surplus-demand pair.
     */

    if (calculatedMatches.length > 0) {
      const rows = calculatedMatches.map(
        (match) => ({
          surplus_id: surplus.id,
          demand_id: match.demand_id,
          score: match.score,
          compatibility_score:
            match.compatibility_score,
          quantity_score:
            match.quantity_score,
          distance_score:
            match.distance_score,
          capacity_score:
            match.capacity_score,
          status: "proposed",
        })
      );

      const { error: matchError } =
        await supabase
          .from("matches")
          .upsert(rows, {
            onConflict:
              "surplus_id,demand_id",
          });

      if (matchError) {
        console.error(
          "Match insert error:",
          matchError
        );

        return NextResponse.json(
          {
            error: matchError.message,
          },
          {
            status: 500,
          }
        );
      }
    }

    return NextResponse.json({
      success: true,

      surplus: {
        id: surplus.id,
        material_name:
          surplus.material_name,
        quantity:
          surplus.quantity,
      },

      matches: calculatedMatches,

      total_matches:
        calculatedMatches.length,
    });
  } catch (error) {
    console.error(
      "Matching engine error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada matching engine.",
      },
      {
        status: 500,
      }
    );
  }
}
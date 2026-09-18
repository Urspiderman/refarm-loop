import { requireRole } from "@/lib/auth";
import Topbar from "@/components/topbar";
import { Recycle, Leaf } from "lucide-react";

export default async function Impact() {
  const { supabase } = await requireRole(["admin"]);

  const { data, error } = await supabase
    .from("impact_records")
    .select(
      "material_recovered_kg,estimated_co2e_avoided_kg,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error(
      "Failed to query impact_records:",
      error.message,
      error.details,
      error.hint,
      error.code
    );
  }

  const kg = (data || []).reduce(
    (a, x) => a + Number(x.material_recovered_kg || 0),
    0
  );

  const co2 = (data || []).reduce(
    (a, x) => a + Number(x.estimated_co2e_avoided_kg || 0),
    0
  );

  return (
    <>
      <Topbar
        title="Impact"
        subtitle="Circularity outcomes"
      />

      <div className="p-5 md:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <Recycle className="text-[var(--green-800)]" />

            <p className="mt-4 text-sm text-[var(--muted)]">
              Material recovered
            </p>

            <p className="mt-1 text-3xl font-black">
              {kg.toLocaleString("id-ID")} kg
            </p>
          </div>

          <div className="card p-6">
            <Leaf className="text-[var(--green-800)]" />

            <p className="mt-4 text-sm text-[var(--muted)]">
              Estimated CO₂e avoided
            </p>

            <p className="mt-1 text-3xl font-black">
              {co2.toLocaleString("id-ID")} kg
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
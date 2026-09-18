import { requireRole } from "@/lib/auth";
import Topbar from "@/components/topbar";
import { Package, ArrowDown } from "lucide-react";

export default async function MaterialFlow() {
  const { supabase } = await requireRole(["admin"]);

  const { data, error } = await supabase
    .from("surplus_listings")
    .select("id,material_name,quantity,unit,status,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error(
      "Failed to query surplus_listings:",
      error.message,
      error.details,
      error.hint,
      error.code
    );
  }

  return (
    <>
      <Topbar
        title="Material Flow"
        subtitle="Surplus moving through the circular loop"
      />

      <div className="p-5 md:p-8">
        <div className="flow-banner">
          <div>
            <span>SUPPLY</span>
            <strong>Surplus</strong>
          </div>

          <ArrowDown />

          <div>
            <span>INTELLIGENCE</span>
            <strong>AI + Matching</strong>
          </div>

          <ArrowDown />

          <div>
            <span>OPERATIONS</span>
            <strong>Pickup</strong>
          </div>

          <ArrowDown />

          <div>
            <span>RECOVERY</span>
            <strong>Recovered</strong>
          </div>
        </div>

        <div className="card mt-6 overflow-hidden">
          <div className="border-b border-[var(--line)] p-5 font-black">
            Latest Material Events
          </div>

          {data?.map((x) => (
            <div
              className="flex items-center gap-4 border-b border-[var(--line)] p-4 last:border-0"
              key={x.id}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint)]">
                <Package size={18} />
              </div>

              <div className="flex-1">
                <p className="font-bold">{x.material_name}</p>

                <p className="text-xs text-[var(--muted)]">
                  {x.quantity} {x.unit}
                </p>
              </div>

              <span className="pill">{x.status}</span>
            </div>
          ))}

          {!data?.length && (
            <div className="p-8 text-center text-sm text-[var(--muted)]">
              No material events found.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
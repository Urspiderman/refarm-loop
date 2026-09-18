import { requireRole } from "@/lib/auth";
import Topbar from "@/components/topbar";
import { Truck, CheckCircle2 } from "lucide-react";

export default async function Operations() {
  const { supabase } = await requireRole(["admin"]);

  const { data, error } = await supabase
    .from("pickups")
    .select("id,status,scheduled_at,actual_quantity")
    .order("scheduled_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error(
      "Failed to query pickups:",
      error.message,
      error.details,
      error.hint,
      error.code
    );
  }

  return (
    <>
      <Topbar
        title="Operations"
        subtitle="Pickup and logistics monitoring"
      />

      <div className="p-5 md:p-8">
        <div className="card overflow-hidden">
          {data?.length ? (
            data.map((x) => (
              <div
                className="flex items-center gap-4 border-b border-[var(--line)] p-4 last:border-0"
                key={x.id}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint)]">
                  {x.status === "delivered" ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Truck size={18} />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-bold">
                    Pickup {x.id.slice(0, 8)}
                  </p>

                  <p className="text-xs text-[var(--muted)]">
                    {x.scheduled_at
                      ? new Date(x.scheduled_at).toLocaleString("id-ID")
                      : "Schedule pending"}
                  </p>
                </div>

                <span className="pill">{x.status}</span>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-sm text-[var(--muted)]">
              Belum ada operasi pickup.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
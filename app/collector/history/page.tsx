import { requireRole } from "@/lib/auth";
import { CheckCircle2 } from "lucide-react";

export default async function History() {
  const { supabase, user } = await requireRole(["collector"]);

  const { data } = await supabase
    .from("pickups")
    .select("id,status,scheduled_at,actual_quantity")
    .eq("collector_id", user.id)
    .eq("status", "delivered")
    .order("scheduled_at", { ascending: false });

  return (
    <div className="page">
      <h1>Pickup History</h1>

      <p>Riwayat pengantaran yang sudah selesai.</p>

      <div className="mt-6 space-y-3">
        {data?.length ? (
          data.map((r) => (
            <div
              className="card flex items-center gap-4 p-4"
              key={r.id}
            >
              <CheckCircle2 className="text-[var(--green-800)]" />

              <div className="flex-1">
                <p className="font-black">
                  Pickup selesai
                </p>

                <p className="text-xs text-[var(--muted)]">
                  {r.actual_quantity || "-"} kg •{" "}
                  {r.scheduled_at
                    ? new Date(r.scheduled_at).toLocaleString(
                        "id-ID"
                      )
                    : "-"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-12 text-center text-sm text-[var(--muted)]">
            Belum ada riwayat.
          </div>
        )}
      </div>
    </div>
  );
}
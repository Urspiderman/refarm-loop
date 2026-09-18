import { requireRole } from "@/lib/auth";
import { Truck, MapPin, CheckCircle2 } from "lucide-react";

export default async function CollectorDashboard() {
  const { supabase, user } = await requireRole(["collector"]);

  const [{ count: active }, { count: done }] = await Promise.all([
    supabase
      .from("pickups")
      .select("*", { count: "exact", head: true })
      .eq("collector_id", user.id)
      .in("status", [
        "scheduled",
        "accepted",
        "on_the_way",
        "picked_up",
      ]),

    supabase
      .from("pickups")
      .select("*", { count: "exact", head: true })
      .eq("collector_id", user.id)
      .eq("status", "delivered"),
  ]);

  return (
    <div className="page">
      <h1>Collector Dashboard</h1>

      <p>Kelola tugas pickup dan perjalanan material.</p>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {[
          [Truck, "Active Pickups", active || 0],
          [CheckCircle2, "Delivered", done || 0],
          [MapPin, "Route", "Open Map"],
        ].map(([Icon, label, value]: any) => (
          <div className="card p-5" key={label}>
            <Icon
              className="text-[var(--green-800)]"
              size={21}
            />

            <p className="mt-4 text-sm text-[var(--muted)]">
              {label}
            </p>

            <p className="mt-1 text-2xl font-black">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
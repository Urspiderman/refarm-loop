import { requireRole } from "@/lib/auth";
import Topbar from "@/components/topbar";
import {
  Users,
  Package,
  Handshake,
  Truck,
  Recycle,
  BrainCircuit,
} from "lucide-react";

export default async function Overview() {
  const { supabase } = await requireRole(["admin"]);

  const qs = async (
    table: string,
    filter?: [string, string]
  ) => {
    let q = supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (filter) {
      q = q.eq(filter[0], filter[1]);
    }

    const { count, error } = await q;

    if (error) {
      console.error(
        `Failed to query ${table}:`,
        error?.message,
        error?.details,
        error?.hint,
        error?.code
      );

      return 0;
    }

    return count ?? 0;
  };

  const [users, surplus, partners, pickups, recovery, ai] =
    await Promise.all([
      qs("profiles"),
      qs("surplus_listings"),
      qs("recovery_partner_profiles", ["verified", "true"]),
      qs("pickups", ["status", "on_the_way"]),
      qs("recovery_records"),
      qs("material_assessments"),
    ]);

  const stats = [
    [Users, "Users", users],
    [Package, "Surplus", surplus],
    [Handshake, "Verified Partners", partners],
    [Truck, "Active Pickup", pickups],
    [Recycle, "Recovered", recovery],
    [BrainCircuit, "AI Assessments", ai],
  ];

  return (
    <>
      <Topbar
        title="Overview"
        subtitle="ReFarm Loop control tower"
      />

      <div className="p-5 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map(([Icon, label, value]: any) => (
            <div className="card p-5" key={label}>
              <Icon
                className="text-[var(--green-800)]"
                size={21}
              />

              <p className="mt-4 text-sm text-[var(--muted)]">
                {label}
              </p>

              <p className="mt-1 text-3xl font-black">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="card mt-6 p-6">
          <h2 className="text-lg font-black">
            Control Tower
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Monitor network health, material flow, operational
            status, AI assessments, transactions, and impact
            from the admin workspace.
          </p>
        </div>
      </div>
    </>
  );
}
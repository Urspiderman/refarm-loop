import { requireRole } from "@/lib/auth";
import Topbar from "@/components/topbar";
import { Handshake, Users } from "lucide-react";

export default async function Network() {
  const { supabase } = await requireRole(["admin"]);

  const { data: partners, error: partnersError } = await supabase
    .from("recovery_partner_profiles")
    .select("id,organization_name,verified,capacity_kg_per_week")
    .order("organization_name");

  if (partnersError) {
    console.error(
      "Failed to query recovery_partner_profiles:",
      partnersError.message,
      partnersError.details,
      partnersError.hint,
      partnersError.code
    );
  }

  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("id,full_name,role")
    .order("created_at", { ascending: false })
    .limit(20);

  if (usersError) {
    console.error(
      "Failed to query profiles:",
      usersError.message,
      usersError.details,
      usersError.hint,
      usersError.code
    );
  }

  return (
    <>
      <Topbar
        title="Network"
        subtitle="Users and recovery network"
      />

      <div className="p-5 md:p-8">
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="card p-5">
            <h2 className="font-black">Recovery Partners</h2>

            <div className="mt-4 space-y-2">
              {partners?.map((p) => (
                <div
                  className="soft rounded-xl p-3"
                  key={p.id}
                >
                  <div className="flex items-center gap-3">
                    <Handshake size={18} />

                    <div className="flex-1">
                      <p className="font-bold">
                        {p.organization_name}
                      </p>

                      <p className="text-xs text-[var(--muted)]">
                        Capacity {p.capacity_kg_per_week || 0} kg/week
                      </p>
                    </div>

                    <span className="pill">
                      {p.verified ? "Verified" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}

              {!partners?.length && (
                <p className="py-6 text-center text-sm text-[var(--muted)]">
                  No recovery partners found.
                </p>
              )}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-black">Recent Users</h2>

            <div className="mt-4 space-y-2">
              {users?.map((u) => (
                <div
                  className="flex items-center gap-3 rounded-xl border border-[var(--line)] p-3"
                  key={u.id}
                >
                  <Users size={18} />

                  <div className="flex-1">
                    <p className="font-bold">
                      {u.full_name || "Unnamed User"}
                    </p>

                    <p className="text-xs text-[var(--muted)]">
                      {u.role?.replaceAll("_", " ") || "Unknown role"}
                    </p>
                  </div>
                </div>
              ))}

              {!users?.length && (
                <p className="py-6 text-center text-sm text-[var(--muted)]">
                  No users found.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
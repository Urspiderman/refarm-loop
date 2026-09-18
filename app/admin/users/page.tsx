import { requireRole } from "@/lib/auth";
import Topbar from "@/components/topbar";

export default async function Users() {
  const { supabase } = await requireRole(["admin"]);

  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,role,phone,address,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to query profiles:", error.message);
  }

  return (
    <>
      <Topbar
        title="Users"
        subtitle="Manage platform accounts"
      />

      <div className="p-5 md:p-8">
        <div className="card overflow-hidden">
          {data?.map((u) => (
            <div
              className="flex items-center gap-4 border-b border-[var(--line)] p-4 last:border-0"
              key={u.id}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)]">
                {u.full_name?.slice(0, 1) || "U"}
              </div>

              <div className="flex-1">
                <p className="font-bold">
                  {u.full_name}
                </p>

                <p className="text-xs text-[var(--muted)]">
                  {u.role?.replaceAll("_", " ") || "Unknown role"}
                </p>
              </div>

              <span className="text-xs text-[var(--muted)]">
                {u.phone || "No phone"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
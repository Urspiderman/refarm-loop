import { requireRole } from "@/lib/auth";
import { Recycle } from "lucide-react";

export default async function Recovery() {
  const { supabase, user } = await requireRole(["recovery_partner"]);

  const { data } = await supabase
    .from("recovery_records")
    .select("*")
    .eq("recovery_partner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="page">
      <h1>Recovery Records</h1>
      <p>Catat dan pantau material yang berhasil masuk ke recovery.</p>

      <div className="mt-6 space-y-3">
        {data?.length ? (
          data.map((r: any) => (
            <div
              className="card flex items-center gap-4 p-5"
              key={r.id}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--mint)]">
                <Recycle size={19} />
              </div>

              <div className="flex-1">
                <p className="font-black">
                  {r.pathway?.replaceAll("_", " ")}
                </p>

                <p className="text-xs text-[var(--muted)]">
                  Input {r.input_quantity} kg • Output{" "}
                  {r.output_quantity ?? "-"} kg
                </p>
              </div>

              <span className="pill">
                {r.recovered_at ? "Recovered" : "Processing"}
              </span>
            </div>
          ))
        ) : (
          <div className="card p-12 text-center text-sm text-[var(--muted)]">
            Belum ada recovery record.
          </div>
        )}
      </div>
    </div>
  );
}
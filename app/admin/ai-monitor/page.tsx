import { requireRole } from "@/lib/auth";
import Topbar from "@/components/topbar";
import { BrainCircuit, ShieldAlert } from "lucide-react";

export default async function AIMonitor() {
  const { supabase } = await requireRole(["admin"]);

  const { data, error } = await supabase
    .from("material_assessments")
    .select(
      "id,material_type,condition,recovery_potential,confidence,model_name,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error(
      "Failed to query material_assessments:",
      error.message,
      error.details,
      error.hint,
      error.code
    );
  }

  return (
    <>
      <Topbar
        title="AI Monitor"
        subtitle="Assessment quality and model activity"
      />

      <div className="p-5 md:p-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <BrainCircuit className="text-[var(--green-800)]" />

            <div>
              <h2 className="font-black">
                Gemini Assessment Monitor
              </h2>

              <p className="text-xs text-[var(--muted)]">
                AI is advisory. Admin can review low-confidence results.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {data?.map((x) => (
              <div
                className="flex items-center gap-3 rounded-xl border border-[var(--line)] p-3"
                key={x.id}
              >
                <span className="pill">
                  {Math.round((x.confidence || 0) * 100)}%
                </span>

                <div className="flex-1">
                  <p className="font-bold">
                    {x.material_type || "Unknown material"}
                  </p>

                  <p className="text-xs text-[var(--muted)]">
                    {x.condition || "-"} • potential{" "}
                    {x.recovery_potential ?? 0}%
                  </p>
                </div>

                {Number(x.confidence || 0) < 0.6 && (
                  <ShieldAlert
                    size={18}
                    className="text-amber-600"
                  />
                )}
              </div>
            ))}

            {!data?.length && (
              <div className="p-8 text-center text-sm text-[var(--muted)]">
                Belum ada hasil assessment AI.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
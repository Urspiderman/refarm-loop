import { requireRole } from "@/lib/auth";
import Topbar from "@/components/topbar";
import { Receipt } from "lucide-react";

export default async function Transactions() {
  const { supabase } = await requireRole(["admin"]);

  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id,gross_amount,platform_fee,payment_fee,supplier_amount,status,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error(
      "Failed to query transactions:",
      error.message,
      error.details,
      error.hint,
      error.code
    );
  }

  return (
    <>
      <Topbar
        title="Transactions"
        subtitle="Financial activity"
      />

      <div className="p-5 md:p-8">
        <div className="card overflow-hidden">
          {data?.length ? (
            data.map((x) => (
              <div
                className="grid gap-2 border-b border-[var(--line)] p-4 md:grid-cols-5"
                key={x.id}
              >
                <div className="flex items-center gap-2">
                  <Receipt size={17} />
                  <span className="font-bold">
                    {x.id.slice(0, 8)}
                  </span>
                </div>

                <span>
                  Gross Rp{" "}
                  {Number(x.gross_amount || 0).toLocaleString("id-ID")}
                </span>

                <span>
                  Fee Rp{" "}
                  {Number(
                    (x.platform_fee || 0) + (x.payment_fee || 0)
                  ).toLocaleString("id-ID")}
                </span>

                <span>
                  Supplier Rp{" "}
                  {Number(x.supplier_amount || 0).toLocaleString("id-ID")}
                </span>

                <span className="pill w-fit">
                  {x.status}
                </span>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-sm text-[var(--muted)]">
              Belum ada transaksi.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
import { requireRole } from "@/lib/auth";
import { Truck, ArrowRight } from "lucide-react";

export default async function Incoming() {
  const { supabase, user } = await requireRole(["recovery_partner"]);

  const { data } = await supabase
    .from("transactions")
    .select(
      "id,quantity,unit_price,gross_amount,status,created_at,surplus_listings(material_name,condition,location_text)"
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="page">
      <h1>Incoming Supply</h1>
      <p>Supply yang masuk ke partner recovery Anda.</p>

      <div className="mt-6 space-y-3">
        {data?.length ? (
          data.map((x: any) => (
            <div className="card p-5" key={x.id}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--mint)]">
                  <Truck size={19} />
                </div>

                <div className="flex-1">
                  <h3 className="font-black">
                    {x.surplus_listings?.material_name}
                  </h3>

                  <p className="text-xs text-[var(--muted)]">
                    {x.quantity} kg • {x.surplus_listings?.condition} •{" "}
                    {x.surplus_listings?.location_text}
                  </p>
                </div>

                <span className="pill">{x.status}</span>
                <ArrowRight size={16} />
              </div>
            </div>
          ))
        ) : (
          <div className="card p-12 text-center text-sm text-[var(--muted)]">
            Belum ada incoming supply.
          </div>
        )}
      </div>
    </div>
  );
}
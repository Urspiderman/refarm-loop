import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import {
  Package,
  Search,
  Receipt,
  Truck,
  Recycle,
  Heart,
  ArrowRight,
  Leaf,
} from "lucide-react";

export default async function Home() {
  const s = await createClient();

  const {
    data: { user },
  } = await s.auth.getUser();

  // Jika belum login
  if (!user) {
    return null;
  }

  // =========================================================
  // RECOVERY PARTNER PROFILE
  // =========================================================

  const { data: profile } = await s
    .from("recovery_partner_profiles")
    .select(`
      organization_name,
      capacity_kg_per_week,
      verified
    `)
    .eq("id", user.id)
    .single();

  // =========================================================
  // ACTIVE DEMAND
  // =========================================================

  const { count: demandCount } = await s
    .from("material_demands")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("recovery_partner_id", user.id)
    .eq("active", true);

  // =========================================================
  // ACTIVE TRANSACTIONS
  // =========================================================

  const { count: transactionCount } = await s
    .from("transactions")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("buyer_id", user.id)
    .in("status", [
      "pending",
      "awaiting_payment",
      "paid",
      "in_collection",
    ]);

  // =========================================================
  // RECOVERY RECORDS
  // =========================================================

  const { data: recoveryRecords } = await s
    .from("recovery_records")
    .select("quantity_kg")
    .eq("recovery_partner_id", user.id);

  const recoveredKg =
    recoveryRecords?.reduce(
      (total, record) =>
        total + Number(record.quantity_kg || 0),
      0
    ) || 0;

  // =========================================================
  // IMPACT
  // =========================================================

  const { count: impactCount } = await s
    .from("impact_records")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("user_id", user.id);

  // =========================================================
  // PARTNER NAME
  // =========================================================

  const partnerName =
    profile?.organization_name ||
    user.user_metadata?.full_name ||
    "Recovery Partner";

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <AppShell role="recovery_partner">
      <div className="px-5 py-8 md:px-8 md:py-10">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-7 flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--muted)]">
              Selamat datang
            </p>

            <h1 className="mt-1 text-4xl font-black tracking-tight">
              {partnerName}
            </h1>

            <p className="mt-2 text-base text-[var(--muted)]">
              Kelola demand, terima surplus, dan kembalikan
              material ke dalam siklus.
            </p>
          </div>
        </div>

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="grid gap-4 md:grid-cols-4">

          <Stat
            label="Demand Aktif"
            value={demandCount || 0}
          />

          <Stat
            label="Transaksi Aktif"
            value={transactionCount || 0}
          />

          <Stat
            label="Material Recovered"
            value={`${recoveredKg.toLocaleString("id-ID")} kg`}
          />

          <Stat
            label="Impact"
            value={impactCount || 0}
          />

        </div>

        {/* =====================================================
            REFARM LOOP BANNER
        ===================================================== */}

        <div className="card mt-7 overflow-hidden bg-[var(--mint)] p-6 md:p-7">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--green-800)]">
              <Leaf size={28} />
            </div>

            <div>
              <h2 className="text-xl font-black">
                ReFarm Loop
              </h2>

              <p className="mt-1 text-sm text-[var(--green-900)]">
                Turning agricultural surplus into new value
                through circular recovery.
              </p>
            </div>

          </div>

        </div>

        {/* =====================================================
            QUICK ACCESS
        ===================================================== */}

        <section className="mt-7">

          <h2 className="mb-4 text-xl font-black">
            Quick Access
          </h2>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">

            {[
              ["/partner/demands", "Demand Saya", Package],
              ["/partner/incoming", "Pasokan Masuk", Truck],
              ["/partner/transactions", "Transaksi", Receipt],
              ["/partner/recovery", "Recovery", Recycle],
              ["/discover", "Cari Supply", Search],
              ["/partner/recovery", "Impact", Heart],
            ].map(([href, label, Icon]: any) => (

              <Link
                href={href}
                key={label}
                className="card flex min-h-28 flex-col items-center justify-center gap-2 hover:bg-[var(--mint-2)]"
              >

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                  <Icon size={19} />
                </span>

                <span className="text-xs font-bold">
                  {label}
                </span>

              </Link>

            ))}

          </div>

        </section>

        {/* =====================================================
            PRIMARY CTA
        ===================================================== */}

        <Link
          href="/partner/demands/new"
          className="btn-primary mt-7 w-full md:w-auto"
        >
          + Tambah Demand
          <ArrowRight size={17} />
        </Link>

      </div>
    </AppShell>
  );
}

/* =========================================================
   STAT COMPONENT
========================================================= */

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="card p-5">

      <p className="text-sm text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black">
        {value}
      </p>

    </div>
  );
}
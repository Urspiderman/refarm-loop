import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import {
  Truck,
  History,
  User,
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
  // TRANSACTIONS
  // =========================================================

  const { count: transactionCount } = await s
    .from("transactions")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("supplier_id", user.id);

  // =========================================================
  // ACTIVE TRANSACTIONS
  // =========================================================

  const { count: activeCount } = await s
    .from("transactions")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("supplier_id", user.id)
    .in("status", [
      "pending",
      "awaiting_payment",
      "paid",
      "in_collection",
    ]);

  // =========================================================
  // IN COLLECTION
  // =========================================================

  const { count: collectionCount } = await s
    .from("transactions")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("supplier_id", user.id)
    .eq("status", "in_collection");

  // =========================================================
  // COMPLETED TRANSACTIONS
  // =========================================================

  const { count: completedCount } = await s
    .from("transactions")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("supplier_id", user.id)
    .eq("status", "completed");

  // =========================================================
  // COLLECTOR NAME
  // =========================================================

  const collectorName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "Collector";

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <AppShell role="collector">
      <div className="w-full px-5 py-8 md:px-8 md:py-10">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-7">

          <p className="text-sm text-[var(--muted)]">
            Selamat datang
          </p>

          <h1 className="mt-1 text-4xl font-black tracking-tight">
            {collectorName}
          </h1>

          <p className="mt-2 text-base text-[var(--muted)]">
            Kelola pengambilan dan pengantaran surplus dalam
            ReFarm Loop.
          </p>

        </div>

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Stat
            label="Total Transaksi"
            value={transactionCount || 0}
          />

          <Stat
            label="Aktivitas Aktif"
            value={activeCount || 0}
          />

          <Stat
            label="Dalam Pengantaran"
            value={collectionCount || 0}
          />

          <Stat
            label="Selesai"
            value={completedCount || 0}
          />

        </div>

        {/* =====================================================
            REFARM LOOP BANNER
        ===================================================== */}

        <div className="card mt-7 overflow-hidden bg-[var(--mint)] p-6 md:p-7">

          <div className="flex items-center gap-5">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[var(--green-800)]">
              <Leaf size={28} />
            </div>

            <div>

              <h2 className="text-xl font-black">
                ReFarm Loop
              </h2>

              <p className="mt-1 text-sm text-[var(--green-900)]">
                Menghubungkan surplus pertanian dengan proses
                pengumpulan dan pemanfaatan kembali.
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

          <div className="grid gap-4 md:grid-cols-3">

            <Link
              href="/collector/pickups"
              className="card group flex min-h-32 items-center justify-between p-6 transition hover:bg-[var(--mint-2)]"
            >

              <div className="flex items-center gap-4">

                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                  <Truck size={21} />
                </span>

                <div>

                  <p className="text-base font-black">
                    Tugas Pickup
                  </p>

                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Kelola tugas pengambilan surplus.
                  </p>

                </div>

              </div>

              <ArrowRight
                size={19}
                className="text-[var(--muted)] transition group-hover:translate-x-1"
              />

            </Link>

            <Link
              href="/collector/history"
              className="card group flex min-h-32 items-center justify-between p-6 transition hover:bg-[var(--mint-2)]"
            >

              <div className="flex items-center gap-4">

                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                  <History size={21} />
                </span>

                <div>

                  <p className="text-base font-black">
                    Riwayat
                  </p>

                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Lihat aktivitas pengantaran.
                  </p>

                </div>

              </div>

              <ArrowRight
                size={19}
                className="text-[var(--muted)] transition group-hover:translate-x-1"
              />

            </Link>

            <Link
              href="/collector/profile"
              className="card group flex min-h-32 items-center justify-between p-6 transition hover:bg-[var(--mint-2)]"
            >

              <div className="flex items-center gap-4">

                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                  <User size={21} />
                </span>

                <div>

                  <p className="text-base font-black">
                    Profil
                  </p>

                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Kelola informasi akun.
                  </p>

                </div>

              </div>

              <ArrowRight
                size={19}
                className="text-[var(--muted)] transition group-hover:translate-x-1"
              />

            </Link>

          </div>

        </section>

        {/* =====================================================
            PRIMARY CTA
        ===================================================== */}

        <Link
          href="/collector/pickups"
          className="btn-primary mt-7 w-full md:w-auto"
        >
          Lihat Tugas Pickup
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
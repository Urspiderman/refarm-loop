import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import {
  Building2,
  Mail,
  ShieldCheck,
  Package,
  MapPin,
  Receipt,
  Recycle,
  ArrowRight,
  LogOut,
  Leaf,
} from "lucide-react";

export default async function Profile() {
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
      description,
      capacity_kg_per_week,
      service_radius_km,
      verified
    `)
    .eq("id", user.id)
    .single();

  // =========================================================
  // TRANSACTIONS
  // =========================================================

  const { data: transactions } = await s
    .from("transactions")
    .select("id, status, quantity")
    .eq("buyer_id", user.id);

  const transactionRows = transactions || [];

  const totalTransactions = transactionRows.length;

  const activeTransactions = transactionRows.filter((transaction) =>
    [
      "pending",
      "awaiting_payment",
      "paid",
      "in_collection",
    ].includes(transaction.status)
  ).length;

  const completedTransactions = transactionRows.filter(
    (transaction) => transaction.status === "completed"
  ).length;

  // =========================================================
  // MATERIAL RECOVERED
  // =========================================================

  const { data: recoveryRecords } = await s
    .from("recovery_records")
    .select("input_quantity, output_quantity")
    .eq("recovery_partner_id", user.id);

  const recoveredKg =
    recoveryRecords?.reduce(
      (total, record) =>
        total + Number(record.output_quantity || 0),
      0
    ) || 0;

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
              Account
            </p>

            <h1 className="mt-1 text-4xl font-black tracking-tight">
              Profil Partner
            </h1>

            <p className="mt-2 text-base text-[var(--muted)]">
              Kelola informasi recovery partner dan lihat
              aktivitas operasional Anda.
            </p>
          </div>

        </div>

        {/* =====================================================
            PROFILE HEADER
        ===================================================== */}

        <div className="card overflow-hidden bg-[var(--mint-2)] p-6 md:p-7">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-4">

              {/* Avatar */}

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--mint)] text-xl font-black text-[var(--green-800)]">
                {partnerName
                  .split(" ")
                  .slice(0, 2)
                  .map((word: string) => word[0])
                  .join("")
                  .toUpperCase()}
              </div>

              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <h2 className="text-2xl font-black">
                    {partnerName}
                  </h2>

                  {profile?.verified && (
                    <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[var(--green-800)]">
                      <ShieldCheck size={13} />
                      Verified
                    </span>
                  )}

                </div>

                <div className="mt-1 flex items-center gap-2 text-sm text-[var(--muted)]">

                  <Mail size={15} />

                  {user.email}

                </div>

              </div>

            </div>

            {/* Account Type */}

            <div className="flex items-center gap-3 rounded-2xl bg-white p-4">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                <Recycle size={19} />
              </div>

              <div>

                <p className="text-xs text-[var(--muted)]">
                  Account Type
                </p>

                <p className="text-sm font-bold">
                  Recovery Partner
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* =====================================================
            ORGANIZATION INFORMATION
        ===================================================== */}

        <section className="mt-7">

          <h2 className="mb-4 text-xl font-black">
            Informasi Partner
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            {/* Organization */}

            <div className="card p-5">

              <div className="flex items-center gap-3">

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                  <Building2 size={19} />
                </span>

                <div>

                  <p className="text-xs text-[var(--muted)]">
                    Organisasi
                  </p>

                  <p className="mt-1 font-bold">
                    {partnerName}
                  </p>

                </div>

              </div>

            </div>

            {/* Email */}

            <div className="card p-5">

              <div className="flex items-center gap-3">

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                  <Mail size={19} />
                </span>

                <div className="min-w-0">

                  <p className="text-xs text-[var(--muted)]">
                    Email
                  </p>

                  <p className="mt-1 break-all font-bold">
                    {user.email}
                  </p>

                </div>

              </div>

            </div>

            {/* Capacity */}

            <div className="card p-5">

              <div className="flex items-center gap-3">

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                  <Package size={19} />
                </span>

                <div>

                  <p className="text-xs text-[var(--muted)]">
                    Kapasitas Recovery / Minggu
                  </p>

                  <p className="mt-1 font-bold">

                    {profile?.capacity_kg_per_week != null
                      ? `${Number(
                          profile.capacity_kg_per_week
                        ).toLocaleString("id-ID")} kg`
                      : "-"}

                  </p>

                </div>

              </div>

            </div>

            {/* Service Radius */}

            <div className="card p-5">

              <div className="flex items-center gap-3">

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                  <MapPin size={19} />
                </span>

                <div>

                  <p className="text-xs text-[var(--muted)]">
                    Service Radius
                  </p>

                  <p className="mt-1 font-bold">

                    {profile?.service_radius_km != null
                      ? `${Number(
                          profile.service_radius_km
                        ).toLocaleString("id-ID")} km`
                      : "-"}

                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            DESCRIPTION
        ===================================================== */}

        <section className="mt-7">

          <h2 className="mb-4 text-xl font-black">
            Tentang Partner
          </h2>

          <div className="card p-6">

            <p className="text-sm leading-7 text-[var(--muted)]">

              {profile?.description ||
                "Belum ada deskripsi mengenai recovery partner ini."}

            </p>

          </div>

        </section>

        {/* =====================================================
            ACTIVITY STATISTICS
        ===================================================== */}

        <section className="mt-7">

          <h2 className="mb-4 text-xl font-black">
            Aktivitas
          </h2>

          <div className="grid gap-4 md:grid-cols-3">

            <Stat
              label="Total Transaksi"
              value={totalTransactions}
            />

            <Stat
              label="Transaksi Aktif"
              value={activeTransactions}
            />

            <Stat
              label="Material Recovered"
              value={`${recoveredKg.toLocaleString("id-ID")} kg`}
            />

          </div>

        </section>

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

            <Link
              href="/partner/incoming"
              className="card flex min-h-28 flex-col items-center justify-center gap-2 hover:bg-[var(--mint-2)]"
            >

              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                <Package size={19} />
              </span>

              <span className="text-xs font-bold">
                Pasokan Masuk
              </span>

            </Link>

            <Link
              href="/partner/transactions"
              className="card flex min-h-28 flex-col items-center justify-center gap-2 hover:bg-[var(--mint-2)]"
            >

              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                <Receipt size={19} />
              </span>

              <span className="text-xs font-bold">
                Transaksi
              </span>

            </Link>

            <Link
              href="/partner/recovery"
              className="card flex min-h-28 flex-col items-center justify-center gap-2 hover:bg-[var(--mint-2)]"
            >

              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                <Recycle size={19} />
              </span>

              <span className="text-xs font-bold">
                Recovery
              </span>

            </Link>

          </div>

        </section>

        {/* =====================================================
            LOGOUT
        ===================================================== */}

        <form
          action="/signout"
          method="post"
          className="mt-7"
        >

          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-bold text-[var(--muted)] hover:bg-[var(--mint-2)]"
          >

            <LogOut size={17} />

            Keluar

          </button>

        </form>

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
import { requireRole } from "@/lib/auth";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Package,
  Recycle,
  TrendingUp,
  Users,
  AlertCircle,
  ArrowUpRight,
  MapPin,
} from "lucide-react";

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default async function PartnerDashboard() {
  const { supabase } = await requireRole(["admin"]);

  const [
    { count: totalPartners },
    { count: verifiedPartners },
    { count: pendingPartners },
    { data: partners },
    { count: activeDemands },
    { count: incomingSupplyTransactions },
    { count: recoveryRecords },
    { data: capacityData },
  ] = await Promise.all([
    /*
     * =====================================================
     * TOTAL RECOVERY PARTNERS
     * =====================================================
     */
    supabase
      .from("recovery_partner_profiles")
      .select("*", {
        count: "exact",
        head: true,
      }),

    /*
     * =====================================================
     * VERIFIED PARTNERS
     * =====================================================
     */
    supabase
      .from("recovery_partner_profiles")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("verified", true),

    /*
     * =====================================================
     * PENDING PARTNERS
     * =====================================================
     */
    supabase
      .from("recovery_partner_profiles")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("verified", false),

    /*
     * =====================================================
     * PARTNER NETWORK
     *
     * Sumber data yang sama dengan:
     * /discover
     * /discover/[id]
     * /partners
     *
     * Tambahkan service_radius_km supaya informasi
     * partner konsisten di seluruh aplikasi.
     * =====================================================
     */
    supabase
      .from("recovery_partner_profiles")
      .select(
        `
          id,
          organization_name,
          description,
          capacity_kg_per_week,
          service_radius_km,
          verified
        `
      )
      .order("verified", {
        ascending: true,
      })
      .order("organization_name", {
        ascending: true,
      })
      .limit(8),

    /*
     * =====================================================
     * ACTIVE DEMANDS
     * =====================================================
     */
    supabase
      .from("material_demands")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("active", true),

    /*
     * =====================================================
     * INCOMING SUPPLY
     *
     * Ini adalah JUMLAH TRANSAKSI,
     * bukan kilogram.
     * =====================================================
     */
    supabase
      .from("transactions")
      .select("*", {
        count: "exact",
        head: true,
      })
      .in("status", [
        "paid",
        "in_collection",
      ]),

    /*
     * =====================================================
     * RECOVERY RECORDS
     * =====================================================
     */
    supabase
      .from("recovery_records")
      .select("*", {
        count: "exact",
        head: true,
      }),

    /*
     * =====================================================
     * TOTAL NETWORK CAPACITY
     * =====================================================
     */
    supabase
      .from("recovery_partner_profiles")
      .select(
        "capacity_kg_per_week"
      ),
  ]);

  /*
   * =======================================================
   * TOTAL CAPACITY
   * =======================================================
   */
  const totalCapacity =
    capacityData?.reduce(
      (total, partner) =>
        total +
        Number(
          partner.capacity_kg_per_week || 0
        ),
      0
    ) || 0;

  /*
   * =======================================================
   * VERIFICATION RATE
   * =======================================================
   */
  const verificationRate =
    totalPartners && totalPartners > 0
      ? Math.round(
          ((verifiedPartners || 0) /
            totalPartners) *
            100
        )
      : 0;

  /*
   * =======================================================
   * KPI
   * =======================================================
   */
  const stats = [
    {
      label: "Total Partners",
      value: totalPartners || 0,
      description:
        "Recovery partners terdaftar",
      icon: Building2,
    },
    {
      label: "Verified Partners",
      value: verifiedPartners || 0,
      description: `${verificationRate}% dari seluruh partner`,
      icon: CheckCircle2,
    },
    {
      label: "Pending Verification",
      value: pendingPartners || 0,
      description:
        "Memerlukan tindakan admin",
      icon: Clock3,
    },
    {
      label: "Processing Capacity",
      value: `${formatNumber(
        totalCapacity
      )} kg`,
      description:
        "Kapasitas mingguan jaringan",
      icon: Recycle,
    },
  ];

  return (
    <div className="space-y-8 p-5 md:p-8">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <section>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--green-700)]">
              Partner Control Tower
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight">
              Recovery Partner Network
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
              Monitor partner, verification,
              kapasitas recovery, dan aktivitas
              jaringan ReFarm Loop.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
            <Users size={17} />

            <span className="font-semibold">
              Admin Control
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          KPI
      ====================================================== */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="card p-5 transition hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--mint)] text-[var(--green-800)]">
                  <Icon size={21} />
                </div>
              </div>

              <p className="mt-5 text-sm text-[var(--muted)]">
                {stat.label}
              </p>

              <p className="mt-1 text-2xl font-black">
                {stat.value}
              </p>

              <p className="mt-1 text-xs text-[var(--muted)]">
                {stat.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* =====================================================
          OPERATIONAL OVERVIEW
      ====================================================== */}
      <section className="grid gap-6 lg:grid-cols-3">

        {/* NETWORK OPERATIONS */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--green-700)]">
                Network Operations
              </p>

              <h2 className="mt-1 text-xl font-black">
                Aktivitas jaringan
              </h2>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Kondisi operasional recovery
                partner saat ini.
              </p>
            </div>

            <TrendingUp
              size={21}
              className="text-[var(--green-700)]"
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">

            {/* ACTIVE DEMAND */}
            <div className="rounded-2xl border border-[var(--border)] p-4">
              <Package
                size={19}
                className="text-[var(--green-700)]"
              />

              <p className="mt-4 text-xs text-[var(--muted)]">
                Active Demand
              </p>

              <p className="mt-1 text-2xl font-black">
                {activeDemands || 0}
              </p>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Permintaan material aktif
              </p>
            </div>

            {/* INCOMING SUPPLY TRANSACTIONS */}
            <div className="rounded-2xl border border-[var(--border)] p-4">
              <ArrowUpRight
                size={19}
                className="text-[var(--green-700)]"
              />

              <p className="mt-4 text-xs text-[var(--muted)]">
                Incoming Supply
              </p>

              <p className="mt-1 text-2xl font-black">
                {incomingSupplyTransactions || 0}
              </p>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Transaksi supply dalam proses
              </p>
            </div>

            {/* RECOVERY */}
            <div className="rounded-2xl border border-[var(--border)] p-4">
              <Recycle
                size={19}
                className="text-[var(--green-700)]"
              />

              <p className="mt-4 text-xs text-[var(--muted)]">
                Recovery Records
              </p>

              <p className="mt-1 text-2xl font-black">
                {recoveryRecords || 0}
              </p>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Aktivitas recovery tercatat
              </p>
            </div>
          </div>
        </div>

        {/* VERIFICATION */}
        <div className="card bg-[var(--mint)] p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[var(--green-800)]">
            <CheckCircle2 size={21} />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[var(--green-700)]">
            Verification Health
          </p>

          <p className="mt-2 text-3xl font-black">
            {verificationRate}%
          </p>

          <p className="mt-1 text-sm text-[var(--muted)]">
            partner sudah terverifikasi
          </p>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-[var(--green-700)]"
              style={{
                width: `${verificationRate}%`,
              }}
            />
          </div>

          <div className="mt-4 flex justify-between text-xs">
            <span>
              {verifiedPartners || 0} verified
            </span>

            <span>
              {pendingPartners || 0} pending
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          ALERT
      ====================================================== */}
      {(pendingPartners || 0) > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600">
              <AlertCircle size={20} />
            </div>

            <div>
              <p className="font-bold text-amber-900">
                {pendingPartners} partner
                menunggu verifikasi
              </p>

              <p className="mt-1 text-sm text-amber-800">
                Review profil partner sebelum
                mereka dapat dianggap sebagai
                bagian dari jaringan recovery
                terverifikasi.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          PARTNER TABLE
      ====================================================== */}
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-[var(--border)] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--green-700)]">
              Partner Network
            </p>

            <h2 className="mt-1 text-xl font-black">
              Recovery Partners
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Partner terbaru dan status
              verifikasinya.
            </p>
          </div>
        </div>

        {partners && partners.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">

            {partners.map((partner) => (
              <div
                key={partner.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >

                {/* ICON */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--mint)] text-[var(--green-800)]">
                  <Building2 size={19} />
                </div>

                {/* INFORMATION */}
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {partner.organization_name ||
                      "Unnamed Partner"}
                  </p>

                  <p className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">
                    {partner.description ||
                      "Tidak ada deskripsi partner."}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">

                    {/* CAPACITY */}
                    <span className="pill">
                      Capacity:{" "}
                      {formatNumber(
                        Number(
                          partner.capacity_kg_per_week ||
                            0
                        )
                      )}{" "}
                      kg/week
                    </span>

                    {/* SERVICE RADIUS */}
                    {partner.service_radius_km !=
                      null && (
                      <span className="pill">
                        <MapPin
                          size={12}
                          className="mr-1"
                        />

                        {formatNumber(
                          Number(
                            partner.service_radius_km
                          )
                        )}{" "}
                        km
                      </span>
                    )}
                  </div>
                </div>

                {/* VERIFICATION */}
                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                    partner.verified
                      ? "bg-[var(--mint)] text-[var(--green-800)]"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {partner.verified ? (
                    <>
                      <CheckCircle2 size={13} />
                      Verified
                    </>
                  ) : (
                    <>
                      <Clock3 size={13} />
                      Pending
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <Building2
              size={32}
              className="mx-auto text-[var(--muted)]"
            />

            <p className="mt-3 font-bold">
              Belum ada recovery partner
            </p>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Partner yang terdaftar akan
              muncul di sini.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
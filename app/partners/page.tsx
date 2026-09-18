import { requireRole } from "@/lib/auth";
import ProfileMenu from "@/components/profile-menu";
import {
  Package,
  Truck,
  Recycle,
  Wallet,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Leaf,
} from "lucide-react";

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatPathway(pathway: string | null) {
  if (!pathway) return "-";

  const labels: Record<string, string> = {
    animal_feed: "Animal Feed",
    compost: "Compost",
    organic_fertilizer: "Organic Fertilizer",
    food_processing: "Food Processing",
    bioconversion: "Bioconversion",
    other: "Other",
  };

  return labels[pathway] || pathway;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    awaiting_payment: "Awaiting Payment",
    paid: "Paid",
    in_collection: "In Collection",
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };

  return labels[status] || status;
}

function statusClass(status: string) {
  switch (status) {
    case "completed":
    case "paid":
      return "bg-emerald-50 text-emerald-700";

    case "in_collection":
      return "bg-blue-50 text-blue-700";

    case "pending":
    case "awaiting_payment":
      return "bg-amber-50 text-amber-700";

    case "cancelled":
    case "refunded":
      return "bg-red-50 text-red-700";

    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default async function PartnerDashboard() {
  const { supabase, user } = await requireRole([
    "recovery_partner",
  ]);

  const [
    { count: demandCount },
    { data: demands },
    { data: transactions },
    { data: recoveryRecords },
    { data: profile },
  ] = await Promise.all([
    /*
     * ACTIVE DEMANDS
     * Hanya demand milik Recovery Partner yang sedang aktif.
     */
    supabase
      .from("material_demands")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("recovery_partner_id", user.id)
      .eq("active", true),

    supabase
      .from("material_demands")
      .select(
        `
          id,
          material_name,
          pathway,
          quantity_needed,
          capacity_available_kg,
          min_condition,
          created_at
        `
      )
      .eq("recovery_partner_id", user.id)
      .eq("active", true)
      .order("created_at", {
        ascending: false,
      })
      .limit(5),

    /*
     * TRANSACTIONS
     * Recovery Partner bertindak sebagai buyer.
     */
    supabase
      .from("transactions")
      .select(
        `
          id,
          surplus_id,
          gross_amount,
          status,
          created_at
        `
      )
      .eq("buyer_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(10),

    /*
     * RECOVERY RECORDS
     */
    supabase
      .from("recovery_records")
      .select("*")
      .eq("recovery_partner_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(5),

    /*
     * SINGLE SOURCE OF TRUTH UNTUK IDENTITAS PARTNER
     *
     * recovery_partner_profiles.id = auth.users.id
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
      .eq("id", user.id)
      .single(),
  ]);

  const incomingSupplyCount =
    transactions?.filter((transaction) =>
      ["paid", "in_collection"].includes(
        transaction.status
      )
    ).length || 0;

  const completedRecoveryCount =
    recoveryRecords?.length || 0;

  const completedTransactions =
    transactions?.filter(
      (transaction) =>
        transaction.status === "completed"
    ).length || 0;

  /*
   * Capacity utilization belum dihitung karena
   * schema transaksi saat ini belum menyediakan
   * aggregate quantity yang diperlukan.
   *
   * Kita sengaja tidak membuat angka utilization palsu.
   */
  const capacity =
    Number(profile?.capacity_kg_per_week) || 0;

  return (
    <div className="page space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <section className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">
            Recovery Partner
          </p>

          <h1 className="mt-1">
            {profile?.organization_name ||
              "Partner Dashboard"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Pantau demand, supply masuk, kapasitas,
            dan proses recovery dari satu tempat.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">

          {/* VERIFICATION STATUS */}
          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-bold ${
              profile?.verified
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {profile?.verified ? (
              <CheckCircle2 size={16} />
            ) : (
              <Clock3 size={16} />
            )}

            {profile?.verified
              ? "Partner Terverifikasi"
              : "Menunggu Verifikasi"}
          </div>
        </div>
      </section>

      {/* =====================================================
          KPI
      ====================================================== */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* ACTIVE DEMAND */}
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint)]">
              <Package
                size={20}
                className="text-[var(--green-800)]"
              />
            </div>

            <ArrowUpRight
              size={18}
              className="text-[var(--muted)]"
            />
          </div>

          <p className="mt-5 text-sm text-[var(--muted)]">
            Active Demand
          </p>

          <p className="mt-1 text-3xl font-black">
            {demandCount || 0}
          </p>

          <p className="mt-1 text-xs text-[var(--muted)]">
            Demand yang sedang aktif
          </p>
        </div>

        {/* INCOMING SUPPLY */}
        <div className="card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint)]">
            <Truck
              size={20}
              className="text-[var(--green-800)]"
            />
          </div>

          <p className="mt-5 text-sm text-[var(--muted)]">
            Incoming Supply
          </p>

          <p className="mt-1 text-3xl font-black">
            {incomingSupplyCount}
          </p>

          <p className="mt-1 text-xs text-[var(--muted)]">
            Transaksi supply yang sedang masuk
          </p>
        </div>

        {/* WEEKLY CAPACITY */}
        <div className="card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint)]">
            <Wallet
              size={20}
              className="text-[var(--green-800)]"
            />
          </div>

          <p className="mt-5 text-sm text-[var(--muted)]">
            Weekly Capacity
          </p>

          <p className="mt-1 text-3xl font-black">
            {formatNumber(capacity)}
          </p>

          <p className="mt-1 text-xs text-[var(--muted)]">
            kg per minggu
          </p>
        </div>

        {/* RECOVERY RECORDS */}
        <div className="card p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint)]">
            <Recycle
              size={20}
              className="text-[var(--green-800)]"
            />
          </div>

          <p className="mt-5 text-sm text-[var(--muted)]">
            Recovery Records
          </p>

          <p className="mt-1 text-3xl font-black">
            {completedRecoveryCount}
          </p>

          <p className="mt-1 text-xs text-[var(--muted)]">
            Aktivitas recovery tercatat
          </p>
        </div>
      </section>

      {/* =====================================================
          MAIN OPERATIONS
      ====================================================== */}
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">

        {/* ACTIVE DEMANDS */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/5 p-5">
            <div>
              <h2 className="text-lg font-black">
                Active Demand
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Material yang sedang Anda butuhkan
              </p>
            </div>

            <div className="rounded-lg bg-[var(--mint)] px-3 py-1.5 text-xs font-bold text-[var(--green-800)]">
              {demandCount || 0} active
            </div>
          </div>

          <div className="divide-y divide-black/5">
            {demands && demands.length > 0 ? (
              demands.map((demand) => (
                <div
                  key={demand.id}
                  className="p-5 transition hover:bg-black/[0.02]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>
                      <p className="font-black">
                        {demand.material_name}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="pill">
                          {formatPathway(
                            demand.pathway
                          )}
                        </span>

                        {demand.min_condition && (
                          <span className="pill">
                            Min.{" "}
                            {demand.min_condition}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-lg font-black">
                        {formatNumber(
                          Number(
                            demand.quantity_needed
                          ) || 0
                        )}{" "}
                        kg
                      </p>

                      <p className="text-xs text-[var(--muted)]">
                        kebutuhan
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--muted)]">
                        Available capacity
                      </span>

                      <span className="font-bold">
                        {formatNumber(
                          Number(
                            demand.capacity_available_kg
                          ) || 0
                        )}{" "}
                        kg
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/5">
                      <div
                        className="h-full rounded-full bg-[var(--green-700)]"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              (Number(
                                demand.capacity_available_kg
                              ) /
                                Math.max(
                                  Number(
                                    demand.quantity_needed
                                  ) || 1,
                                  1
                                )) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Package
                  size={28}
                  className="mx-auto text-[var(--muted)]"
                />

                <p className="mt-3 font-bold">
                  Belum ada demand aktif
                </p>

                <p className="mt-1 text-sm text-[var(--muted)]">
                  Tambahkan demand untuk mulai menerima
                  supply yang sesuai.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* OPERATIONS SUMMARY */}
        <div className="space-y-6">

          {/* SUPPLY OPERATIONS */}
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint)]">
                <Truck
                  size={19}
                  className="text-[var(--green-800)]"
                />
              </div>

              <div>
                <h2 className="font-black">
                  Supply Operations
                </h2>

                <p className="text-xs text-[var(--muted)]">
                  Status supply terbaru
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                {
                  label: "Paid",
                  value:
                    transactions?.filter(
                      (t) => t.status === "paid"
                    ).length || 0,
                  icon: CheckCircle2,
                },
                {
                  label: "In Collection",
                  value:
                    transactions?.filter(
                      (t) =>
                        t.status === "in_collection"
                    ).length || 0,
                  icon: Truck,
                },
                {
                  label: "Completed",
                  value: completedTransactions,
                  icon: Recycle,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl bg-black/[0.025] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={16}
                        className="text-[var(--green-700)]"
                      />

                      <span className="text-sm font-medium">
                        {item.label}
                      </span>
                    </div>

                    <span className="font-black">
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CAPACITY */}
          <div className="card bg-[var(--mint)] p-5">
            <div className="flex items-center gap-3">
              <Leaf
                size={20}
                className="text-[var(--green-800)]"
              />

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--green-700)]">
                  Weekly Capacity
                </p>

                <p className="mt-1 text-2xl font-black">
                  {formatNumber(capacity)} kg
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm text-[var(--muted)]">
              Kapasitas maksimum yang dapat diproses
              partner per minggu.
            </p>

            {profile?.service_radius_km && (
              <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4 text-sm">
                <span className="text-[var(--muted)]">
                  Service radius
                </span>

                <span className="font-bold">
                  {profile.service_radius_km} km
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          RECENT TRANSACTIONS
      ====================================================== */}
      <section className="card overflow-hidden">
        <div className="border-b border-black/5 p-5">
          <h2 className="text-lg font-black">
            Recent Supply Activity
          </h2>

          <p className="mt-1 text-xs text-[var(--muted)]">
            Aktivitas transaksi supply terbaru
          </p>
        </div>

        {transactions && transactions.length > 0 ? (
          <div className="divide-y divide-black/5">
            {transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--mint)]">
                    <Truck
                      size={17}
                      className="text-[var(--green-800)]"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Supply transaction
                    </p>

                    <p className="text-xs text-[var(--muted)]">
                      {new Date(
                        transaction.created_at
                      ).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p className="font-black">
                    Rp{" "}
                    {formatNumber(
                      Number(
                        transaction.gross_amount
                      ) || 0
                    )}
                  </p>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                      transaction.status
                    )}`}
                  >
                    {statusLabel(
                      transaction.status
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <AlertCircle
              size={28}
              className="mx-auto text-[var(--muted)]"
            />

            <p className="mt-3 font-bold">
              Belum ada aktivitas supply
            </p>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Transaksi supply yang masuk akan muncul
              di sini.
            </p>
          </div>
        )}
      </section>

      {/* =====================================================
          VERIFICATION
      ====================================================== */}
      <section
        className={`card p-5 ${
          profile?.verified
            ? "bg-[var(--mint)]"
            : "bg-amber-50"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--green-700)]">
              Partner Status
            </p>

            <h2 className="mt-1 text-lg font-black">
              {profile?.verified
                ? "Partner terverifikasi"
                : "Menunggu verifikasi admin"}
            </h2>

            <p className="mt-1 text-sm text-[var(--muted)]">
              {profile?.verified
                ? "Partner dapat menerima dan memproses supply sesuai demand."
                : "Admin ReFarm Loop perlu memverifikasi partner sebelum aktivitas operasional penuh."}
            </p>
          </div>

          {profile?.verified ? (
            <CheckCircle2
              size={28}
              className="text-emerald-600"
            />
          ) : (
            <Clock3
              size={28}
              className="text-amber-600"
            />
          )}
        </div>
      </section>

      {/* =====================================================
          PROFILE / SETTINGS
      ====================================================== */}
      <section className="card p-5">
        <div>
          <h2 className="text-lg font-black">
            Account
          </h2>

          <p className="mt-1 text-sm text-[var(--muted)]">
            Kelola akun dan sesi Recovery Partner.
          </p>
        </div>

        <ProfileMenu
          role="recovery_partner"
          organizationName={
            profile?.organization_name || null
          }
        />
      </section>
    </div>
  );
}
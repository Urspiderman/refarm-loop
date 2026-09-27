import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Package,
  Recycle,
  Truck,
  MapPin,
  Leaf,
  AlertCircle,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  awaiting_payment: "Menunggu Pembayaran",
  paid: "Dibayar",
  in_collection: "Dalam Pengambilan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  refunded: "Dikembalikan",
};

const pathwayLabels: Record<string, string> = {
  animal_feed: "Pakan Ternak",
  compost: "Kompos",
  organic_fertilizer: "Pupuk Organik",
  food_processing: "Pengolahan Pangan",
  bioconversion: "Biokonversi",
  other: "Lainnya",
};

export default async function RecoveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await createClient();

  const {
    data: { user },
  } = await s.auth.getUser();

  if (!user) {
    return null;
  }

  const { id } = await params;

  /*
   * Ambil transaction.
   *
   * Recovery Partner adalah buyer_id.
   */
  const { data: transaction, error: transactionError } =
    await s
      .from("transactions")
      .select(`
        id,
        match_id,
        surplus_id,
        buyer_id,
        supplier_id,
        quantity,
        unit_price,
        gross_amount,
        platform_fee,
        payment_fee,
        supplier_amount,
        status,
        created_at,
        updated_at
      `)
      .eq("id", id)
      .eq("buyer_id", user.id)
      .single();

  if (transactionError || !transaction) {
    return (
      <AppShell role="recovery_partner">
        <div className="px-5 py-8 md:px-8 md:py-10">
          <Link
            href="/partner/transactions"
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--green-900)] hover:underline"
          >
            <ArrowLeft size={16} />
            Kembali ke Transaksi
          </Link>

          <div className="card flex min-h-[350px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle size={30} />
            </div>

            <h1 className="mt-5 text-xl font-black">
              Transaksi Tidak Ditemukan
            </h1>

            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
              Transaksi tidak ditemukan atau Anda tidak
              memiliki akses ke transaksi ini.
            </p>

            <Link
              href="/partner/transactions"
              className="btn-primary mt-5"
            >
              Kembali ke Transaksi
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  /*
   * Ambil surplus.
   */
  const { data: surplus } = await s
    .from("surplus_listings")
    .select(`
      id,
      supplier_id,
      material_name,
      quantity,
      unit,
      condition,
      location_text,
      status
    `)
    .eq("id", transaction.surplus_id)
    .single();

  /*
   * Ambil match.
   */
  let match: any = null;

  if (transaction.match_id) {
    const { data: matchData } = await s
      .from("matches")
      .select(`
        id,
        surplus_id,
        demand_id,
        score,
        compatibility_score,
        quantity_score,
        distance_score,
        capacity_score,
        status
      `)
      .eq("id", transaction.match_id)
      .single();

    match = matchData;
  }

  /*
   * Ambil demand.
   */
  let demand: any = null;

  if (match?.demand_id) {
    const { data: demandData } = await s
      .from("material_demands")
      .select(`
        id,
        recovery_partner_id,
        material_name,
        pathway,
        quantity_needed,
        capacity_available_kg,
        min_condition,
        active
      `)
      .eq("id", match.demand_id)
      .eq("recovery_partner_id", user.id)
      .single();

    demand = demandData;
  }

  /*
   * Ambil recovery record jika sudah pernah dibuat.
   */
  const { data: recoveryRecords } = await s
    .from("recovery_records")
    .select(`
      id,
      transaction_id,
      recovery_partner_id,
      pathway,
      input_quantity,
      output_quantity,
      recovered_at,
      notes,
      created_at
    `)
    .eq("transaction_id", transaction.id)
    .eq("recovery_partner_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  const records = recoveryRecords || [];

  const latestRecord = records[0] || null;

  const transactionStatus = transaction.status;

  const isCompleted =
    transactionStatus === "completed";

  const canStartRecovery =
    transactionStatus === "in_collection" ||
    transactionStatus === "paid";

  const recoveryStarted = records.length > 0;

  const materialName =
    surplus?.material_name ||
    demand?.material_name ||
    "Material";

  const pathway =
    demand?.pathway || latestRecord?.pathway || "other";

  const quantity = Number(
    transaction.quantity || surplus?.quantity || 0
  );

  return (
    <AppShell role="recovery_partner">
      <div className="px-5 py-8 md:px-8 md:py-10">

        {/* BACK */}
        <Link
          href="/partner/transactions"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--green-900)] hover:underline"
        >
          <ArrowLeft size={16} />
          Kembali ke Transaksi
        </Link>

        {/* HEADER */}
        <div className="mb-7">
          <p className="text-sm text-[var(--muted)]">
            Recovery Partner
          </p>

          <div className="mt-1 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                Recovery
              </h1>

              <p className="mt-2 text-base text-[var(--muted)]">
                Kelola proses pemulihan material dari
                transaksi ini.
              </p>
            </div>

            <span className="w-fit rounded-full bg-[var(--mint)] px-4 py-2 text-xs font-bold text-[var(--green-800)]">
              {statusLabels[transactionStatus] ||
                transactionStatus}
            </span>
          </div>
        </div>

        {/* RECOVERY STATUS */}
        <div className="card overflow-hidden bg-[var(--mint)] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[var(--green-800)]">
              <Recycle size={28} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--green-800)]">
                Recovery Process
              </p>

              <h2 className="mt-1 text-2xl font-black">
                {materialName}
              </h2>

              <p className="mt-1 text-sm text-[var(--green-900)]">
                {quantity} {surplus?.unit || "kg"}{" "}
                •{" "}
                {pathwayLabels[pathway] ||
                  pathway.replaceAll("_", " ")}
              </p>
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={<Package size={19} />}
            label="Material"
            value={materialName}
          />

          <SummaryCard
            icon={<Truck size={19} />}
            label="Input Recovery"
            value={`${quantity} ${
              surplus?.unit || "kg"
            }`}
          />

          <SummaryCard
            icon={<Recycle size={19} />}
            label="Pathway"
            value={
              pathwayLabels[pathway] ||
              pathway.replaceAll("_", " ")
            }
          />
        </div>

        {/* TRANSACTION INFORMATION */}
        <section className="mt-7">
          <h2 className="mb-4 text-xl font-black">
            Informasi Transaksi
          </h2>

          <div className="card p-5">
            <div className="grid gap-4 md:grid-cols-2">

              <Detail
                label="Transaction ID"
                value={transaction.id}
              />

              <Detail
                label="Status"
                value={
                  statusLabels[transactionStatus] ||
                  transactionStatus
                }
              />

              <Detail
                label="Quantity"
                value={`${transaction.quantity} ${
                  surplus?.unit || ""
                }`}
              />

              <Detail
                label="Dibuat"
                value={formatDate(
                  transaction.created_at
                )}
              />

              {surplus?.condition && (
                <Detail
                  label="Kondisi Material"
                  value={surplus.condition}
                />
              )}

              {surplus?.location_text && (
                <Detail
                  label="Lokasi"
                  value={surplus.location_text}
                  icon={<MapPin size={15} />}
                />
              )}

            </div>
          </div>
        </section>

        {/* MATCH INFORMATION */}
        {match && (
          <section className="mt-7">
            <h2 className="mb-4 text-xl font-black">
              Match Information
            </h2>

            <div className="card p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <Score
                  label="Overall Match"
                  value={match.score}
                />

                <Score
                  label="Compatibility"
                  value={match.compatibility_score}
                />

                <Score
                  label="Quantity"
                  value={match.quantity_score}
                />

                <Score
                  label="Capacity"
                  value={match.capacity_score}
                />

              </div>

              <div className="mt-4 rounded-xl bg-[var(--mint-2)] p-4">
                <p className="text-xs text-[var(--muted)]">
                  Recovery Pathway
                </p>

                <p className="mt-1 text-sm font-black capitalize">
                  {pathwayLabels[pathway] ||
                    pathway.replaceAll("_", " ")}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* RECOVERY PROCESS */}
        <section className="mt-7">
          <h2 className="mb-4 text-xl font-black">
            Proses Recovery
          </h2>

          <div className="card p-5">

            <div className="grid gap-4 md:grid-cols-3">

              <ProcessStep
                number="01"
                title="Material Diterima"
                description="Material dari supplier telah masuk ke transaksi."
                active
                done={
                  transactionStatus ===
                    "in_collection" ||
                  transactionStatus ===
                    "completed" ||
                  recoveryStarted
                }
              />

              <ProcessStep
                number="02"
                title="Recovery"
                description="Material diproses sesuai recovery pathway."
                active={canStartRecovery || recoveryStarted}
                done={recoveryStarted}
              />

              <ProcessStep
                number="03"
                title="Recovered"
                description="Hasil recovery dicatat sebagai output."
                active={recoveryStarted}
                done={isCompleted}
              />

            </div>

          </div>
        </section>

        {/* RECOVERY RECORD */}
        {latestRecord && (
          <section className="mt-7">
            <h2 className="mb-4 text-xl font-black">
              Recovery Record
            </h2>

            <div className="card p-5">

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--mint)] text-[var(--green-800)]">
                      <CheckCircle2 size={18} />
                    </span>

                    <span className="text-xs font-bold text-[var(--muted)]">
                      Recovery Tercatat
                    </span>
                  </div>

                  <h3 className="mt-3 text-xl font-black">
                    {pathwayLabels[
                      latestRecord.pathway
                    ] ||
                      latestRecord.pathway.replaceAll(
                        "_",
                        " "
                      )}
                  </h3>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">

                <Detail
                  label="Input Quantity"
                  value={`${latestRecord.input_quantity} ${
                    surplus?.unit || "kg"
                  }`}
                />

                <Detail
                  label="Output Quantity"
                  value={
                    latestRecord.output_quantity !==
                    null
                      ? `${latestRecord.output_quantity} ${
                          surplus?.unit || "kg"
                        }`
                      : "Belum dicatat"
                  }
                />

                <Detail
                  label="Recovered At"
                  value={
                    latestRecord.recovered_at
                      ? formatDate(
                          latestRecord.recovered_at
                        )
                      : "Belum dicatat"
                  }
                />

                <Detail
                  label="Dicatat"
                  value={formatDate(
                    latestRecord.created_at
                  )}
                />

              </div>

              {latestRecord.notes && (
                <div className="mt-4 rounded-xl bg-[var(--mint-2)] p-4">
                  <p className="text-xs text-[var(--muted)]">
                    Catatan
                  </p>

                  <p className="mt-1 text-sm leading-6">
                    {latestRecord.notes}
                  </p>
                </div>
              )}

            </div>
          </section>
        )}

        {/* ACTION */}
        <section className="mt-7">
          <div className="card p-6">

            {isCompleted ? (
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                  <CheckCircle2 size={24} />
                </div>

                <div>
                  <h3 className="text-lg font-black">
                    Recovery Selesai
                  </h3>

                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Transaksi ini sudah selesai dan
                    recovery telah tercatat.
                  </p>
                </div>
              </div>
            ) : recoveryStarted ? (
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                    <Recycle size={24} />
                  </div>

                  <div>
                    <h3 className="text-lg font-black">
                      Recovery Sudah Dicatat
                    </h3>

                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Data recovery untuk transaksi ini
                      sudah tersedia.
                    </p>
                  </div>
                </div>

                <Link
                  href="/partner/recovery"
                  className="btn-primary"
                >
                  Lihat Semua Recovery
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : canStartRecovery ? (
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                    <Recycle size={24} />
                  </div>

                  <div>
                    <h3 className="text-lg font-black">
                      Siap Diproses
                    </h3>

                    <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--muted)]">
                      Material sudah berada pada tahap
                      yang dapat diproses. Lanjutkan untuk
                      mencatat hasil recovery.
                    </p>
                  </div>
                </div>

                <Link
                  href={`/partner/recovery/${transaction.id}/record`}
                  className="btn-primary shrink-0"
                >
                  Catat Recovery
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[var(--muted)]">
                  <Clock3 size={24} />
                </div>

                <div>
                  <h3 className="text-lg font-black">
                    Menunggu Proses Pengambilan
                  </h3>

                  <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--muted)]">
                    Recovery dapat dilakukan setelah
                    material masuk ke tahap pengambilan
                    atau pembayaran sesuai status transaksi.
                  </p>
                </div>
              </div>
            )}

          </div>
        </section>

      </div>
    </AppShell>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint)] text-[var(--green-800)]">
          {icon}
        </div>

        <p className="text-sm text-[var(--muted)]">
          {label}
        </p>
      </div>

      <p className="mt-4 text-lg font-black capitalize">
        {value}
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-[var(--mint-2)] p-4">
      <p className="text-xs text-[var(--muted)]">
        {label}
      </p>

      <div className="mt-1 flex items-start gap-2">
        {icon && (
          <span className="mt-0.5 text-[var(--green-800)]">
            {icon}
          </span>
        )}

        <p className="break-all text-sm font-black">
          {value}
        </p>
      </div>
    </div>
  );
}

function Score({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  const score = Math.round(Number(value || 0));

  return (
    <div className="rounded-xl bg-[var(--mint-2)] p-4">
      <p className="text-xs text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[var(--green-800)]">
        {score}%
      </p>
    </div>
  );
}

function ProcessStep({
  number,
  title,
  description,
  active,
  done,
}: {
  number: string;
  title: string;
  description: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        active
          ? "border-[var(--green-800)] bg-[var(--mint-2)]"
          : "border-[var(--border)] bg-white"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
            done
              ? "bg-[var(--green-800)] text-white"
              : active
              ? "bg-[var(--mint)] text-[var(--green-800)]"
              : "bg-gray-100 text-[var(--muted)]"
          }`}
        >
          {done ? (
            <CheckCircle2 size={19} />
          ) : (
            number
          )}
        </div>

        <div>
          <h3 className="font-black">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  Truck,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TransactionDetail({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // =====================================================
  // 1. AMBIL TRANSAKSI
  // =====================================================

  const { data: transaction, error: transactionError } =
    await supabase
      .from("transactions")
      .select(
        `
        id,
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
        updated_at,
        match_id
        `
      )
      .eq("id", id)
      .eq("supplier_id", user.id)
      .maybeSingle();

  console.log(
    "TRANSACTION DETAIL:",
    transaction
  );

  console.log(
    "TRANSACTION DETAIL ERROR:",
    transactionError
  );

  if (transactionError || !transaction) {
    notFound();
  }

  // =====================================================
  // 2. AMBIL SURPLUS
  // =====================================================

  const { data: surplus } = await supabase
    .from("surplus_listings")
    .select(
      `
      id,
      material_name,
      quantity,
      unit,
      condition,
      location_text,
      status
      `
    )
    .eq("id", transaction.surplus_id)
    .maybeSingle();

  // =====================================================
  // 3. AMBIL RECOVERY PARTNER
  // =====================================================
  //
  // Pada schema transactions:
  //
  // buyer_id = recovery partner
  //
  // =====================================================

  const { data: partner } = await supabase
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
    .eq("id", transaction.buyer_id)
    .maybeSingle();

  return (
    <div className="page">
      {/* ================================================= */}
      {/* BACK */}
      {/* ================================================= */}

      <Link
        href="/activity"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--green-800)]"
      >
        <ArrowLeft size={17} />
        Kembali ke Activity
      </Link>

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mt-6">
        <p className="text-sm font-semibold text-[var(--green-700)]">
          Transaction Detail
        </p>

        <h1 className="mt-1">
          {surplus?.material_name ?? "Transaksi"}
        </h1>

        <p className="mt-1">
          Detail perjalanan transaksi ReFarm Loop.
        </p>
      </div>

      {/* ================================================= */}
      {/* MAIN GRID */}
      {/* ================================================= */}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ================================================= */}
        {/* TRANSACTION INFO */}
        {/* ================================================= */}

        <div className="card p-5 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                Material
              </p>

              <h2 className="mt-1 text-2xl font-black text-[var(--green-900)]">
                {surplus?.material_name ?? "-"}
              </h2>
            </div>

            <StatusBadge
              status={transaction.status}
            />
          </div>

          {/* QUANTITY */}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <InfoBox
              label="Quantity"
              value={`${transaction.quantity} ${
                surplus?.unit ?? "unit"
              }`}
            />

            <InfoBox
              label="Lokasi"
              value={surplus?.location_text ?? "-"}
            />

            <InfoBox
              label="Kondisi"
              value={formatStatus(
                surplus?.condition ?? "-"
              )}
            />

            <InfoBox
              label="Harga per unit"
              value={formatCurrency(
                transaction.unit_price
              )}
            />
          </div>

          {/* PARTNER */}

          <div className="mt-6 rounded-2xl bg-[var(--mint)] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              Recovery Partner
            </p>

            <p className="mt-1 text-lg font-black text-[var(--green-900)]">
              {partner?.organization_name ?? "-"}
            </p>

            {partner?.description && (
              <p className="mt-1 text-sm text-[var(--muted)]">
                {partner.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {partner?.verified && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--green-800)]">
                  Terverifikasi
                </span>
              )}

              {partner?.capacity_kg_per_week != null && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                  Kapasitas{" "}
                  {partner.capacity_kg_per_week} kg/minggu
                </span>
              )}
            </div>
          </div>

          {/* FINANCIAL */}

          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              Ringkasan Nilai
            </p>

            <div className="mt-3 space-y-3">
              <MoneyRow
                label="Gross Amount"
                value={transaction.gross_amount}
              />

              <MoneyRow
                label="Platform Fee"
                value={transaction.platform_fee}
              />

              <MoneyRow
                label="Payment Fee"
                value={transaction.payment_fee}
              />

              <div className="border-t border-[var(--line)] pt-3">
                <MoneyRow
                  label="Supplier Amount"
                  value={transaction.supplier_amount}
                  strong
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* TIMELINE */}
        {/* ================================================= */}

        <div className="card p-5 md:p-7">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Transaction Timeline
          </p>

          <h2 className="mt-1 text-xl font-black text-[var(--green-900)]">
            Perjalanan Transaksi
          </h2>

          <div className="mt-6">
            <TransactionTimeline
              status={transaction.status}
              createdAt={transaction.created_at}
              updatedAt={transaction.updated_at}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// =======================================================
// INFO BOX
// =======================================================

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] p-4">
      <p className="text-xs font-semibold text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 font-bold text-[var(--green-900)]">
        {value}
      </p>
    </div>
  );
}

// =======================================================
// MONEY ROW
// =======================================================

function MoneyRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number | null;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? "font-bold text-[var(--green-900)]"
            : "text-sm text-[var(--muted)]"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "font-black text-[var(--green-900)]"
            : "text-sm font-semibold text-[var(--green-800)]"
        }
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

// =======================================================
// STATUS BADGE
// =======================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span className="inline-flex rounded-full bg-[var(--mint)] px-3 py-1.5 text-xs font-bold text-[var(--green-800)]">
      {getTransactionStatusLabel(status)}
    </span>
  );
}

// =======================================================
// TIMELINE
// =======================================================

function TransactionTimeline({
  status,
  createdAt,
  updatedAt,
}: {
  status: string;
  createdAt: string;
  updatedAt: string;
}) {
  const steps = [
    {
      key: "pending",
      label: "Request transaksi dibuat",
      description:
        "Permintaan transaksi berhasil dibuat.",
      icon: Clock,
    },
    {
      key: "awaiting_payment",
      label: "Menunggu pembayaran",
      description:
        "Transaksi menunggu proses pembayaran.",
      icon: CreditCard,
    },
    {
      key: "paid",
      label: "Pembayaran diterima",
      description:
        "Pembayaran telah diterima.",
      icon: CheckCircle2,
    },
    {
      key: "in_collection",
      label: "Dalam proses pengambilan",
      description:
        "Surplus masuk ke proses pengambilan.",
      icon: Truck,
    },
    {
      key: "completed",
      label: "Transaksi selesai",
      description:
        "Proses transaksi telah selesai.",
      icon: CheckCircle2,
    },
  ];

  const currentIndex =
    status === "cancelled" || status === "refunded"
      ? -1
      : steps.findIndex(
          (step) => step.key === status
        );

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const Icon = step.icon;

        const isCompleted =
          currentIndex >= 0 &&
          index <= currentIndex;

        const isCurrent =
          currentIndex === index;

        return (
          <div
            key={step.key}
            className="relative flex gap-4"
          >
            {/* CONNECTOR */}

            {index < steps.length - 1 && (
              <div
                className={`absolute left-[15px] top-9 h-[calc(100%-18px)] w-px ${
                  isCompleted
                    ? "bg-[var(--green-700)]"
                    : "bg-[var(--line)]"
                }`}
              />
            )}

            {/* ICON */}

            <div
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                isCompleted
                  ? "bg-[var(--green-700)] text-white"
                  : "bg-[var(--line)] text-[var(--muted)]"
              }`}
            >
              <Icon size={15} />
            </div>

            {/* TEXT */}

            <div className="pb-7">
              <p
                className={`text-sm font-bold ${
                  isCurrent || isCompleted
                    ? "text-[var(--green-900)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {step.label}
              </p>

              <p className="mt-1 text-xs text-[var(--muted)]">
                {step.description}
              </p>

              {index === 0 && (
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  {formatDateTime(createdAt)}
                </p>
              )}

              {isCurrent && index !== 0 && (
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  Terakhir diperbarui{" "}
                  {formatDateTime(updatedAt)}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* CANCELLED */}

      {status === "cancelled" && (
        <div className="mt-2 flex gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <XCircle size={15} />
          </div>

          <div>
            <p className="text-sm font-bold text-red-700">
              Transaksi dibatalkan
            </p>

            <p className="mt-1 text-xs text-[var(--muted)]">
              Transaksi ini tidak dilanjutkan.
            </p>
          </div>
        </div>
      )}

      {/* REFUNDED */}

      {status === "refunded" && (
        <div className="mt-2 flex gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <RotateCcw size={15} />
          </div>

          <div>
            <p className="text-sm font-bold text-orange-700">
              Dana dikembalikan
            </p>

            <p className="mt-1 text-xs text-[var(--muted)]">
              Transaksi telah melalui proses refund.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// =======================================================
// STATUS LABEL
// =======================================================

function getTransactionStatusLabel(
  status: string
) {
  switch (status) {
    case "pending":
      return "Menunggu konfirmasi";

    case "awaiting_payment":
      return "Menunggu pembayaran";

    case "paid":
      return "Pembayaran diterima";

    case "in_collection":
      return "Dalam proses pengambilan";

    case "completed":
      return "Selesai";

    case "cancelled":
      return "Dibatalkan";

    case "refunded":
      return "Dana dikembalikan";

    default:
      return formatStatus(status);
  }
}

// =======================================================
// FORMAT STATUS
// =======================================================

function formatStatus(status: string) {
  if (!status) {
    return "-";
  }

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

// =======================================================
// CURRENCY
// =======================================================

function formatCurrency(
  value: number | null
) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "Rp0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// =======================================================
// DATE
// =======================================================

function formatDateTime(date: string) {
  return new Date(date).toLocaleString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}
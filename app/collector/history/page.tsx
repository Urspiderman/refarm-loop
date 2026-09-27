import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  XCircle,
} from "lucide-react";

type Pickup = {
  id: string;
  transaction_id: string;
  status: string;
  scheduled_at: string | null;
  actual_quantity: number | null;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  created_at: string;
  updated_at: string;
};

export default async function CollectorHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: pickups, error } = await supabase
    .from("pickups")
    .select(`
      id,
      transaction_id,
      status,
      scheduled_at,
      actual_quantity,
      pickup_latitude,
      pickup_longitude,
      delivery_latitude,
      delivery_longitude,
      created_at,
      updated_at
    `)
    .eq("collector_id", user.id)
    .in("status", ["delivered", "cancelled"])
    .order("updated_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "GET COLLECTOR HISTORY ERROR:",
      error
    );
  }

  const history: Pickup[] = pickups ?? [];

  const completedCount = history.filter(
    (pickup) => pickup.status === "delivered"
  ).length;

  const cancelledCount = history.filter(
    (pickup) => pickup.status === "cancelled"
  ).length;

  const totalQuantity = history.reduce(
    (total, pickup) =>
      total + (pickup.actual_quantity ?? 0),
    0
  );

  return (
    <AppShell role="collector">
      <div className="space-y-6">
        {/* =========================================================
            HEADER
        ========================================================= */}

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/collector/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--green-800)]"
            >
              <ArrowLeft size={16} />
              Kembali ke Dashboard
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-[var(--green-900)]">
              Riwayat Pickup
            </h1>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Lihat seluruh aktivitas pickup yang
              telah selesai atau dibatalkan.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-[var(--green-900)] shadow-sm">
            <Clock3
              size={17}
              className="text-[var(--green-800)]"
            />
            {history.length} riwayat
          </div>
        </div>

        {/* =========================================================
            STATISTICS
        ========================================================= */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            icon={<CheckCircle2 size={18} />}
            label="Pickup Selesai"
            value={completedCount}
          />

          <Stat
            icon={<XCircle size={18} />}
            label="Pickup Dibatalkan"
            value={cancelledCount}
          />

          <Stat
            icon={<Package size={18} />}
            label="Total Barang Diantar"
            value={`${totalQuantity} kg`}
          />
        </div>

        {/* =========================================================
            HISTORY LIST
        ========================================================= */}

        {history.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--mint-2)] text-[var(--green-800)]">
              <Clock3 size={26} />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-[var(--green-900)]">
              Belum ada riwayat pickup
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
              Pickup yang sudah selesai atau
              dibatalkan akan muncul di halaman
              ini.
            </p>

            <Link
              href="/collector/pickups"
              className="btn-primary mt-5 inline-flex items-center gap-2"
            >
              <Package size={17} />
              Lihat Pickup
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((pickup) => (
              <HistoryCard
                key={pickup.id}
                pickup={pickup}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* =========================================================
   HISTORY CARD
========================================================= */

function HistoryCard({
  pickup,
}: {
  pickup: Pickup;
}) {
  const delivered =
    pickup.status === "delivered";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* LEFT */}
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                delivered
                  ? "bg-[var(--mint-2)] text-[var(--green-800)]"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {delivered ? (
                <CheckCircle2 size={20} />
              ) : (
                <XCircle size={20} />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-[var(--green-900)]">
                  Pickup #{pickup.id.slice(0, 8)}
                </h2>

                <StatusBadge
                  status={pickup.status}
                />
              </div>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Transaction #
                {pickup.transaction_id.slice(0, 8)}
              </p>
            </div>
          </div>

          {/* INFO */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info
              label="Tanggal"
              value={formatDate(
                pickup.updated_at
              )}
            />

            <Info
              label="Quantity Aktual"
              value={
                pickup.actual_quantity !== null
                  ? `${pickup.actual_quantity} kg`
                  : "-"
              }
            />

            <Info
              label="Pickup"
              value={
                pickup.pickup_latitude !== null &&
                pickup.pickup_longitude !== null
                  ? `${pickup.pickup_latitude.toFixed(
                      4
                    )}, ${pickup.pickup_longitude.toFixed(
                      4
                    )}`
                  : "Tidak tersedia"
              }
            />

            <Info
              label="Tujuan"
              value={
                pickup.delivery_latitude !==
                  null &&
                pickup.delivery_longitude !== null
                  ? `${pickup.delivery_latitude.toFixed(
                      4
                    )}, ${pickup.delivery_longitude.toFixed(
                      4
                    )}`
                  : "Tidak tersedia"
              }
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          <Link
            href={`/collector/pickups/${pickup.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--green-900)] transition hover:bg-[var(--mint-2)]"
          >
            <Package size={16} />
            Lihat Detail
          </Link>

          {pickup.pickup_latitude !== null &&
            pickup.pickup_longitude !== null && (
              <a
                href={`https://www.openstreetmap.org/?mlat=${pickup.pickup_latitude}&mlon=${pickup.pickup_longitude}#map=16/${pickup.pickup_latitude}/${pickup.pickup_longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--green-800)] transition hover:bg-[var(--mint-2)]"
              >
                <MapPin size={16} />
                Lihat Lokasi
              </a>
            )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STAT
========================================================= */

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint-2)] text-[var(--green-800)]">
          {icon}
        </div>

        <div>
          <p className="text-xs text-[var(--muted)]">
            {label}
          </p>

          <p className="mt-1 text-xl font-bold text-[var(--green-900)]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INFO
========================================================= */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-[var(--green-900)]">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const delivered =
    status === "delivered";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        delivered
          ? "bg-[var(--mint-2)] text-[var(--green-800)]"
          : "bg-red-50 text-red-600"
      }`}
    >
      {delivered
        ? "Delivered"
        : "Cancelled"}
    </span>
  );
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
  value: string | null
) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(value));
}
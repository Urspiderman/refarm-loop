import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import {
  Truck,
  Package,
  MapPin,
  Clock3,
  ArrowRight,
} from "lucide-react";

export default async function Pickups() {
  const s = await createClient();

  const {
    data: { user },
  } = await s.auth.getUser();

  // Jika belum login
  if (!user) {
    return null;
  }

  // =========================================================
  // PICKUPS
  // =========================================================

  const { data: pickups } = await s
    .from("pickups")
    .select(`
      id,
      transaction_id,
      status,
      scheduled_at,
      pickup_latitude,
      pickup_longitude,
      delivery_latitude,
      delivery_longitude,
      actual_quantity,
      pickup_proof_path,
      delivery_proof_path
    `)
    .eq("collector_id", user.id)
    .order("scheduled_at", {
      ascending: true,
    });

  const pickupRows = pickups || [];

  // =========================================================
  // STATISTICS
  // =========================================================

  const activeCount = pickupRows.filter((pickup) =>
    [
      "scheduled",
      "accepted",
      "on_the_way",
      "picked_up",
    ].includes(pickup.status)
  ).length;

  const scheduledCount = pickupRows.filter(
    (pickup) => pickup.status === "scheduled"
  ).length;

  const onTheWayCount = pickupRows.filter(
    (pickup) => pickup.status === "on_the_way"
  ).length;

  const deliveredCount = pickupRows.filter(
    (pickup) => pickup.status === "delivered"
  ).length;

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <AppShell role="collector">
      <div className="px-5 py-8 md:px-8 md:py-10">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-7">

          <p className="text-sm text-[var(--muted)]">
            Collector
          </p>

          <h1 className="mt-1 text-4xl font-black tracking-tight">
            Pickup
          </h1>

          <p className="mt-2 text-base text-[var(--muted)]">
            Kelola tugas pengambilan dan pengantaran surplus
            yang diberikan kepada Anda.
          </p>

        </div>

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">

          <Stat
            label="Pickup Aktif"
            value={activeCount}
          />

          <Stat
            label="Menunggu"
            value={scheduledCount}
          />

          <Stat
            label="Dalam Perjalanan"
            value={onTheWayCount}
          />

          <Stat
            label="Selesai"
            value={deliveredCount}
          />

        </div>

        {/* =====================================================
            PICKUP LIST
        ===================================================== */}

        <section className="mt-7">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="text-xl font-black">
                Tugas Pickup
              </h2>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Daftar tugas pickup yang terhubung dengan akun Anda.
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-full bg-[var(--mint-2)] px-3 py-1.5 text-xs font-bold text-[var(--green-800)] sm:flex">
              <Truck size={14} />
              {pickupRows.length} Pickup
            </div>

          </div>

          {pickupRows.length > 0 ? (

            <div className="space-y-4">

              {pickupRows.map((pickup) => (

                <Link
                  href={`/collector/pickups/${pickup.id}`}
                  key={pickup.id}
                  className="card block p-5 transition hover:bg-[var(--mint-2)]"
                >

                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                    {/* =================================================
                        PICKUP INFORMATION
                    ================================================= */}

                    <div className="flex min-w-0 items-start gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--mint)] text-[var(--green-800)]">
                        <Truck size={21} />
                      </div>

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="text-base font-black">
                            Pickup #{pickup.id.slice(0, 8)}
                          </h3>

                          <StatusBadge status={pickup.status} />

                        </div>

                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Transaction #{pickup.transaction_id.slice(0, 8)}
                        </p>

                        {pickup.actual_quantity !== null && (
                          <div className="mt-3 flex items-center gap-2 text-sm font-bold">
                            <Package
                              size={15}
                              className="text-[var(--green-800)]"
                            />
                            {Number(
                              pickup.actual_quantity || 0
                            ).toLocaleString("id-ID")}{" "}
                            unit
                          </div>
                        )}

                      </div>

                    </div>

                    {/* =================================================
                        PICKUP DETAILS
                    ================================================= */}

                    <div className="grid gap-3 sm:grid-cols-2 md:min-w-[320px]">

                      <div className="flex items-center gap-3 rounded-xl bg-[var(--mint-2)] px-3 py-2.5">

                        <Clock3
                          size={16}
                          className="shrink-0 text-[var(--green-800)]"
                        />

                        <div className="min-w-0">

                          <p className="text-xs text-[var(--muted)]">
                            Jadwal
                          </p>

                          <p className="text-sm font-bold">
                            {formatDate(pickup.scheduled_at)}
                          </p>

                        </div>

                      </div>

                      <div className="flex items-center gap-3 rounded-xl bg-[var(--mint-2)] px-3 py-2.5">

                        <MapPin
                          size={16}
                          className="shrink-0 text-[var(--green-800)]"
                        />

                        <div className="min-w-0">

                          <p className="text-xs text-[var(--muted)]">
                            Rute
                          </p>

                          <p className="truncate text-sm font-bold">
                            Pickup → Delivery
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* =================================================
                        ARROW
                    ================================================= */}

                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)] md:flex">

                      <ArrowRight size={18} />

                    </div>

                  </div>

                </Link>

              ))}

            </div>

          ) : (

            <div className="card p-10 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                <Truck size={26} />
              </div>

              <h3 className="mt-4 text-lg font-black">
                Belum ada pickup
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-[var(--muted)]">
                Belum ada tugas pickup yang diberikan kepada
                akun Collector ini.
              </p>

            </div>

          )}

        </section>

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

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {

  const statusMap: Record<string, string> = {
    scheduled: "Menunggu",
    accepted: "Diterima",
    on_the_way: "Dalam Perjalanan",
    picked_up: "Sudah Diambil",
    delivered: "Selesai",
    cancelled: "Dibatalkan",
  };

  return (
    <span className="rounded-full bg-[var(--mint-2)] px-2.5 py-1 text-xs font-bold text-[var(--green-800)]">
      {statusMap[status] || status}
    </span>
  );
}

/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(date: string | null) {

  if (!date) {
    return "Belum dijadwalkan";
  }

  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
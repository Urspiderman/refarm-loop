import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import PickupActions from "./PickupActions";
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  Clock3,
  CheckCircle2,
  Circle,
  Camera,
} from "lucide-react";

export default async function PickupDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const s = await createClient();

  const {
    data: { user },
  } = await s.auth.getUser();

  // =========================================================
  // AUTH
  // =========================================================

  if (!user) {
    return null;
  }

  // =========================================================
  // PICKUP
  // =========================================================

  const { data: pickup } = await s
    .from("pickups")
    .select(`
      id,
      transaction_id,
      collector_id,
      status,
      scheduled_at,
      pickup_latitude,
      pickup_longitude,
      delivery_latitude,
      delivery_longitude,
      actual_quantity,
      pickup_proof_path,
      delivery_proof_path,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .eq("collector_id", user.id)
    .single();

  if (!pickup) {
    notFound();
  }

  // =========================================================
  // TRANSACTION
  // =========================================================

  const { data: transaction } = await s
    .from("transactions")
    .select(`
      id,
      surplus_id,
      quantity,
      status,
      created_at
    `)
    .eq("id", pickup.transaction_id)
    .single();

  // =========================================================
  // SURPLUS
  // =========================================================

  let surplus = null;

  if (transaction?.surplus_id) {
    const { data } = await s
      .from("surplus_listings")
      .select(`
        id,
        material_name,
        quantity,
        unit,
        condition,
        location_text
      `)
      .eq("id", transaction.surplus_id)
      .single();

    surplus = data;
  }

  // =========================================================
  // PICKUP EVENTS
  // =========================================================

  const { data: events } = await s
    .from("pickup_events")
    .select(`
      id,
      status,
      latitude,
      longitude,
      note,
      proof_path,
      created_at
    `)
    .eq("pickup_id", pickup.id)
    .order("created_at", {
      ascending: true,
    });

  const eventRows = events || [];

  // =========================================================
  // STATUS MAP
  // =========================================================

  const statusMap: Record<string, string> = {
    scheduled: "Menunggu",
    accepted: "Diterima",
    on_the_way: "Dalam Perjalanan",
    picked_up: "Sudah Diambil",
    delivered: "Selesai",
    cancelled: "Dibatalkan",
  };

  const currentStatus =
    statusMap[pickup.status] || pickup.status;

  // =========================================================
  // STATUS TIMELINE
  // =========================================================

  const statusOrder = [
    "scheduled",
    "accepted",
    "on_the_way",
    "picked_up",
    "delivered",
  ];

  const currentIndex = statusOrder.indexOf(
    pickup.status
  );

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <AppShell role="collector">
      <div className="px-5 py-8 md:px-8 md:py-10">

        {/* =====================================================
            BACK
        ===================================================== */}

        <Link
          href="/collector/pickups"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--green-800)]"
        >
          <ArrowLeft size={17} />
          Kembali ke Pickup
        </Link>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

          <div>
            <p className="text-sm text-[var(--muted)]">
              Detail Pickup
            </p>

            <h1 className="mt-1 text-4xl font-black tracking-tight">
              Pickup #{pickup.id.slice(0, 8)}
            </h1>

            <p className="mt-2 text-base text-[var(--muted)]">
              Transaction #
              {pickup.transaction_id.slice(0, 8)}
            </p>
          </div>

          <StatusBadge status={pickup.status} />

        </div>

        {/* =====================================================
            MAIN INFORMATION
        ===================================================== */}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">

          {/* ===================================================
              LEFT
          =================================================== */}

          <section className="space-y-6">

            {/* =================================================
                SURPLUS
            ================================================= */}

            <div className="card p-6">

              <h2 className="text-xl font-black">
                Informasi Surplus
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <Info
                  icon={<Package size={18} />}
                  label="Material"
                  value={
                    surplus?.material_name ||
                    "Tidak tersedia"
                  }
                />

                <Info
                  icon={<Package size={18} />}
                  label="Jumlah"
                  value={
                    surplus
                      ? `${Number(
                          surplus.quantity || 0
                        ).toLocaleString("id-ID")} ${
                          surplus.unit || ""
                        }`
                      : transaction
                        ? `${Number(
                            transaction.quantity || 0
                          ).toLocaleString("id-ID")} unit`
                        : "-"
                  }
                />

                <Info
                  icon={<Package size={18} />}
                  label="Kondisi"
                  value={surplus?.condition || "-"}
                />

                <Info
                  icon={<MapPin size={18} />}
                  label="Lokasi"
                  value={
                    surplus?.location_text || "-"
                  }
                />

              </div>

            </div>

            {/* =================================================
                ROUTE
            ================================================= */}

            <div className="card p-6">

              <h2 className="text-xl font-black">
                Rute Pengantaran
              </h2>

              <div className="mt-5 space-y-4">

                <LocationCard
                  label="Titik Pickup"
                  latitude={pickup.pickup_latitude}
                  longitude={pickup.pickup_longitude}
                />

                <div className="ml-5 h-5 border-l-2 border-dashed border-[var(--border)]" />

                <LocationCard
                  label="Titik Delivery"
                  latitude={pickup.delivery_latitude}
                  longitude={pickup.delivery_longitude}
                />

              </div>

            </div>

            {/* =================================================
                PROOF
            ================================================= */}

            <div className="card p-6">

              <h2 className="text-xl font-black">
                Bukti Pengantaran
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <ProofCard
                  label="Bukti Pickup"
                  available={Boolean(
                    pickup.pickup_proof_path
                  )}
                />

                <ProofCard
                  label="Bukti Delivery"
                  available={Boolean(
                    pickup.delivery_proof_path
                  )}
                />

              </div>

            </div>

          </section>

          {/* ===================================================
              SIDEBAR
          =================================================== */}

          <section className="space-y-6">

            {/* =================================================
                ACTION
            ================================================= */}

            <PickupActions
              pickupId={pickup.id}
              status={pickup.status}
            />

            {/* =================================================
                PICKUP SUMMARY
            ================================================= */}

            <div className="card p-6">

              <h2 className="text-xl font-black">
                Ringkasan
              </h2>

              <div className="mt-5 space-y-4">

                <Summary
                  label="Status"
                  value={currentStatus}
                />

                <Summary
                  label="Jadwal"
                  value={formatDate(
                    pickup.scheduled_at
                  )}
                />

                <Summary
                  label="Jumlah Aktual"
                  value={
                    pickup.actual_quantity !== null
                      ? `${Number(
                          pickup.actual_quantity
                        ).toLocaleString("id-ID")} unit`
                      : "Belum dicatat"
                  }
                />

                <Summary
                  label="Dibuat"
                  value={formatDate(
                    pickup.created_at
                  )}
                />

              </div>

            </div>

            {/* =================================================
                STATUS TIMELINE
            ================================================= */}

            <div className="card p-6">

              <h2 className="text-xl font-black">
                Status Pickup
              </h2>

              <div className="mt-5 space-y-5">

                {statusOrder.map(
                  (status, index) => {

                    const isCompleted =
                      currentIndex >= index;

                    const isCurrent =
                      pickup.status === status;

                    return (
                      <div
                        key={status}
                        className="flex items-start gap-3"
                      >

                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            isCompleted
                              ? "bg-[var(--mint)] text-[var(--green-800)]"
                              : "bg-gray-100 text-[var(--muted)]"
                          }`}
                        >

                          {isCompleted ? (
                            <CheckCircle2 size={17} />
                          ) : (
                            <Circle size={17} />
                          )}

                        </div>

                        <div>

                          <p
                            className={`text-sm font-bold ${
                              isCurrent
                                ? "text-[var(--green-800)]"
                                : ""
                            }`}
                          >
                            {statusMap[status]}
                          </p>

                          {isCurrent && (
                            <p className="mt-0.5 text-xs text-[var(--muted)]">
                              Status saat ini
                            </p>
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

          </section>

        </div>

        {/* =====================================================
            PICKUP EVENTS
        ===================================================== */}

        <section className="mt-6">

          <div className="card p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                <Clock3 size={19} />
              </div>

              <div>

                <h2 className="text-xl font-black">
                  Riwayat Status
                </h2>

                <p className="text-sm text-[var(--muted)]">
                  Catatan perubahan status pickup.
                </p>

              </div>

            </div>

            <div className="mt-5">

              {eventRows.length > 0 ? (

                <div className="space-y-4">

                  {eventRows.map((event) => (

                    <div
                      key={event.id}
                      className="flex items-start gap-4 rounded-2xl bg-[var(--mint-2)] p-4"
                    >

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--green-800)]">
                        <Truck size={17} />
                      </div>

                      <div className="min-w-0">

                        <p className="text-sm font-black">
                          {statusMap[event.status] ||
                            event.status}
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {formatDate(
                            event.created_at
                          )}
                        </p>

                        {event.note && (
                          <p className="mt-2 text-sm">
                            {event.note}
                          </p>
                        )}

                        {(event.latitude !== null &&
                          event.longitude !== null) && (
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            Lokasi:{" "}
                            {event.latitude},{" "}
                            {event.longitude}
                          </p>
                        )}

                      </div>

                    </div>

                  ))}

                </div>

              ) : (

                <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center">

                  <Clock3
                    size={24}
                    className="mx-auto text-[var(--muted)]"
                  />

                  <p className="mt-2 text-sm font-bold">
                    Belum ada riwayat status
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Perubahan status pickup akan
                    tercatat di sini.
                  </p>

                </div>

              )}

            </div>

          </div>

        </section>

      </div>
    </AppShell>
  );
}

/* =========================================================
   INFO COMPONENT
========================================================= */

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[var(--mint-2)] p-4">

      <div className="flex items-center gap-2 text-[var(--green-800)]">
        {icon}

        <p className="text-xs font-bold">
          {label}
        </p>
      </div>

      <p className="mt-2 text-sm font-black">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   LOCATION CARD
========================================================= */

function LocationCard({
  label,
  latitude,
  longitude,
}: {
  label: string;
  latitude: number | null;
  longitude: number | null;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-[var(--mint-2)] p-4">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--green-800)]">
        <MapPin size={18} />
      </div>

      <div className="min-w-0">

        <p className="text-xs text-[var(--muted)]">
          {label}
        </p>

        {latitude !== null &&
        longitude !== null ? (

          <p className="mt-1 text-sm font-bold">
            {latitude}, {longitude}
          </p>

        ) : (

          <p className="mt-1 text-sm font-bold">
            Koordinat belum tersedia
          </p>

        )}

      </div>

    </div>
  );
}

/* =========================================================
   SUMMARY
========================================================= */

function Summary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">

      <p className="text-sm text-[var(--muted)]">
        {label}
      </p>

      <p className="text-right text-sm font-bold">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   PROOF CARD
========================================================= */

function ProofCard({
  label,
  available,
}: {
  label: string;
  available: boolean;
}) {
  return (
    <div className="rounded-2xl bg-[var(--mint-2)] p-4">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--green-800)]">
          <Camera size={18} />
        </div>

        <div>

          <p className="text-xs text-[var(--muted)]">
            {label}
          </p>

          <p className="mt-1 text-sm font-bold">
            {available
              ? "Bukti tersedia"
              : "Belum tersedia"}
          </p>

        </div>

      </div>

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
    <span className="w-fit rounded-full bg-[var(--mint-2)] px-3 py-1.5 text-xs font-bold text-[var(--green-800)]">
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
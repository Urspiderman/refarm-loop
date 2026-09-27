import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Package,
} from "lucide-react";
import RouteMapLoader from "./RouteMapLoader";

// =========================================================
// TYPE
// =========================================================

type Pickup = {
  id: string;
  transaction_id: string;
  status: string;
  scheduled_at: string | null;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  actual_quantity: number | null;
};

// =========================================================
// PAGE
// =========================================================

export default async function CollectorRoutePage() {
  const supabase = await createClient();

  // =========================================================
  // AUTH
  // =========================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // =========================================================
  // GET ACTIVE PICKUPS
  // =========================================================

  const { data: pickups, error } = await supabase
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
      actual_quantity
    `)
    .eq("collector_id", user.id)
    .in("status", [
      "scheduled",
      "accepted",
      "on_the_way",
      "picked_up",
    ])
    .order("scheduled_at", {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    console.error(
      "GET COLLECTOR ROUTES ERROR:",
      error
    );
  }

  const activePickups: Pickup[] =
    pickups ?? [];

  // =========================================================
  // SELECT ACTIVE ROUTE
  // =========================================================

  const activeRoute =
    activePickups.find(
      (pickup) =>
        pickup.status === "on_the_way" ||
        pickup.status === "picked_up"
    ) ??
    activePickups[0] ??
    null;

  return (
    <AppShell role="collector">
      <div className="space-y-6">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/collector/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--green-800)]"
            >
              <ArrowLeft size={16} />
              Kembali ke Dashboard
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-[var(--green-900)]">
              Rute Collector
            </h1>

            <p className="mt-1 text-sm text-[var(--muted)]">
              Pantau lokasi pickup dan tujuan
              pengiriman melalui OpenStreetMap.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-[var(--green-900)] shadow-sm">
            <Navigation
              size={17}
              className="text-[var(--green-800)]"
            />

            {activePickups.length} pickup aktif
          </div>
        </div>

        {/* ================================================= */}
        {/* NO ACTIVE ROUTE */}
        {/* ================================================= */}

        {!activeRoute && (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--mint-2)] text-[var(--green-800)]">
              <MapPin size={26} />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-[var(--green-900)]">
              Belum ada rute aktif
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
              Rute akan muncul ketika Anda
              mendapatkan tugas pickup dari
              Partner.
            </p>

            <Link
              href="/collector/pickups"
              className="btn-primary mt-5 inline-flex items-center gap-2"
            >
              <Package size={17} />
              Lihat Pickup
            </Link>
          </div>
        )}

        {/* ================================================= */}
        {/* ACTIVE ROUTE */}
        {/* ================================================= */}

        {activeRoute && (
          <>
            {/* ============================================= */}
            {/* ROUTE INFO */}
            {/* ============================================= */}

            <div className="grid gap-4 md:grid-cols-3">
              <InfoCard
                icon={<Package size={18} />}
                label="Pickup ID"
                value={activeRoute.id.slice(
                  0,
                  8
                )}
              />

              <InfoCard
                icon={<Navigation size={18} />}
                label="Status"
                value={formatStatus(
                  activeRoute.status
                )}
              />

              <InfoCard
                icon={<MapPin size={18} />}
                label="Quantity"
                value={
                  activeRoute.actual_quantity !==
                  null
                    ? `${activeRoute.actual_quantity} kg`
                    : "Belum ditimbang"
                }
              />
            </div>

            {/* ============================================= */}
            {/* MAP */}
            {/* ============================================= */}

            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
              <div className="border-b border-[var(--border)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--mint-2)] text-[var(--green-800)]">
                    <Navigation size={18} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-[var(--green-900)]">
                      Peta Rute
                    </h2>

                    <p className="text-xs text-[var(--muted)]">
                      OpenStreetMap
                    </p>
                  </div>
                </div>
              </div>

              <RouteMapLoader
                pickupLatitude={
                  activeRoute.pickup_latitude
                }
                pickupLongitude={
                  activeRoute.pickup_longitude
                }
                deliveryLatitude={
                  activeRoute.delivery_latitude
                }
                deliveryLongitude={
                  activeRoute.delivery_longitude
                }
              />
            </div>

            {/* ============================================= */}
            {/* ROUTE DETAILS */}
            {/* ============================================= */}

            <div className="grid gap-4 md:grid-cols-2">
              <LocationCard
                title="Lokasi Pickup"
                latitude={
                  activeRoute.pickup_latitude
                }
                longitude={
                  activeRoute.pickup_longitude
                }
              />

              <LocationCard
                title="Lokasi Tujuan"
                latitude={
                  activeRoute.delivery_latitude
                }
                longitude={
                  activeRoute.delivery_longitude
                }
              />
            </div>

            {/* ============================================= */}
            {/* ACTION */}
            {/* ============================================= */}

            <div className="flex justify-end">
              <Link
                href={`/collector/pickups/${activeRoute.id}`}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Package size={17} />
                Buka Detail Pickup
              </Link>
            </div>
          </>
        )}

        {/* ================================================= */}
        {/* OTHER ACTIVE PICKUPS */}
        {/* ================================================= */}

        {activePickups.length > 1 && (
          <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold text-[var(--green-900)]">
                Pickup Aktif Lainnya
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Pilih pickup untuk melihat detail
                rutenya.
              </p>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {activePickups.map(
                (pickup) => (
                  <Link
                    key={pickup.id}
                    href={`/collector/pickups/${pickup.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[var(--mint-2)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--mint-2)] text-[var(--green-800)]">
                        <Package size={17} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-[var(--green-900)]">
                          Pickup #
                          {pickup.id.slice(
                            0,
                            8
                          )}
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {formatStatus(
                            pickup.status
                          )}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-medium text-[var(--green-800)]">
                      Lihat →
                    </span>
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// =========================================================
// INFO CARD
// =========================================================

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--mint-2)] text-[var(--green-800)]">
          {icon}
        </div>

        <div>
          <p className="text-xs text-[var(--muted)]">
            {label}
          </p>

          <p className="mt-1 font-semibold text-[var(--green-900)]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// LOCATION CARD
// =========================================================

function LocationCard({
  title,
  latitude,
  longitude,
}: {
  title: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const hasLocation =
    latitude !== null &&
    longitude !== null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--mint-2)] text-[var(--green-800)]">
          <MapPin size={19} />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-[var(--muted)]">
            {title}
          </p>

          {hasLocation ? (
            <>
              <p className="mt-2 text-sm font-medium text-[var(--green-900)]">
                {latitude.toFixed(6)},{" "}
                {longitude.toFixed(6)}
              </p>

              <a
                href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-semibold text-[var(--green-800)] hover:underline"
              >
                Buka di OpenStreetMap →
              </a>
            </>
          ) : (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Koordinat belum tersedia.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// STATUS
// =========================================================

function formatStatus(status: string) {
  const labels: Record<
    string,
    string
  > = {
    scheduled: "Scheduled",
    accepted: "Accepted",
    on_the_way: "On The Way",
    picked_up: "Picked Up",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return labels[status] ?? status;
}
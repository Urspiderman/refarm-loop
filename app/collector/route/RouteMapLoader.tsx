"use client";

import dynamic from "next/dynamic";

// =========================================================
// DYNAMIC MAP
// =========================================================

const RouteMap = dynamic(
  () => import("./RouteMap"),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-[520px] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--green-800)]" />

          <p className="text-sm text-[var(--muted)]">
            Memuat peta...
          </p>
        </div>
      </div>
    ),
  }
);

// =========================================================
// TYPE
// =========================================================

type RouteMapLoaderProps = {
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
};

// =========================================================
// COMPONENT
// =========================================================

export default function RouteMapLoader({
  pickupLatitude,
  pickupLongitude,
  deliveryLatitude,
  deliveryLongitude,
}: RouteMapLoaderProps) {
  return (
    <RouteMap
      pickupLatitude={pickupLatitude}
      pickupLongitude={pickupLongitude}
      deliveryLatitude={deliveryLatitude}
      deliveryLongitude={deliveryLongitude}
    />
  );
}
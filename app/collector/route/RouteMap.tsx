"use client";

import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

// =========================================================
// TYPE
// =========================================================

type RouteMapProps = {
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
};

type Coordinate = [
  number,
  number
];

// =========================================================
// ICON
// =========================================================

const pickupIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: white;
      border: 3px solid #16a34a;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 12px rgba(0,0,0,.20);
      font-size: 18px;
    ">
      📦
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const deliveryIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: white;
      border: 3px solid #0f766e;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 12px rgba(0,0,0,.20);
      font-size: 18px;
    ">
      🏁
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

// =========================================================
// COMPONENT
// =========================================================

export default function RouteMap({
  pickupLatitude,
  pickupLongitude,
  deliveryLatitude,
  deliveryLongitude,
}: RouteMapProps) {
  const hasPickup =
    pickupLatitude !== null &&
    pickupLongitude !== null;

  const hasDelivery =
    deliveryLatitude !== null &&
    deliveryLongitude !== null;

  // =======================================================
  // NO LOCATION
  // =======================================================

  if (!hasPickup && !hasDelivery) {
    return (
      <div className="flex h-[520px] items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <p className="font-semibold text-[var(--green-900)]">
            Lokasi belum tersedia
          </p>

          <p className="mt-1 text-sm text-[var(--muted)]">
            Koordinat pickup dan tujuan belum
            tersedia.
          </p>
        </div>
      </div>
    );
  }

  // =======================================================
  // COORDINATES
  // =======================================================

  const pickup: Coordinate | null =
    hasPickup
      ? [
          pickupLatitude!,
          pickupLongitude!,
        ]
      : null;

  const delivery: Coordinate | null =
    hasDelivery
      ? [
          deliveryLatitude!,
          deliveryLongitude!,
        ]
      : null;

  const center: Coordinate =
    pickup ??
    delivery ??
    [0, 0];

  const routeCoordinates: Coordinate[] =
    [];

  if (pickup) {
    routeCoordinates.push(
      pickup
    );
  }

  if (delivery) {
    routeCoordinates.push(
      delivery
    );
  }

  return (
    <div className="relative h-[520px] w-full">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        {/* ================================================= */}
        {/* OPENSTREETMAP */}
        {/* ================================================= */}

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ================================================= */}
        {/* PICKUP MARKER */}
        {/* ================================================= */}

        {pickup && (
          <Marker
            position={pickup}
            icon={pickupIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>
                  Lokasi Pickup
                </strong>

                <br />

                Lokasi pengambilan
                barang.
              </div>
            </Popup>
          </Marker>
        )}

        {/* ================================================= */}
        {/* DELIVERY MARKER */}
        {/* ================================================= */}

        {delivery && (
          <Marker
            position={delivery}
            icon={deliveryIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>
                  Lokasi Tujuan
                </strong>

                <br />

                Lokasi pengiriman
                barang.
              </div>
            </Popup>
          </Marker>
        )}

        {/* ================================================= */}
        {/* ROUTE LINE */}
        {/* ================================================= */}

        {routeCoordinates.length >=
          2 && (
          <Polyline
            positions={
              routeCoordinates
            }
            pathOptions={{
              color: "#16a34a",
              weight: 5,
              opacity: 0.75,
            }}
          />
        )}

        {/* ================================================= */}
        {/* AUTO FIT */}
        {/* ================================================= */}

        {routeCoordinates.length >=
          1 && (
          <FitBounds
            coordinates={
              routeCoordinates
            }
          />
        )}
      </MapContainer>

      {/* =================================================== */}
      {/* MAP LEGEND */}
      {/* =================================================== */}

      <div className="absolute bottom-4 left-4 z-[1000] rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="flex items-center gap-4 text-xs">
          {/* PICKUP */}

          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-green-600 bg-white">
              📦
            </span>

            <span className="font-medium text-slate-700">
              Pickup
            </span>
          </div>

          {/* DELIVERY */}

          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-teal-700 bg-white">
              🏁
            </span>

            <span className="font-medium text-slate-700">
              Tujuan
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// FIT BOUNDS
// =========================================================

function FitBounds({
  coordinates,
}: {
  coordinates: Coordinate[];
}) {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length === 0) {
      return;
    }

    if (coordinates.length === 1) {
      map.setView(
        coordinates[0],
        15
      );

      return;
    }

    const bounds =
      L.latLngBounds(
        coordinates
      );

    map.fitBounds(bounds, {
      padding: [50, 50],
    });
  }, [
    map,
    coordinates,
  ]);

  return null;
}
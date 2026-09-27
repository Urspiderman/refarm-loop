"use client";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

import "leaflet/dist/leaflet.css";

type Partner = {
  id?: string;
  partnerId?: string;

  name?: string;
  partnerName?: string;

  lat?: number | null;
  lng?: number | null;

  latitude?: number | null;
  longitude?: number | null;

  score?: number;
  pathway?: string;
  materialName?: string;
  quantityNeeded?: number | string;
};

type RecoveryMapProps = {
  partners: Partner[];
};

const partnerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 38px;
      height: 38px;
      border-radius: 9999px;
      background: #2f6b2f;
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,.25);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      font-weight: 700;
    ">
      ♻
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -20],
});

function FitBounds({
  partners,
}: {
  partners: Partner[];
}) {
  const map = useMap();

  useEffect(() => {
    const validPartners = partners.filter(
      (partner) =>
        typeof partner.latitude === "number" &&
        typeof partner.longitude === "number" &&
        Number.isFinite(partner.latitude) &&
        Number.isFinite(partner.longitude)
    );

    if (validPartners.length === 0) {
      return;
    }

    const bounds = L.latLngBounds(
      validPartners.map((partner) => [
        partner.latitude as number,
        partner.longitude as number,
      ])
    );

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 13,
    });
  }, [partners, map]);

  return null;
}

export default function RecoveryMap({
  partners,
}: RecoveryMapProps) {
  /*
   * Hanya partner dengan koordinat valid
   * yang boleh dirender sebagai Marker.
   */
  const validPartners = partners.filter(
    (partner) => {
      const lat =
        partner.latitude ?? partner.lat;

      const lng =
        partner.longitude ?? partner.lng;

      return (
        typeof lat === "number" &&
        typeof lng === "number" &&
        Number.isFinite(lat) &&
        Number.isFinite(lng)
      );
    }
  );

  /*
   * Koordinat default Indonesia.
   * Dipakai kalau belum ada partner dengan koordinat valid.
   */
  const defaultCenter: [number, number] = [
    -2.5489,
    118.0149,
  ];

  const mapCenter: [number, number] =
    validPartners.length > 0
      ? [
          (validPartners[0].latitude ??
            validPartners[0].lat) as number,
          (validPartners[0].longitude ??
            validPartners[0].lng) as number,
        ]
      : defaultCenter;

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-[var(--line)] md:h-[430px]">
      <MapContainer
        center={mapCenter}
        zoom={validPartners.length > 0 ? 11 : 5}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds partners={validPartners} />

        {validPartners.map((partner, index) => {
          const lat =
            partner.latitude ??
            partner.lat;

          const lng =
            partner.longitude ??
            partner.lng;

          const partnerKey =
            partner.partnerId ??
            partner.id ??
            `partner-${index}`;

          const partnerName =
            partner.partnerName ??
            partner.name ??
            "Recovery Partner";

          return (
            <Marker
              key={partnerKey}
              position={[
                lat as number,
                lng as number,
              ]}
              icon={partnerIcon}
            >
              <Popup>
                <div className="min-w-[210px]">
                  <p className="font-bold text-gray-900">
                    {partnerName}
                  </p>

                  {typeof partner.score ===
                    "number" && (
                    <p className="mt-1 text-sm text-gray-600">
                      Match Score:{" "}
                      <strong>
                        {partner.score.toFixed(1)}
                      </strong>
                    </p>
                  )}

                  {partner.materialName && (
                    <p className="mt-1 text-sm text-gray-600">
                      Material:{" "}
                      {partner.materialName}
                    </p>
                  )}

                  {partner.pathway && (
                    <p className="mt-1 text-sm text-gray-600">
                      Jalur:{" "}
                      {partner.pathway}
                    </p>
                  )}

                  {partner.quantityNeeded !==
                    undefined && (
                    <p className="mt-1 text-sm text-gray-600">
                      Kebutuhan:{" "}
                      {partner.quantityNeeded} kg
                    </p>
                  )}

                  <p className="mt-2 text-xs text-gray-400">
                    {Number(lat).toFixed(5)},{" "}
                    {Number(lng).toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {validPartners.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center">
          <div className="rounded-xl bg-white/95 px-5 py-4 text-center shadow-lg">
            <p className="text-sm font-bold text-gray-800">
              Belum ada lokasi partner
            </p>

            <p className="mt-1 max-w-[280px] text-xs text-gray-500">
              Recovery partner akan muncul di
              peta setelah memiliki lokasi
              demand yang valid.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
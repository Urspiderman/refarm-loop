"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, MapPin } from "lucide-react";

type Props = {
  defaultLatitude?: number | null;
  defaultLongitude?: number | null;
};

export default function DemandLocationPicker({
  defaultLatitude = null,
  defaultLongitude = null,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [latitude, setLatitude] = useState<number | null>(
    defaultLatitude
  );

  const [longitude, setLongitude] = useState<number | null>(
    defaultLongitude
  );

  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    /*
     * Jangan pakai lokasi dummy sebagai data.
     * Ini hanya posisi awal visual peta.
     */
    const initialLatitude = defaultLatitude ?? -2.5489;
    const initialLongitude = defaultLongitude ?? 118.0149;

    const map = L.map(mapContainerRef.current, {
      center: [initialLatitude, initialLongitude],
      zoom:
        defaultLatitude !== null &&
        defaultLongitude !== null
          ? 14
          : 5,
    });

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    ).addTo(map);

    mapRef.current = map;

    /*
     * Marker awal jika partner sudah punya koordinat.
     */
    if (
      defaultLatitude !== null &&
      defaultLongitude !== null
    ) {
      const marker = L.marker(
        [defaultLatitude, defaultLongitude],
        {
          draggable: true,
        }
      ).addTo(map);

      marker.on("dragend", () => {
        const position = marker.getLatLng();

        setLatitude(position.lat);
        setLongitude(position.lng);
      });

      markerRef.current = marker;
    }

    /*
     * Klik map = pilih lokasi.
     */
    map.on("click", (event) => {
      const { lat, lng } = event.latlng;

      setLatitude(lat);
      setLongitude(lng);

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          draggable: true,
        }).addTo(map);

        marker.on("dragend", () => {
          const position = marker.getLatLng();

          setLatitude(position.lat);
          setLongitude(position.lng);
        });

        markerRef.current = marker;
      }
    });

    /*
     * Leaflet perlu invalidateSize setelah container
     * selesai dirender.
     */
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;

      map.remove();
      mapRef.current = null;
    };
  }, [defaultLatitude, defaultLongitude]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert(
        "Browser kamu tidak mendukung akses lokasi."
      );
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);

        const map = mapRef.current;

        if (map) {
          map.flyTo([lat, lng], 16, {
            duration: 1.2,
          });

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            const marker = L.marker([lat, lng], {
              draggable: true,
            }).addTo(map);

            marker.on("dragend", () => {
              const position = marker.getLatLng();

              setLatitude(position.lat);
              setLongitude(position.lng);
            });

            markerRef.current = marker;
          }
        }

        setLocating(false);
      },
      (error) => {
        console.error(error);

        setLocating(false);

        alert(
          "Lokasi tidak dapat diakses. Silakan izinkan akses lokasi pada browser atau pilih lokasi secara manual di peta."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  return (
    <div className="space-y-4">

      {/* INFO */}
      <div className="flex flex-col gap-3 rounded-2xl bg-[var(--mint)] p-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--green-800)]">
            <MapPin size={19} />
          </div>

          <div>
            <p className="text-sm font-bold text-[var(--green-900)]">
              Lokasi Penerimaan Material
            </p>

            <p className="mt-1 text-xs leading-5 text-[var(--green-900)]">
              Klik pada peta untuk memilih lokasi,
              atau gunakan lokasi perangkat kamu.
              Marker juga bisa digeser.
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[var(--green-800)] transition hover:bg-[var(--mint-2)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LocateFixed size={15} />

          {locating
            ? "Mencari lokasi..."
            : "Gunakan Lokasi Saya"}
        </button>

      </div>

      {/* MAP */}
      <div
        ref={mapContainerRef}
        className="h-[360px] w-full overflow-hidden rounded-2xl border border-[var(--line)] md:h-[430px]"
      />

      {/* COORDINATES */}
      <div className="grid gap-3 sm:grid-cols-2">

        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">
            Latitude
          </p>

          <p className="mt-1 text-sm font-bold">
            {latitude !== null
              ? latitude.toFixed(6)
              : "Belum dipilih"}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
          <p className="text-xs font-semibold text-[var(--muted)]">
            Longitude
          </p>

          <p className="mt-1 text-sm font-bold">
            {longitude !== null
              ? longitude.toFixed(6)
              : "Belum dipilih"}
          </p>
        </div>

      </div>

      {/* FORM VALUES */}
      <input
        type="hidden"
        name="latitude"
        value={latitude ?? ""}
      />

      <input
        type="hidden"
        name="longitude"
        value={longitude ?? ""}
      />

      {/* STATUS */}
      {latitude === null || longitude === null ? (
        <p className="text-xs font-semibold text-amber-600">
          Pilih lokasi penerimaan material sebelum
          menyimpan demand.
        </p>
      ) : (
        <p className="text-xs font-semibold text-[var(--green-800)]">
          Lokasi sudah dipilih. Koordinat akan digunakan
          untuk matching dan perencanaan collection.
        </p>
      )}

    </div>
  );
}
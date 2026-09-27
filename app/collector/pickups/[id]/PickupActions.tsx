"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Truck,
  PackageCheck,
  Loader2,
  MapPin,
} from "lucide-react";

type PickupStatus =
  | "scheduled"
  | "accepted"
  | "on_the_way"
  | "picked_up"
  | "delivered"
  | "cancelled";

type PickupActionsProps = {
  pickupId: string;
  status: PickupStatus;
};

type LocationData = {
  latitude: number;
  longitude: number;
};

export default function PickupActions({
  pickupId,
  status,
}: PickupActionsProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // GET CURRENT GPS LOCATION
  // =========================================================

  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error(
            "Browser tidak mendukung fitur GPS."
          )
        );

        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          if (error.code === 1) {
            reject(
              new Error(
                "Izin lokasi ditolak. Silakan aktifkan izin lokasi pada browser."
              )
            );
          } else if (error.code === 2) {
            reject(
              new Error(
                "Lokasi tidak dapat ditemukan. Pastikan GPS atau Location Service aktif."
              )
            );
          } else if (error.code === 3) {
            reject(
              new Error(
                "Permintaan lokasi terlalu lama. Silakan coba lagi."
              )
            );
          } else {
            reject(
              new Error(
                "Gagal mendapatkan lokasi GPS."
              )
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  };

  // =========================================================
  // UPDATE PICKUP STATUS
  // =========================================================

  const updateStatus = async (
    nextStatus: PickupStatus
  ) => {
    try {
      setLoading(true);
      setError("");

      let location: LocationData | null = null;

      // GPS dibutuhkan ketika Collector mulai perjalanan,
      // mengambil barang, dan mengantarkan barang.
      if (
        nextStatus === "on_the_way" ||
        nextStatus === "picked_up" ||
        nextStatus === "delivered"
      ) {
        location = await getCurrentLocation();
      }

      const response = await fetch(
        `/api/collector/pickups/${pickupId}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,

            latitude:
              location?.latitude ?? null,

            longitude:
              location?.longitude ?? null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Gagal memperbarui status pickup."
        );
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <MapPin
            size={18}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div>
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              className="mt-2 text-xs font-semibold text-red-700 underline"
            >
              Coba lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // SCHEDULED
  // =========================================================

  if (status === "scheduled") {
    return (
      <ActionCard
        title="Pickup siap diterima"
        description="Terima tugas pickup untuk mulai menangani pengiriman ini."
        buttonText="Accept Pickup"
        icon={<Check size={18} />}
        loading={loading}
        onClick={() =>
          updateStatus("accepted")
        }
      />
    );
  }

  // =========================================================
  // ACCEPTED
  // =========================================================

  if (status === "accepted") {
    return (
      <ActionCard
        title="Pickup sudah diterima"
        description="Mulai perjalanan menuju lokasi supplier. Lokasi GPS akan dicatat."
        buttonText="Start Journey"
        icon={<Truck size={18} />}
        loading={loading}
        onClick={() =>
          updateStatus("on_the_way")
        }
      />
    );
  }

  // =========================================================
  // ON THE WAY
  // =========================================================

  if (status === "on_the_way") {
    return (
      <ActionCard
        title="Sedang menuju supplier"
        description="Konfirmasi setelah barang berhasil diambil. Lokasi GPS akan dicatat."
        buttonText="Confirm Picked Up"
        icon={<PackageCheck size={18} />}
        loading={loading}
        onClick={() =>
          updateStatus("picked_up")
        }
      />
    );
  }

  // =========================================================
  // PICKED UP
  // =========================================================

  if (status === "picked_up") {
    return (
      <ActionCard
        title="Barang sudah diambil"
        description="Konfirmasi ketika barang sudah sampai di lokasi tujuan. Lokasi GPS akan dicatat."
        buttonText="Confirm Delivered"
        icon={<PackageCheck size={18} />}
        loading={loading}
        onClick={() =>
          updateStatus("delivered")
        }
      />
    );
  }

  // =========================================================
  // DELIVERED
  // =========================================================

  if (status === "delivered") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Check size={20} />
          </div>

          <div>
            <h3 className="font-semibold text-emerald-900">
              Pickup selesai
            </h3>

            <p className="mt-1 text-sm text-emerald-700">
              Barang telah berhasil dikirim ke lokasi
              tujuan dan transaksi telah diselesaikan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // CANCELLED
  // =========================================================

  if (status === "cancelled") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="font-semibold text-red-900">
          Pickup dibatalkan
        </p>

        <p className="mt-1 text-sm text-red-700">
          Pickup ini tidak dapat dilanjutkan.
        </p>
      </div>
    );
  }

  return null;
}

// =========================================================
// ACTION CARD
// =========================================================

function ActionCard({
  title,
  description,
  buttonText,
  icon,
  loading,
  onClick,
}: {
  title: string;
  description: string;
  buttonText: string;
  icon: React.ReactNode;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-[var(--green-900)]">
        {title}
      </h3>

      <p className="mt-1 text-sm text-[var(--muted)]">
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="btn-primary mt-4 inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2
              size={18}
              className="animate-spin"
            />
            Mendapatkan lokasi...
          </>
        ) : (
          <>
            {icon}
            {buttonText}
          </>
        )}
      </button>
    </div>
  );
}
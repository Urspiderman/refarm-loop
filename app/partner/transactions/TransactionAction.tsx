"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Truck,
  UserRound,
  X,
} from "lucide-react";

type Collector = {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  transactionId: string;
  status: string;
};

export default function TransactionAction({
  transactionId,
  status,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingCollectors, setLoadingCollectors] =
    useState(false);

  const [error, setError] = useState("");

  const [showCollectors, setShowCollectors] =
    useState(false);

  const [collectors, setCollectors] = useState<
    Collector[]
  >([]);

  async function openCollectorList() {
    try {
      setLoadingCollectors(true);
      setError("");

      const response = await fetch(
        `/api/partner/transactions/${transactionId}/start-collection`,
        {
          method: "GET",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Gagal mengambil daftar Collector."
        );
      }

      setCollectors(data.collectors || []);
      setShowCollectors(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil daftar Collector."
      );
    } finally {
      setLoadingCollectors(false);
    }
  }

  async function startCollection(
    collectorId: string
  ) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/partner/transactions/${transactionId}/start-collection`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            collector_id: collectorId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Gagal memulai pengambilan."
        );
      }

      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // PENDING
  // =========================================================
  if (status === "pending") {
    return (
      <>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={openCollectorList}
            disabled={loadingCollectors}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Truck className="h-4 w-4" />

            {loadingCollectors
              ? "Memuat Collector..."
              : "Mulai Pengambilan"}

            <ArrowRight className="h-4 w-4" />
          </button>

          {error && (
            <p className="text-xs text-red-600">
              {error}
            </p>
          )}
        </div>

        {showCollectors && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                <div>
                  <h3 className="font-semibold text-[var(--green-900)]">
                    Pilih Collector
                  </h3>

                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Pilih Collector untuk mengambil
                    surplus ini.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowCollectors(false)
                  }
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* COLLECTOR LIST */}
              <div className="max-h-[420px] overflow-y-auto p-4">
                {collectors.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
                    <UserRound className="mx-auto h-8 w-8 text-gray-400" />

                    <p className="mt-3 text-sm font-medium text-[var(--green-900)]">
                      Belum ada Collector
                    </p>

                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Belum ada user dengan role
                      Collector yang tersedia.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {collectors.map((collector) => (
                      <div
                        key={collector.id}
                        className="rounded-xl border border-[var(--border)] p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--mint)] text-[var(--green-800)]">
                              <UserRound className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--green-900)]">
                                {collector.full_name ||
                                  "Collector"}
                              </p>

                              {collector.phone && (
                                <p className="mt-1 text-xs text-[var(--muted)]">
                                  {collector.phone}
                                </p>
                              )}

                              {collector.address && (
                                <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">
                                  {collector.address}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              startCollection(
                                collector.id
                              )
                            }
                            disabled={loading}
                            className="shrink-0 rounded-xl bg-[var(--green-800)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--green-900)] disabled:opacity-50"
                          >
                            {loading
                              ? "Memproses..."
                              : "Pilih"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // =========================================================
  // IN COLLECTION
  // =========================================================
  if (status === "in_collection") {
    return (
      <Link
        href={`/activity/${transactionId}`}
        className="btn-primary inline-flex items-center justify-center gap-2"
      >
        <Truck className="h-4 w-4" />
        Lihat Pengambilan
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  // =========================================================
  // COMPLETED
  // =========================================================
  if (status === "completed") {
    return (
      <Link
        href={`/activity/${transactionId}`}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--green-800)] hover:bg-[var(--mint)]"
      >
        <CheckCircle2 className="h-4 w-4" />
        Lihat Recovery
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  return null;
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";

export default function IncomingActions({
  matchId,
}: {
  matchId: string;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState<"accept" | "reject" | null>(
    null
  );

  const [error, setError] = useState("");

  async function handleAction(action: "accept" | "reject") {
    const confirmMessage =
      action === "accept"
        ? "Terima request recovery ini?"
        : "Tolak request recovery ini?";

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) {
      return;
    }

    setLoading(action);
    setError("");

    try {
      const response = await fetch(
        `/api/partner/incoming/${matchId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Gagal memproses request."
        );
      }

      router.refresh();
    } catch (err) {
      console.error("Incoming action error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan."
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleAction("reject")}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-bold text-[var(--muted)] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === "reject" ? (
            <Loader2
              size={16}
              className="animate-spin"
            />
          ) : (
            <X size={16} />
          )}

          {loading === "reject"
            ? "Menolak..."
            : "Tolak Request"}
        </button>

        <button
          type="button"
          onClick={() => handleAction("accept")}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--green-800)] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === "accept" ? (
            <Loader2
              size={16}
              className="animate-spin"
            />
          ) : (
            <Check size={16} />
          )}

          {loading === "accept"
            ? "Menerima..."
            : "Terima Request"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
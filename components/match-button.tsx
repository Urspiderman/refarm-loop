"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
} from "lucide-react";

export default function MatchButton({
  surplusId,
}: {
  surplusId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function run() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/matching", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          surplus_id: surplusId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Matching gagal."
        );
      }

      if (data.matches?.length) {
        setMessage(
          `${data.matches.length} kandidat partner ditemukan.`
        );
      } else {
        setMessage(
          "Belum ada partner yang cocok."
        );
      }
    } catch (error: any) {
      setMessage(
        error?.message ||
          "Matching gagal."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? (
          <>
            <Loader2
              size={16}
              className="animate-spin"
            />
            Mencari...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Find Recovery Match
          </>
        )}
      </button>

      {message && (
        <p className="mt-2 text-xs text-[var(--muted)]">
          {message}
        </p>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Recycle,
  AlertCircle,
} from "lucide-react";

const pathwayLabels: Record<string, string> = {
  animal_feed: "Pakan Ternak",
  compost: "Kompos",
  organic_fertilizer: "Pupuk Organik",
  food_processing: "Pengolahan Pangan",
  bioconversion: "Biokonversi",
  other: "Lainnya",
};

type TransactionData = {
  id: string;
  quantity: number;
  status: string;
  material_name: string;
  unit: string;
  condition: string | null;
  pathway: string;
};

export default function RecordRecoveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [transactionId, setTransactionId] =
    useState("");

  const [transaction, setTransaction] =
    useState<TransactionData | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [inputQuantity, setInputQuantity] =
    useState("");

  const [outputQuantity, setOutputQuantity] =
    useState("");

  const [pathway, setPathway] =
    useState("other");

  const [recoveredAt, setRecoveredAt] =
    useState("");

  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadTransaction() {
      try {
        const { id } = await params;

        setTransactionId(id);

        const response = await fetch(
          `/api/partner/recovery/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Gagal memuat transaksi."
          );
        }

        setTransaction(data.transaction);

        setInputQuantity(
          String(data.transaction.quantity || "")
        );

        setPathway(
          data.transaction.pathway || "other"
        );

        /*
         * Default tanggal recovery = sekarang.
         */
        const now = new Date();

        const localDateTime = new Date(
          now.getTime() -
            now.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16);

        setRecoveredAt(localDateTime);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal memuat transaksi."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTransaction();
  }, [params]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const input = Number(inputQuantity);
    const output = Number(outputQuantity);

    if (!inputQuantity || input <= 0) {
      setError(
        "Input quantity harus lebih dari 0."
      );
      return;
    }

    if (!outputQuantity || output < 0) {
      setError(
        "Output quantity tidak boleh kosong."
      );
      return;
    }

    if (output > input) {
      setError(
        "Output quantity tidak boleh lebih besar dari input quantity."
      );
      return;
    }

    if (!pathway) {
      setError(
        "Silakan pilih recovery pathway."
      );
      return;
    }

    if (!recoveredAt) {
      setError(
        "Tanggal recovery wajib diisi."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/partner/recovery/${transactionId}/record`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pathway,
            input_quantity: input,
            output_quantity: output,
            recovered_at: new Date(
              recoveredAt
            ).toISOString(),
            notes: notes.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Gagal menyimpan recovery."
        );
      }

      setSuccess(
        "Recovery berhasil dicatat dan transaksi telah diperbarui."
      );

      setTimeout(() => {
        window.location.href = `/partner/recovery/${transactionId}`;
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan recovery."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Memuat transaksi...
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="card p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle size={30} />
            </div>

            <h1 className="mt-5 text-xl font-black">
              Transaksi Tidak Ditemukan
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              {error ||
                "Data transaksi tidak tersedia."}
            </p>

            <Link
              href="/partner/transactions"
              className="btn-primary mt-5 inline-flex"
            >
              Kembali ke Transaksi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="px-5 py-8 md:px-8 md:py-10">
        <div className="mx-auto max-w-4xl">

          {/* BACK */}
          <Link
            href={`/partner/recovery/${transactionId}`}
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--green-900)] hover:underline"
          >
            <ArrowLeft size={16} />
            Kembali ke Recovery
          </Link>

          {/* HEADER */}
          <div className="mb-7">
            <p className="text-sm text-[var(--muted)]">
              Recovery Partner
            </p>

            <h1 className="mt-1 text-4xl font-black tracking-tight">
              Catat Recovery
            </h1>

            <p className="mt-2 text-base text-[var(--muted)]">
              Catat material yang diproses dan hasil
              recovery yang berhasil diperoleh.
            </p>
          </div>

          {/* MATERIAL SUMMARY */}
          <div className="card overflow-hidden bg-[var(--mint)] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[var(--green-800)]">
                <Recycle size={28} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--green-800)]">
                  Material Recovery
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {transaction.material_name}
                </h2>

                <p className="mt-1 text-sm text-[var(--green-900)]">
                  {transaction.quantity}{" "}
                  {transaction.unit}
                  {" • "}
                  {transaction.condition || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="mt-7"
          >
            <div className="card p-6">

              <div className="mb-6">
                <h2 className="text-xl font-black">
                  Data Recovery
                </h2>

                <p className="mt-1 text-sm text-[var(--muted)]">
                  Isi data aktual setelah material
                  diproses.
                </p>
              </div>

              {/* ERROR */}
              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{error}</span>
                </div>
              )}

              {/* SUCCESS */}
              {success && (
                <div className="mb-5 flex items-start gap-3 rounded-xl bg-[var(--mint)] p-4 text-sm text-[var(--green-800)]">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{success}</span>
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">

                {/* INPUT */}
                <div>
                  <label className="text-sm font-bold">
                    Input Quantity
                  </label>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Jumlah material yang masuk ke proses
                    recovery.
                  </p>

                  <div className="mt-2 flex overflow-hidden rounded-xl border border-[var(--border)] bg-white focus-within:border-[var(--green-800)]">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={inputQuantity}
                      onChange={(event) =>
                        setInputQuantity(
                          event.target.value
                        )
                      }
                      className="w-full border-0 bg-transparent px-4 py-3 text-sm outline-none"
                      placeholder="Contoh: 100"
                    />

                    <div className="flex items-center border-l border-[var(--border)] px-4 text-sm font-bold text-[var(--muted)]">
                      {transaction.unit}
                    </div>
                  </div>
                </div>

                {/* OUTPUT */}
                <div>
                  <label className="text-sm font-bold">
                    Output Quantity
                  </label>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Jumlah hasil yang berhasil dipulihkan.
                  </p>

                  <div className="mt-2 flex overflow-hidden rounded-xl border border-[var(--border)] bg-white focus-within:border-[var(--green-800)]">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={outputQuantity}
                      onChange={(event) =>
                        setOutputQuantity(
                          event.target.value
                        )
                      }
                      className="w-full border-0 bg-transparent px-4 py-3 text-sm outline-none"
                      placeholder="Contoh: 80"
                    />

                    <div className="flex items-center border-l border-[var(--border)] px-4 text-sm font-bold text-[var(--muted)]">
                      {transaction.unit}
                    </div>
                  </div>
                </div>

                {/* PATHWAY */}
                <div>
                  <label className="text-sm font-bold">
                    Recovery Pathway
                  </label>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Jalur pemanfaatan material.
                  </p>

                  <select
                    value={pathway}
                    onChange={(event) =>
                      setPathway(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--green-800)]"
                  >
                    <option value="animal_feed">
                      Pakan Ternak
                    </option>

                    <option value="compost">
                      Kompos
                    </option>

                    <option value="organic_fertilizer">
                      Pupuk Organik
                    </option>

                    <option value="food_processing">
                      Pengolahan Pangan
                    </option>

                    <option value="bioconversion">
                      Biokonversi
                    </option>

                    <option value="other">
                      Lainnya
                    </option>
                  </select>
                </div>

                {/* DATE */}
                <div>
                  <label className="text-sm font-bold">
                    Waktu Recovery
                  </label>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Waktu ketika proses recovery dilakukan.
                  </p>

                  <input
                    type="datetime-local"
                    value={recoveredAt}
                    onChange={(event) =>
                      setRecoveredAt(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--green-800)]"
                  />
                </div>

              </div>

              {/* NOTES */}
              <div className="mt-5">
                <label className="text-sm font-bold">
                  Catatan
                </label>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Tambahkan informasi tambahan mengenai
                  proses recovery.
                </p>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  rows={5}
                  className="mt-2 w-full resize-none rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--green-800)]"
                  placeholder="Contoh: Material diproses melalui tahap pemilahan dan pengeringan sebelum masuk ke proses recovery."
                />
              </div>

              {/* INFO */}
              <div className="mt-5 rounded-xl bg-[var(--mint-2)] p-4">
                <div className="flex items-start gap-3">
                  <Recycle
                    size={18}
                    className="mt-0.5 shrink-0 text-[var(--green-800)]"
                  />

                  <div>
                    <p className="text-sm font-black">
                      Recovery Efficiency
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      Output quantity digunakan untuk
                      mencatat jumlah material yang berhasil
                      dipulihkan dari input material.
                    </p>
                  </div>
                </div>
              </div>

              {/* BUTTON */}
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                  href={`/partner/recovery/${transactionId}`}
                  className="btn-secondary justify-center"
                >
                  Batal
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      Simpan Recovery
                    </>
                  )}
                </button>
              </div>

            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
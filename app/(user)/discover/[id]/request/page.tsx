"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Leaf,
  Loader2,
  MapPin,
  Package,
  Sparkles,
} from "lucide-react";

type MatchDetail = {
  id: string;
  surplus_id: string;
  demand_id: string;
  score: number;
  compatibility_score: number | null;
  quantity_score: number | null;
  distance_score: number | null;
  capacity_score: number | null;
  status: string;
};

type Surplus = {
  id: string;
  supplier_id: string;
  material_name: string;
  quantity: number;
  unit: string | null;
  condition: string | null;
  location_text: string | null;
};

type Demand = {
  id: string;
  recovery_partner_id: string;
  material_name: string;
  pathway: string;
  quantity_needed: number;
  capacity_available_kg: number | null;
};

type Partner = {
  id: string;
  organization_name: string;
  description: string | null;
  capacity_kg_per_week: number | null;
  service_radius_km: number | null;
  verified: boolean;
};

function formatPathway(pathway: string) {
  const labels: Record<string, string> = {
    compost: "Compost",
    animal_feed: "Animal Feed",
    organic_fertilizer: "Organic Fertilizer",
    food_processing: "Food Processing",
    bioconversion: "Bioconversion",
    other: "Other",
  };

  return labels[pathway] ?? pathway;
}

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

export default function RequestMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [surplus, setSurplus] = useState<Surplus | null>(null);
  const [demand, setDemand] = useState<Demand | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/discover/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        const contentType =
          response.headers.get("content-type") || "";

        const rawText = await response.text();

        console.log(
          "DISCOVER DETAIL STATUS:",
          response.status
        );

        console.log(
          "DISCOVER DETAIL CONTENT-TYPE:",
          contentType
        );

        console.log(
          "DISCOVER DETAIL RESPONSE:",
          rawText
        );

        if (!response.ok) {
          throw new Error(
            `Gagal mengambil data match (${response.status}). ${
              rawText.slice(0, 300)
            }`
          );
        }

        if (!contentType.includes("application/json")) {
          throw new Error(
            "Response detail match bukan JSON."
          );
        }

        let data: any;

        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(
            "Response detail match bukan JSON yang valid."
          );
        }

        setMatch(data.match ?? null);
        setSurplus(data.surplus ?? null);
        setDemand(data.demand ?? null);
        setPartner(data.partner ?? null);
      } catch (err) {
        console.error(
          "Request match load error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data match."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  async function handleSubmit() {
    if (!match || !surplus || !demand || !partner) {
      setError(
        "Data match belum lengkap. Silakan kembali ke detail match."
      );

      return;
    }

    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      /*
       * PENTING:
       *
       * Di tahap ini kita TIDAK membuat transaction.
       *
       * Supplier hanya mengajukan match.
       *
       * Transaction baru dibuat ketika recovery partner
       * menerima match melalui halaman Incoming.
       */

      const response = await fetch(
        `/api/discover/${match.id}/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            match_id: match.id,
          }),
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      const rawText = await response.text();

      console.log(
        "MATCH REQUEST STATUS:",
        response.status
      );

      console.log(
        "MATCH REQUEST CONTENT-TYPE:",
        contentType
      );

      console.log(
        "MATCH REQUEST RESPONSE:",
        rawText
      );

      let data: any = null;

      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(
            `Response request match bukan JSON yang valid. Status ${response.status}.`
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.error ??
            data?.message ??
            `Gagal mengajukan match (${response.status}).`
        );
      }

      setSuccess(
        "Match berhasil diajukan. Recovery partner akan memproses pengajuan Anda."
      );

      setTimeout(() => {
        window.location.href = "/activity";
      }, 1200);
    } catch (err) {
      console.error(
        "Submit match request error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengajukan match."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7faf2] px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse rounded-[28px] border border-[#dfe8d5] bg-white p-8">
            <div className="h-6 w-32 rounded bg-[#e9f4d5]" />

            <div className="mt-5 h-10 w-2/3 rounded bg-[#edf1e9]" />

            <div className="mt-3 h-5 w-1/2 rounded bg-[#edf1e9]" />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="h-40 rounded-2xl bg-[#edf1e9]" />

              <div className="h-40 rounded-2xl bg-[#edf1e9]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !match) {
    return (
      <main className="min-h-screen bg-[#f7faf2] px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/discover"
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#507531]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Discover
          </Link>

          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-extrabold text-red-700">
              Gagal memuat match
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (
    !match ||
    !surplus ||
    !demand ||
    !partner
  ) {
    return (
      <main className="min-h-screen bg-[#f7faf2] px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/discover"
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#507531]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Discover
          </Link>

          <div className="rounded-[24px] border border-[#dfe8d5] bg-white p-8 text-center">
            <Leaf className="mx-auto h-10 w-10 text-[#63883e]" />

            <h1 className="mt-4 text-xl font-extrabold text-[#263321]">
              Data match tidak lengkap
            </h1>

            <p className="mt-2 text-sm text-[#71806a]">
              Data surplus, demand, atau recovery
              partner tidak ditemukan.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const matchScore = safeNumber(match.score);

  return (
    <main className="min-h-screen bg-[#f7faf2] px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/discover/${match.id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#507531] hover:text-[#385625]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Detail Match
        </Link>

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#587f35]">
            <Sparkles className="h-4 w-4" />
            ReFarm Match Request
          </div>

          <h1 className="text-[36px] font-extrabold tracking-tight text-[#101b0d]">
            Ajukan Match
          </h1>

          <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#60705b]">
            Konfirmasi pengajuan penyaluran surplus
            Anda kepada recovery partner berikut.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-700">
              Pengajuan gagal
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-[18px] border border-green-200 bg-green-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

            <div>
              <p className="text-sm font-bold text-green-700">
                Berhasil
              </p>

              <p className="mt-1 text-sm text-green-600">
                {success}
              </p>
            </div>
          </div>
        )}

        <div className="mb-5 rounded-[26px] border border-[#dfe8d5] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#78905f]">
                Match Score
              </p>

              <div className="mt-1 flex items-end gap-2">
                <span className="text-4xl font-black text-[#557f35]">
                  {matchScore.toFixed(0)}%
                </span>

                <span className="pb-1 text-sm font-semibold text-[#71806a]">
                  compatibility
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-[#f0f6e7] px-5 py-3">
              <p className="text-xs font-bold text-[#71806a]">
                Status
              </p>

              <p className="mt-1 text-sm font-black capitalize text-[#41632d]">
                {match.status || "pending"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-[24px] border border-[#dfe8d5] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f4d5]">
                <Package className="h-5 w-5 text-[#557f35]" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#879181]">
                  Surplus Anda
                </p>

                <h2 className="text-lg font-extrabold text-[#263321]">
                  {surplus.material_name}
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              <InfoRow
                label="Jumlah"
                value={`${safeNumber(
                  surplus.quantity
                ).toLocaleString("id-ID")} ${
                  surplus.unit || "unit"
                }`}
              />

              <InfoRow
                label="Kondisi"
                value={
                  surplus.condition ||
                  "Belum tersedia"
                }
              />

              <InfoRow
                label="Lokasi"
                value={
                  surplus.location_text ||
                  "Lokasi belum tersedia"
                }
              />
            </div>
          </section>

          <section className="rounded-[24px] border border-[#dfe8d5] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f4d5]">
                <Leaf className="h-5 w-5 text-[#557f35]" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#879181]">
                  Recovery Partner
                </p>

                <h2 className="text-lg font-extrabold text-[#263321]">
                  {partner.organization_name}
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              <InfoRow
                label="Kebutuhan"
                value={demand.material_name}
              />

              <InfoRow
                label="Pathway"
                value={formatPathway(
                  demand.pathway
                )}
              />

              <InfoRow
                label="Jumlah Kebutuhan"
                value={`${safeNumber(
                  demand.quantity_needed
                ).toLocaleString("id-ID")} kg`}
              />

              <InfoRow
                label="Kapasitas"
                value={
                  demand.capacity_available_kg !==
                    null &&
                  Number.isFinite(
                    Number(
                      demand.capacity_available_kg
                    )
                  )
                    ? `${Number(
                        demand.capacity_available_kg
                      ).toLocaleString(
                        "id-ID"
                      )} kg`
                    : partner.capacity_kg_per_week !==
                        null &&
                      Number.isFinite(
                        Number(
                          partner.capacity_kg_per_week
                        )
                      )
                    ? `${Number(
                        partner.capacity_kg_per_week
                      ).toLocaleString(
                        "id-ID"
                      )} kg/week`
                    : "Belum tersedia"
                }
              />
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-[24px] border border-[#dfe8d5] bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#78905f]">
            Recovery Pathway
          </p>

          <div className="mt-5 flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex w-full items-center gap-3 rounded-2xl bg-[#f7faf2] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9f4d5]">
                <Package className="h-5 w-5 text-[#557f35]" />
              </div>

              <div>
                <p className="text-xs text-[#879181]">
                  Dari
                </p>

                <p className="font-extrabold text-[#32442c]">
                  {surplus.material_name}
                </p>

                <p className="text-sm text-[#71806a]">
                  {safeNumber(
                    surplus.quantity
                  ).toLocaleString("id-ID")}{" "}
                  {surplus.unit || "unit"}
                </p>
              </div>
            </div>

            <ArrowRight className="hidden h-6 w-6 shrink-0 text-[#79915f] md:block" />

            <div className="flex w-full items-center gap-3 rounded-2xl bg-[#f7faf2] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9f4d5]">
                <Leaf className="h-5 w-5 text-[#557f35]" />
              </div>

              <div>
                <p className="text-xs text-[#879181]">
                  Menuju
                </p>

                <p className="font-extrabold text-[#32442c]">
                  {partner.organization_name}
                </p>

                <p className="text-sm text-[#71806a]">
                  {formatPathway(
                    demand.pathway
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 rounded-[20px] border border-[#dce7d0] bg-[#eef6e5] p-5">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#557f35]" />

            <div>
              <p className="text-sm font-extrabold text-[#41632d]">
                Setelah diajukan
              </p>

              <p className="mt-1 text-sm leading-6 text-[#60705b]">
                Pengajuan akan masuk ke Incoming
                recovery partner. Transaction belum
                dibuat pada tahap ini. Transaction
                baru dibuat setelah recovery partner
                menerima pengajuan melalui menu
                Incoming.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href={`/discover/${match.id}`}
            className="flex items-center justify-center rounded-xl border border-[#dce7d0] bg-white px-6 py-3 text-sm font-extrabold text-[#55714a] transition hover:bg-[#f0f6e7]"
          >
            Batal
          </Link>

          <button
            onClick={handleSubmit}
            disabled={submitting || !!success}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#587f35] px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#496b2c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengajukan Match...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Konfirmasi & Ajukan Match
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#edf1e9] pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-[#879181]">
        {label}
      </span>

      <span className="text-right text-sm font-bold text-[#32442c]">
        {value}
      </span>
    </div>
  );
}
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  MapPin,
  Package,
  Scale,
  Route,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPathway(pathway: string) {
  const labels: Record<string, string> = {
    animal_feed: "Pakan Ternak",
    compost: "Kompos",
    organic_fertilizer: "Pupuk Organik",
    food_processing: "Pengolahan Pangan",
    bioconversion: "Biokonversi",
    other: "Lainnya",
  };

  return labels[pathway] ?? pathway;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function DemandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: demand, error } = await supabase
    .from("material_demands")
    .select(
      `
        id,
        recovery_partner_id,
        material_name,
        pathway,
        quantity_needed,
        capacity_available_kg,
        min_condition,
        latitude,
        longitude,
        active,
        created_at
      `
    )
    .eq("id", id)
    .eq("recovery_partner_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Demand detail error:", error);
  }

  if (!demand) {
    notFound();
  }

  return (
    <AppShell role="recovery_partner">
      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8 lg:py-8">
        {/* HEADER */}
        <div className="mb-8">
          <Link
            href="/partner/demands"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--green-800)]"
          >
            <ArrowLeft size={17} />
            Kembali ke Permintaan Material
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    demand.active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {demand.active ? "Aktif" : "Tidak Aktif"}
                </span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-[var(--text)] md:text-3xl">
                {demand.material_name}
              </h1>

              <p className="mt-2 text-sm text-[var(--muted)]">
                Detail kebutuhan material recovery partner
              </p>
            </div>

            <Link
              href={`/partner/demands/${demand.id}/edit`}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-[var(--green-800)] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--green-900)]"
            >
              <Edit3 size={17} />
              Edit Demand
            </Link>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* LEFT */}
          <div className="space-y-6">
            {/* OVERVIEW */}
            <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--green-50)] text-[var(--green-800)]">
                  <Package size={20} />
                </div>

                <div>
                  <h2 className="font-black text-[var(--text)]">
                    Informasi Material
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Kebutuhan recovery partner
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-[var(--bg)] p-4">
                  <p className="mb-1 text-xs font-semibold text-[var(--muted)]">
                    Material
                  </p>
                  <p className="font-bold text-[var(--text)]">
                    {demand.material_name}
                  </p>
                </div>

                <div className="rounded-xl bg-[var(--bg)] p-4">
                  <p className="mb-1 text-xs font-semibold text-[var(--muted)]">
                    Jalur Pemulihan
                  </p>
                  <p className="font-bold text-[var(--text)]">
                    {formatPathway(demand.pathway)}
                  </p>
                </div>

                <div className="rounded-xl bg-[var(--bg)] p-4">
                  <p className="mb-1 text-xs font-semibold text-[var(--muted)]">
                    Kebutuhan Material
                  </p>
                  <p className="text-xl font-black text-[var(--green-800)]">
                    {formatNumber(demand.quantity_needed)} kg
                  </p>
                </div>

                <div className="rounded-xl bg-[var(--bg)] p-4">
                  <p className="mb-1 text-xs font-semibold text-[var(--muted)]">
                    Kapasitas Tersedia
                  </p>
                  <p className="text-xl font-black text-[var(--green-800)]">
                    {formatNumber(demand.capacity_available_kg)} kg
                  </p>
                </div>
              </div>
            </section>

            {/* CONDITION */}
            <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <CheckCircle2 size={20} />
                </div>

                <div>
                  <h2 className="font-black text-[var(--text)]">
                    Kondisi Minimum
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Persyaratan material yang dapat diterima
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">
                  {demand.min_condition || "Tidak ada kondisi minimum khusus."}
                </p>
              </div>
            </section>

            {/* LOCATION */}
            <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPin size={20} />
                </div>

                <div>
                  <h2 className="font-black text-[var(--text)]">
                    Lokasi Recovery
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Digunakan untuk proses matching dan collection
                  </p>
                </div>
              </div>

              {demand.latitude !== null && demand.longitude !== null ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-[var(--bg)] p-4">
                      <p className="mb-1 text-xs font-semibold text-[var(--muted)]">
                        Latitude
                      </p>
                      <p className="font-bold text-[var(--text)]">
                        {demand.latitude}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[var(--bg)] p-4">
                      <p className="mb-1 text-xs font-semibold text-[var(--muted)]">
                        Longitude
                      </p>
                      <p className="font-bold text-[var(--text)]">
                        {demand.longitude}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://www.openstreetmap.org/?mlat=${demand.latitude}&mlon=${demand.longitude}#map=16/${demand.latitude}/${demand.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-bold text-[var(--green-800)] transition hover:bg-[var(--bg)]"
                  >
                    <MapPin size={17} />
                    Lihat di OpenStreetMap
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--line)] p-6 text-center">
                  <MapPin
                    size={28}
                    className="mx-auto mb-2 text-[var(--muted)]"
                  />
                  <p className="text-sm font-semibold text-[var(--muted)]">
                    Lokasi belum ditentukan
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* STATUS */}
            <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
              <h2 className="mb-5 font-black text-[var(--text)]">
                Status Demand
              </h2>

              <div className="flex items-center gap-4 rounded-xl bg-[var(--bg)] p-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    demand.active
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {demand.active ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <Clock3 size={24} />
                  )}
                </div>

                <div>
                  <p className="font-black text-[var(--text)]">
                    {demand.active ? "Demand Aktif" : "Demand Tidak Aktif"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    {demand.active
                      ? "Demand ini dapat digunakan dalam proses matching dengan surplus."
                      : "Demand ini tidak akan digunakan untuk matching baru."}
                  </p>
                </div>
              </div>
            </section>

            {/* CAPACITY */}
            <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-[var(--green-800)]">
                  <Scale size={20} />
                </div>

                <div>
                  <h2 className="font-black text-[var(--text)]">
                    Kapasitas
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Informasi volume recovery
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--muted)]">
                      Kebutuhan
                    </span>
                    <span className="font-black text-[var(--text)]">
                      {formatNumber(demand.quantity_needed)} kg
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-full rounded-full bg-[var(--green-800)]" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--muted)]">
                      Kapasitas
                    </span>
                    <span className="font-black text-[var(--text)]">
                      {formatNumber(demand.capacity_available_kg)} kg
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width: `${Math.min(
                          100,
                          demand.quantity_needed > 0
                            ? ((demand.capacity_available_kg ?? 0) /
                                demand.quantity_needed) *
                                100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* CREATED */}
            <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
              <div className="mb-4 flex items-center gap-3">
                <Clock3 size={19} className="text-[var(--muted)]" />

                <h2 className="font-black text-[var(--text)]">
                  Informasi Demand
                </h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[var(--muted)]">Dibuat</span>
                  <span className="text-right font-semibold text-[var(--text)]">
                    {formatDate(demand.created_at)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-[var(--muted)]">ID Demand</span>
                  <span className="max-w-[180px] break-all text-right font-mono text-xs text-[var(--text)]">
                    {demand.id}
                  </span>
                </div>
              </div>
            </section>

            {/* NEXT STEP */}
            <section className="rounded-2xl bg-[var(--green-800)] p-5 text-white shadow-sm md:p-6">
              <div className="mb-3 flex items-center gap-3">
                <Route size={20} />
                <h2 className="font-black">Siap untuk Matching</h2>
              </div>

              <p className="text-sm leading-6 text-white/80">
                Demand ini nantinya akan digunakan ReFarm Loop untuk mencari
                surplus yang sesuai berdasarkan material, kondisi, jumlah,
                kapasitas, dan jarak lokasi.
              </p>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
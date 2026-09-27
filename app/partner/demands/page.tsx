import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import {
  Plus,
  Package,
  CheckCircle2,
  Scale,
  ArrowRight,
  MapPin,
} from "lucide-react";

function formatPathway(pathway: string) {
  const labels: Record<string, string> = {
    animal_feed: "Animal Feed",
    compost: "Compost",
    organic_fertilizer: "Organic Fertilizer",
    food_processing: "Food Processing",
    bioconversion: "Bioconversion",
    other: "Other",
  };

  return labels[pathway] || pathway;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 3,
  }).format(value);
}

export default async function DemandsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: demands, error } = await supabase
    .from("material_demands")
    .select(`
      id,
      material_name,
      pathway,
      quantity_needed,
      capacity_available_kg,
      min_condition,
      latitude,
      longitude,
      active,
      created_at
    `)
    .eq("recovery_partner_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  const demandList = demands || [];

  const activeDemands = demandList.filter(
    (demand) => demand.active === true
  );

  const totalDemandKg = demandList.reduce(
    (total, demand) =>
      total + Number(demand.quantity_needed || 0),
    0
  );

  return (
    <AppShell role="recovery_partner">
      <div className="px-5 py-8 md:px-8 md:py-10">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>
            <p className="text-sm font-semibold text-[var(--green-800)]">
              Recovery Partner
            </p>

            <h1 className="mt-1 text-4xl font-black tracking-tight">
              Permintaan Material
            </h1>

            <p className="mt-2 max-w-2xl text-base leading-6 text-[var(--muted)]">
              Kelola material yang ingin kamu terima
              untuk proses recovery melalui ReFarm Loop.
            </p>
          </div>

          <Link
            href="/partner/demands/new"
            className="btn-primary inline-flex shrink-0 items-center justify-center gap-2"
          >
            <Plus size={18} />
            Tambah Demand
          </Link>

        </div>

        {/* SUMMARY */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">

          {/* TOTAL */}
          <div className="card p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">
                  Total Demand
                </p>

                <p className="mt-2 text-3xl font-black">
                  {demandList.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--mint)] text-[var(--green-800)]">
                <Package size={21} />
              </div>

            </div>

          </div>

          {/* ACTIVE */}
          <div className="card p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">
                  Demand Aktif
                </p>

                <p className="mt-2 text-3xl font-black">
                  {activeDemands.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={21} />
              </div>

            </div>

          </div>

          {/* TOTAL QUANTITY */}
          <div className="card p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-semibold text-[var(--muted)]">
                  Total Kebutuhan
                </p>

                <p className="mt-2 text-3xl font-black">
                  {formatNumber(totalDemandKg)}
                </p>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  kg
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Scale size={21} />
              </div>

            </div>

          </div>

        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">

            <p className="font-bold text-red-700">
              Gagal memuat demand
            </p>

            <p className="mt-1 text-sm leading-6 text-red-600">
              {error.message}
            </p>

          </div>
        )}

        {/* EMPTY STATE */}
        {!error && demandList.length === 0 && (
          <div className="card p-10 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
              <Package size={28} />
            </div>

            <h2 className="mt-5 text-xl font-black">
              Belum ada demand
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
              Tambahkan kebutuhan material agar ReFarm Loop
              dapat mencocokkannya dengan surplus dari supplier.
            </p>

            <Link
              href="/partner/demands/new"
              className="btn-primary mt-6 inline-flex items-center gap-2"
            >
              <Plus size={17} />
              Tambah Demand
            </Link>

          </div>
        )}

        {/* DEMAND LIST */}
        {demandList.length > 0 && (
          <div className="space-y-4">

            {demandList.map((demand) => (
              <div
                key={demand.id}
                className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md md:p-6"
              >

                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                  {/* LEFT */}
                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-2">

                      <h2 className="text-lg font-black">
                        {demand.material_name}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          demand.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {demand.active
                          ? "Aktif"
                          : "Nonaktif"}
                      </span>

                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--muted)]">

                      <span>
                        Dibuat{" "}
                        {new Date(
                          demand.created_at
                        ).toLocaleDateString("id-ID")}
                      </span>

                      <span>
                        {formatPathway(demand.pathway)}
                      </span>

                    </div>

                  </div>

                  {/* QUANTITY */}
                  <div className="shrink-0 md:text-right">

                    <p className="text-xs font-semibold text-[var(--muted)]">
                      Kebutuhan
                    </p>

                    <p className="mt-1 text-2xl font-black">
                      {formatNumber(
                        Number(
                          demand.quantity_needed
                        )
                      )}{" "}
                      <span className="text-sm font-bold text-[var(--muted)]">
                        kg
                      </span>
                    </p>

                  </div>

                </div>

                {/* DETAILS */}
                <div className="mt-5 grid gap-3 border-t border-[var(--line)] pt-5 sm:grid-cols-3">

                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)]">
                      Recovery Pathway
                    </p>

                    <p className="mt-1 text-sm font-bold">
                      {formatPathway(demand.pathway)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)]">
                      Kapasitas Tersedia
                    </p>

                    <p className="mt-1 text-sm font-bold">
                      {demand.capacity_available_kg !== null
                        ? `${formatNumber(
                            Number(
                              demand.capacity_available_kg
                            )
                          )} kg`
                        : "Tidak ditentukan"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)]">
                      Kondisi Minimum
                    </p>

                    <p className="mt-1 text-sm font-bold">
                      {demand.min_condition ||
                        "Tidak ditentukan"}
                    </p>
                  </div>

                </div>

                {/* LOCATION + DETAIL */}
                <div className="mt-5 flex flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                    <MapPin size={15} />

                    {demand.latitude !== null &&
                    demand.longitude !== null
                      ? "Lokasi penerimaan tersedia"
                      : "Lokasi belum ditentukan"}
                  </div>

                  <Link
                    href={`/partner/demands/${demand.id}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[var(--green-800)] transition hover:text-[var(--green-900)]"
                  >
                    Lihat Detail
                    <ArrowRight size={16} />
                  </Link>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </AppShell>
  );
}
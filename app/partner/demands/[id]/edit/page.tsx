import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Package,
  MapPin,
  Scale,
  Power,
} from "lucide-react";

import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

const pathways = [
  {
    value: "animal_feed",
    label: "Pakan Ternak",
  },
  {
    value: "compost",
    label: "Kompos",
  },
  {
    value: "organic_fertilizer",
    label: "Pupuk Organik",
  },
  {
    value: "food_processing",
    label: "Pengolahan Pangan",
  },
  {
    value: "bioconversion",
    label: "Biokonversi",
  },
  {
    value: "other",
    label: "Lainnya",
  },
];

async function updateDemand(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const demandId = String(formData.get("demand_id") ?? "");
  const materialName = String(
    formData.get("material_name") ?? ""
  ).trim();

  const pathway = String(formData.get("pathway") ?? "");

  const quantityNeeded = Number(
    formData.get("quantity_needed") ?? 0
  );

  const capacityAvailable = Number(
    formData.get("capacity_available_kg") ?? 0
  );

  const minCondition = String(
    formData.get("min_condition") ?? ""
  ).trim();

  const latitudeRaw = String(
    formData.get("latitude") ?? ""
  ).trim();

  const longitudeRaw = String(
    formData.get("longitude") ?? ""
  ).trim();

  const active = formData.get("active") === "on";

  if (!demandId) {
    throw new Error("ID demand tidak ditemukan.");
  }

  if (!materialName) {
    throw new Error("Nama material wajib diisi.");
  }

  if (!pathways.some((item) => item.value === pathway)) {
    throw new Error("Jalur pemulihan tidak valid.");
  }

  if (!Number.isFinite(quantityNeeded) || quantityNeeded <= 0) {
    throw new Error("Jumlah kebutuhan material harus lebih dari 0.");
  }

  if (
    !Number.isFinite(capacityAvailable) ||
    capacityAvailable < 0
  ) {
    throw new Error("Kapasitas tidak valid.");
  }

  const latitude = latitudeRaw
    ? Number(latitudeRaw)
    : null;

  const longitude = longitudeRaw
    ? Number(longitudeRaw)
    : null;

  if (
    latitude !== null &&
    (!Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90)
  ) {
    throw new Error("Latitude tidak valid.");
  }

  if (
    longitude !== null &&
    (!Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180)
  ) {
    throw new Error("Longitude tidak valid.");
  }

  const { error } = await supabase
    .from("material_demands")
    .update({
      material_name: materialName,
      pathway,
      quantity_needed: quantityNeeded,
      capacity_available_kg: capacityAvailable,
      min_condition: minCondition || null,
      latitude,
      longitude,
      active,
    })
    .eq("id", demandId)
    .eq("recovery_partner_id", user.id);

  if (error) {
    console.error("Update demand error:", error);

    throw new Error(
      `Gagal memperbarui demand: ${error.message}`
    );
  }

  redirect(`/partner/demands/${demandId}`);
}

export default async function EditDemandPage({
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
    console.error("Edit demand fetch error:", error);
  }

  if (!demand) {
    notFound();
  }

  return (
    <AppShell role="recovery_partner">
      <div className="mx-auto max-w-5xl px-5 py-6 md:px-8 lg:py-8">
        {/* HEADER */}
        <div className="mb-8">
          <Link
            href={`/partner/demands/${demand.id}`}
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--green-800)]"
          >
            <ArrowLeft size={17} />
            Kembali ke Detail Demand
          </Link>

          <h1 className="text-2xl font-black tracking-tight text-[var(--text)] md:text-3xl">
            Edit Demand
          </h1>

          <p className="mt-2 text-sm text-[var(--muted)]">
            Perbarui kebutuhan material recovery partner.
          </p>
        </div>

        {/* FORM */}
        <form
          action={updateDemand}
          className="space-y-6"
        >
          <input
            type="hidden"
            name="demand_id"
            value={demand.id}
          />

          {/* MATERIAL */}
          <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--green-50)] text-[var(--green-800)]">
                <Package size={20} />
              </div>

              <div>
                <h2 className="font-black text-[var(--text)]">
                  Informasi Material
                </h2>

                <p className="text-xs text-[var(--muted)]">
                  Tentukan material yang dibutuhkan.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="material_name"
                  className="mb-2 block text-sm font-bold text-[var(--text)]"
                >
                  Nama Material
                </label>

                <input
                  id="material_name"
                  name="material_name"
                  type="text"
                  required
                  defaultValue={demand.material_name}
                  placeholder="Contoh: Tomat, Pisang, Sayuran"
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--green-800)] focus:ring-2 focus:ring-[var(--green-800)]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="pathway"
                  className="mb-2 block text-sm font-bold text-[var(--text)]"
                >
                  Jalur Pemulihan
                </label>

                <select
                  id="pathway"
                  name="pathway"
                  required
                  defaultValue={demand.pathway}
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--green-800)] focus:ring-2 focus:ring-[var(--green-800)]/10"
                >
                  {pathways.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* CAPACITY */}
          <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Scale size={20} />
              </div>

              <div>
                <h2 className="font-black text-[var(--text)]">
                  Kebutuhan & Kapasitas
                </h2>

                <p className="text-xs text-[var(--muted)]">
                  Tentukan volume material yang dibutuhkan.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="quantity_needed"
                  className="mb-2 block text-sm font-bold text-[var(--text)]"
                >
                  Kebutuhan Material
                </label>

                <div className="relative">
                  <input
                    id="quantity_needed"
                    name="quantity_needed"
                    type="number"
                    min="0.001"
                    step="0.001"
                    required
                    defaultValue={demand.quantity_needed}
                    className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 pr-14 text-sm outline-none transition focus:border-[var(--green-800)] focus:ring-2 focus:ring-[var(--green-800)]/10"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--muted)]">
                    kg
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="capacity_available_kg"
                  className="mb-2 block text-sm font-bold text-[var(--text)]"
                >
                  Kapasitas Tersedia
                </label>

                <div className="relative">
                  <input
                    id="capacity_available_kg"
                    name="capacity_available_kg"
                    type="number"
                    min="0"
                    step="0.001"
                    required
                    defaultValue={
                      demand.capacity_available_kg ?? 0
                    }
                    className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 pr-14 text-sm outline-none transition focus:border-[var(--green-800)] focus:ring-2 focus:ring-[var(--green-800)]/10"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--muted)]">
                    kg
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* CONDITION */}
          <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
            <h2 className="mb-2 font-black text-[var(--text)]">
              Kondisi Minimum
            </h2>

            <p className="mb-5 text-xs text-[var(--muted)]">
              Jelaskan kondisi material yang masih dapat diterima.
            </p>

            <textarea
              id="min_condition"
              name="min_condition"
              rows={5}
              defaultValue={demand.min_condition ?? ""}
              placeholder="Contoh: Tidak busuk berat, tidak tercampur bahan kimia, masih memiliki kadar air yang sesuai..."
              className="w-full resize-none rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--green-800)] focus:ring-2 focus:ring-[var(--green-800)]/10"
            />
          </section>

          {/* LOCATION */}
          <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <MapPin size={20} />
              </div>

              <div>
                <h2 className="font-black text-[var(--text)]">
                  Lokasi Recovery
                </h2>

                <p className="text-xs text-[var(--muted)]">
                  Koordinat digunakan untuk proses matching dan collection.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="latitude"
                  className="mb-2 block text-sm font-bold text-[var(--text)]"
                >
                  Latitude
                </label>

                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  defaultValue={demand.latitude ?? ""}
                  placeholder="-2.5489"
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--green-800)] focus:ring-2 focus:ring-[var(--green-800)]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="longitude"
                  className="mb-2 block text-sm font-bold text-[var(--text)]"
                >
                  Longitude
                </label>

                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  defaultValue={demand.longitude ?? ""}
                  placeholder="118.0149"
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--green-800)] focus:ring-2 focus:ring-[var(--green-800)]/10"
                />
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[var(--bg)] p-4">
              <p className="text-xs leading-5 text-[var(--muted)]">
                Untuk sementara koordinat dapat diperbarui secara manual.
                Pada tahap berikutnya lokasi ini dapat dihubungkan kembali
                dengan map picker OpenStreetMap yang sudah digunakan pada
                form pembuatan demand.
              </p>
            </div>
          </section>

          {/* STATUS */}
          <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Power size={20} />
              </div>

              <div className="flex-1">
                <h2 className="font-black text-[var(--text)]">
                  Status Demand
                </h2>

                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Demand aktif dapat digunakan oleh sistem dalam proses
                  matching surplus.
                </p>

                <label className="mt-4 flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={demand.active}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--green-800)] focus:ring-[var(--green-800)]"
                  />

                  <span className="text-sm font-bold text-[var(--text)]">
                    Demand aktif
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* ACTION */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/partner/demands/${demand.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-white px-5 py-3 text-sm font-bold text-[var(--text)] transition hover:bg-[var(--bg)]"
            >
              Batal
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--green-800)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--green-900)]"
            >
              <Save size={17} />
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
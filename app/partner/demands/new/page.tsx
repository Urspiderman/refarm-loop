import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import DemandLocationPickerWrapper from "@/components/partner/demand-location-picker-wrapper";
import {
  ArrowLeft,
  Save,
  Leaf,
} from "lucide-react";

/* =========================================================
   SERVER ACTION
========================================================= */

async function createDemand(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /* =======================================================
     FORM VALUES
  ======================================================= */

  const materialName = String(
    formData.get("material_name") ?? ""
  ).trim();

  const pathway = String(
    formData.get("pathway") ?? ""
  ).trim();

  const quantityNeeded = Number(
    formData.get("quantity_needed")
  );

  const capacityValue = String(
    formData.get("capacity_available_kg") ?? ""
  ).trim();

  const capacityAvailable =
    capacityValue === ""
      ? null
      : Number(capacityValue);

  const minCondition = String(
    formData.get("min_condition") ?? ""
  ).trim();

  const latitudeValue = String(
    formData.get("latitude") ?? ""
  ).trim();

  const longitudeValue = String(
    formData.get("longitude") ?? ""
  ).trim();

  const latitude =
    latitudeValue === ""
      ? null
      : Number(latitudeValue);

  const longitude =
    longitudeValue === ""
      ? null
      : Number(longitudeValue);

  /* =======================================================
     ALLOWED PATHWAYS
  ======================================================= */

  const allowedPathways = [
    "animal_feed",
    "compost",
    "organic_fertilizer",
    "food_processing",
    "bioconversion",
    "other",
  ];

  /* =======================================================
     VALIDATION
  ======================================================= */

  if (!materialName) {
    throw new Error(
      "Nama material wajib diisi."
    );
  }

  if (!allowedPathways.includes(pathway)) {
    throw new Error(
      "Recovery pathway tidak valid."
    );
  }

  if (
    !Number.isFinite(quantityNeeded) ||
    quantityNeeded <= 0
  ) {
    throw new Error(
      "Jumlah kebutuhan harus lebih besar dari 0."
    );
  }

  if (
    capacityAvailable !== null &&
    (
      !Number.isFinite(capacityAvailable) ||
      capacityAvailable < 0
    )
  ) {
    throw new Error(
      "Kapasitas tersedia tidak valid."
    );
  }

  /* =======================================================
     LOCATION VALIDATION
  ======================================================= */

  if (
    latitude === null ||
    longitude === null
  ) {
    throw new Error(
      "Lokasi penerimaan material wajib dipilih."
    );
  }

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error(
      "Latitude tidak valid."
    );
  }

  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      "Longitude tidak valid."
    );
  }

  /* =======================================================
     CHECK RECOVERY PARTNER PROFILE
  ======================================================= */

  const { data: partnerProfile, error: partnerError } =
    await supabase
      .from("recovery_partner_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

  if (partnerError) {
    throw new Error(
      `Gagal memeriksa profil recovery partner: ${partnerError.message}`
    );
  }

  if (!partnerProfile) {
    throw new Error(
      "Akun ini belum memiliki profil Recovery Partner. Silakan lengkapi profil Recovery Partner terlebih dahulu."
    );
  }

  /* =======================================================
     INSERT TO SUPABASE
  ======================================================= */

  const { error } = await supabase
    .from("material_demands")
    .insert({
      recovery_partner_id: user.id,
      material_name: materialName,
      pathway,
      quantity_needed: quantityNeeded,
      capacity_available_kg: capacityAvailable,
      min_condition: minCondition || null,
      latitude,
      longitude,
      active: true,
    });

  if (error) {
    throw new Error(
      `Gagal menyimpan demand: ${error.message}`
    );
  }

  /* =======================================================
     REDIRECT
  ======================================================= */

  redirect("/partner/demands");
}

/* =========================================================
   PAGE
========================================================= */

export default async function NewDemandPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell role="recovery_partner">

      <div className="px-5 py-8 md:px-8 md:py-10">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">

          <Link
            href="/partner/demands"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--green-800)]"
          >
            <ArrowLeft size={16} />
            Kembali ke Demand
          </Link>

          <p className="text-sm text-[var(--muted)]">
            Recovery Partner
          </p>

          <h1 className="mt-1 text-4xl font-black tracking-tight">
            Tambah Demand
          </h1>

          <p className="mt-2 max-w-2xl text-base text-[var(--muted)]">
            Tambahkan kebutuhan material yang ingin
            kamu terima untuk proses recovery.
          </p>

        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <div className="max-w-4xl">

          <form
            action={createDemand}
            className="card p-6 md:p-8"
          >

            {/* =================================================
                INTRO CARD
            ================================================= */}

            <div className="mb-7 flex items-start gap-4 rounded-2xl bg-[var(--mint)] p-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--green-800)]">
                <Leaf size={19} />
              </div>

              <div>

                <p className="font-bold text-[var(--green-900)]">
                  Buat kebutuhan material
                </p>

                <p className="mt-1 text-sm text-[var(--green-900)]">
                  Demand ini akan digunakan ReFarm Loop
                  untuk mencocokkan surplus yang sesuai.
                </p>

              </div>

            </div>

            {/* =================================================
                MATERIAL NAME
            ================================================= */}

            <div>

              <label
                htmlFor="material_name"
                className="mb-2 block text-sm font-bold"
              >
                Nama Material
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="material_name"
                name="material_name"
                type="text"
                required
                placeholder="Contoh: Tomat, Pisang, Sayuran organik"
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--green-800)] focus:ring-2 focus:ring-[var(--mint)]"
              />

              <p className="mt-2 text-xs text-[var(--muted)]">
                Masukkan material yang dibutuhkan.
              </p>

            </div>

            {/* =================================================
                PATHWAY
            ================================================= */}

            <div className="mt-6">

              <label
                htmlFor="pathway"
                className="mb-2 block text-sm font-bold"
              >
                Recovery Pathway
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                id="pathway"
                name="pathway"
                required
                defaultValue=""
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--green-800)] focus:ring-2 focus:ring-[var(--mint)]"
              >

                <option
                  value=""
                  disabled
                >
                  Pilih pathway recovery
                </option>

                <option value="animal_feed">
                  Animal Feed
                </option>

                <option value="compost">
                  Compost
                </option>

                <option value="organic_fertilizer">
                  Organic Fertilizer
                </option>

                <option value="food_processing">
                  Food Processing
                </option>

                <option value="bioconversion">
                  Bioconversion
                </option>

                <option value="other">
                  Other
                </option>

              </select>

              <p className="mt-2 text-xs text-[var(--muted)]">
                Tentukan bagaimana material akan
                dimanfaatkan kembali.
              </p>

            </div>

            {/* =================================================
                QUANTITY + CAPACITY
            ================================================= */}

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              {/* QUANTITY */}

              <div>

                <label
                  htmlFor="quantity_needed"
                  className="mb-2 block text-sm font-bold"
                >
                  Jumlah Kebutuhan
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">

                  <input
                    id="quantity_needed"
                    name="quantity_needed"
                    type="number"
                    min="0.001"
                    step="0.001"
                    required
                    placeholder="500"
                    className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 pr-14 text-sm outline-none transition focus:border-[var(--green-800)] focus:ring-2 focus:ring-[var(--mint)]"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--muted)]">
                    kg
                  </span>

                </div>

                <p className="mt-2 text-xs text-[var(--muted)]">
                  Total material yang dibutuhkan.
                </p>

              </div>

              {/* CAPACITY */}

              <div>

                <label
                  htmlFor="capacity_available_kg"
                  className="mb-2 block text-sm font-bold"
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
                    placeholder="1000"
                    className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 pr-14 text-sm outline-none transition focus:border-[var(--green-800)] focus:ring-2 focus:ring-[var(--mint)]"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--muted)]">
                    kg
                  </span>

                </div>

                <p className="mt-2 text-xs text-[var(--muted)]">
                  Kapasitas material yang masih dapat
                  diterima.
                </p>

              </div>

            </div>

            {/* =================================================
                MIN CONDITION
            ================================================= */}

            <div className="mt-6">

              <label
                htmlFor="min_condition"
                className="mb-2 block text-sm font-bold"
              >
                Kondisi Minimum Material
              </label>

              <input
                id="min_condition"
                name="min_condition"
                type="text"
                placeholder="Contoh: Tidak tercampur plastik, tidak berjamur"
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--green-800)] focus:ring-2 focus:ring-[var(--mint)]"
              />

              <p className="mt-2 text-xs text-[var(--muted)]">
                Syarat minimum material yang dapat diterima.
              </p>

            </div>

            {/* =================================================
                LOCATION
            ================================================= */}

            <div className="mt-8 border-t border-[var(--line)] pt-7">

              <div className="mb-5">

                <p className="text-sm font-semibold text-[var(--green-800)]">
                  Recovery Location
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Lokasi Penerimaan Material
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  Tentukan lokasi tempat material akan
                  diterima. Lokasi ini akan digunakan untuk
                  proses matching berdasarkan jarak dan
                  perencanaan collection.
                </p>

              </div>

              <DemandLocationPickerWrapper />

            </div>

            {/* =================================================
                ACTION
            ================================================= */}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-6 sm:flex-row sm:justify-end">

              <Link
                href="/partner/demands"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] px-5 py-3 text-sm font-bold transition hover:bg-[var(--bg)]"
              >
                Batal
              </Link>

              <button
                type="submit"
                className="btn-primary justify-center"
              >
                <Save size={17} />
                Simpan Demand
              </button>

            </div>

          </form>

        </div>

      </div>

    </AppShell>
  );
}
"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPin,
  Package,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2 | 3 | 4;

type AssessmentResult = {
  material_type?: string;
  condition?: string;
  recovery_potential?: number;
  recommended_pathways?: string[];
  explanation?: string;
  confidence?: number;
};

const PATHWAY_LABELS: Record<string, string> = {
  animal_feed: "Pakan ternak",
  compost: "Kompos",
  organic_fertilizer: "Pupuk organik",
  food_processing: "Pengolahan pangan",
  bioconversion: "Biokonversi",
  other: "Lainnya",
};

export default function SurplusForm() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>(1);

  // =========================
  // FORM DATA
  // =========================
  const [materialName, setMaterialName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  const [availableDate, setAvailableDate] = useState("");
  const [notes, setNotes] = useState("");

  // =========================
  // GPS
  // =========================
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  // =========================
  // PHOTO
  // =========================
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  // =========================
  // PROCESS
  // =========================
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // =========================
  // CREATED SURPLUS
  // =========================
  const [surplusId, setSurplusId] = useState<string | null>(null);

  // =========================
  // GEMINI ASSESSMENT
  // =========================
  const [assessment, setAssessment] =
    useState<AssessmentResult | null>(null);

  const [assessmentLoading, setAssessmentLoading] =
    useState(false);

  // =========================
  // PHOTO HANDLER
  // =========================
  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        "File yang dipilih harus berupa gambar."
      );
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setErrorMessage("Ukuran foto maksimal 10 MB.");
      return;
    }

    setErrorMessage("");
    setPhotoFile(file);

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  }

  function removePhoto() {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(null);
    setPhotoPreview("");
  }

  // =========================
  // GPS
  // =========================
  async function getCurrentLocation() {
    if (!navigator.geolocation) {
      setGpsError(
        "Browser Anda tidak mendukung GPS."
      );
      return;
    }

    setGpsLoading(true);
    setGpsError("");
    setErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);

        try {
          const response = await fetch(
            `/api/geocode?lat=${lat}&lng=${lng}`
          );

          if (!response.ok) {
            throw new Error(
              "Gagal mendapatkan alamat dari koordinat GPS."
            );
          }

          const data = await response.json();

          setLocation(
            data.address ||
              `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          );
        } catch (error) {
          console.error(
            "Reverse geocoding error:",
            error
          );

          // Koordinat tetap disimpan walaupun alamat gagal
          setLocation(
            `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          );
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        console.error("GPS error:", error);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError(
              "Izin lokasi ditolak. Silakan izinkan akses lokasi di browser."
            );
            break;

          case error.POSITION_UNAVAILABLE:
            setGpsError(
              "Lokasi GPS tidak tersedia. Pastikan GPS atau Location Services aktif."
            );
            break;

          case error.TIMEOUT:
            setGpsError(
              "Pengambilan lokasi terlalu lama. Silakan coba lagi."
            );
            break;

          default:
            setGpsError(
              "Gagal mendapatkan lokasi perangkat."
            );
        }

        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  // =========================
  // VALIDATION
  // =========================
  function validateStepOne() {
    if (!materialName.trim()) {
      setErrorMessage("Nama material wajib diisi.");
      return false;
    }

    if (!quantity || Number(quantity) <= 0) {
      setErrorMessage(
        "Jumlah material harus lebih dari 0."
      );
      return false;
    }

    if (!unit.trim()) {
      setErrorMessage("Satuan wajib dipilih.");
      return false;
    }

    if (!location.trim()) {
      setErrorMessage("Lokasi wajib diisi.");
      return false;
    }

    return true;
  }

  function goToStepTwo() {
    setErrorMessage("");

    if (!validateStepOne()) return;

    setStep(2);
  }

  // =========================
  // SUBMIT SURPLUS
  // =========================
  async function submitSurplus(event?: FormEvent) {
    event?.preventDefault();

    setErrorMessage("");

    if (!validateStepOne()) {
      setStep(1);
      return;
    }

    setLoading(true);

    try {
      // Pastikan user login
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        router.push("/login");
        return;
      }

      // =========================
      // INSERT SURPLUS + GPS
      // =========================
      const { data: surplus, error: surplusError } =
        await supabase
          .from("surplus_listings")
          .insert({
            supplier_id: user.id,
            material_name: materialName.trim(),
            quantity: Number(quantity),
            unit: unit.trim(),
            condition: condition.trim() || null,
            category: category.trim() || null,

            // Lokasi yang dapat dibaca pengguna
            location_text: location.trim() || null,

            // Koordinat GPS
            latitude,
            longitude,

            available_date:
              availableDate || null,

            notes: notes.trim() || null,

            status: "listed",
          })
          .select("*")
          .single();

      if (surplusError || !surplus) {
        console.error(
          "Surplus insert error:",
          {
            message: surplusError?.message,
            details: surplusError?.details,
            hint: surplusError?.hint,
            code: surplusError?.code,
          }
        );

        throw new Error(
          surplusError?.message ||
            "Gagal menyimpan surplus."
        );
      }

      setSurplusId(surplus.id);

      // =========================
      // UPLOAD FOTO
      // =========================
      if (photoFile) {
        const extension =
          photoFile.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        const filePath = `${user.id}/surplus/${surplus.id}.${extension}`;

        const { error: uploadError } =
          await supabase.storage
            .from("refarm-media")
            .upload(filePath, photoFile, {
              upsert: true,
              contentType: photoFile.type,
            });

        if (uploadError) {
          console.error(
            "Photo upload error:",
            {
              message: uploadError.message,
              details: uploadError,
              filePath,
            }
          );

          setErrorMessage(
            "Surplus berhasil disimpan, tetapi foto gagal diupload. Anda tetap bisa melanjutkan."
          );
        } else {
          const {
            error: photoUpdateError,
          } = await supabase
            .from("surplus_listings")
            .update({
              photo_path: filePath,
            })
            .eq("id", surplus.id);

          if (photoUpdateError) {
            console.error(
              "Photo path update error:",
              {
                message:
                  photoUpdateError.message,
                details:
                  photoUpdateError.details,
                hint: photoUpdateError.hint,
                code: photoUpdateError.code,
              }
            );
          }
        }
      }

      setStep(3);
    } catch (error) {
      console.error(
        "Submit surplus failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan surplus."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // AI ASSESSMENT
  // =========================
  async function runAssessment() {
    if (!surplusId) {
      setErrorMessage(
        "ID surplus tidak ditemukan."
      );
      return;
    }

    if (!photoFile) {
      setErrorMessage(
        "Tambahkan foto material terlebih dahulu agar ReFarm AI dapat melakukan assessment."
      );
      return;
    }

    setErrorMessage("");
    setAssessmentLoading(true);

    try {
      const formData = new FormData();

      formData.append("file", photoFile);
      formData.append("surplus_id", surplusId);

      const response = await fetch(
        "/api/ai/assess",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "ReFarm AI gagal melakukan assessment."
        );
      }

      setAssessment(
        result.assessment || result
      );

      setStep(4);
    } catch (error) {
      console.error(
        "AI assessment error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Assessment AI gagal dilakukan."
      );
    } finally {
      setAssessmentLoading(false);
    }
  }

  // =========================
  // NAVIGATION
  // =========================
  function skipAssessment() {
    router.push("/surplus");
  }

  function goToDiscover() {
    router.push("/discover");
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { number: 1, label: "Detail" },
            { number: 2, label: "Foto" },
            {
              number: 3,
              label: "AI Assessment",
            },
            {
              number: 4,
              label: "Selesai",
            },
          ].map((item, index) => {
            const active =
              step >= item.number;

            return (
              <div
                key={item.number}
                className="flex flex-1 items-center"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
                      active
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step > item.number ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      item.number
                    )}
                  </div>

                  <span
                    className={`mt-2 text-xs font-medium ${
                      active
                        ? "text-emerald-700"
                        : "text-gray-400"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {index < 3 && (
                  <div
                    className={`mx-2 mt-[-18px] h-0.5 flex-1 ${
                      step > item.number
                        ? "bg-emerald-600"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex-1">
            {errorMessage}
          </div>

          <button
            type="button"
            onClick={() =>
              setErrorMessage("")
            }
            className="shrink-0 rounded-lg p-1 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* =========================
          STEP 1
      ========================= */}
      {step === 1 && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            goToStepTwo();
          }}
          className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm md:p-8"
        >
          <div className="mb-7">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Package className="h-6 w-6" />
            </div>

            <h2 className="text-2xl font-black text-gray-900">
              Detail surplus
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Masukkan informasi material surplus
              yang ingin Anda salurkan.
            </p>
          </div>

          <div className="space-y-5">
            {/* Material */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Nama material *
              </label>

              <input
                type="text"
                value={materialName}
                onChange={(event) =>
                  setMaterialName(
                    event.target.value
                  )
                }
                placeholder="Contoh: Sawi layu"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Kategori
              </label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              >
                <option value="">
                  Pilih kategori
                </option>

                <option value="vegetable">
                  Sayuran
                </option>

                <option value="fruit">
                  Buah
                </option>

                <option value="grain">
                  Biji-bijian
                </option>

                <option value="crop_residue">
                  Limbah tanaman
                </option>

                <option value="organic">
                  Organik lainnya
                </option>

                <option value="other">
                  Lainnya
                </option>
              </select>
            </div>

            {/* Quantity + Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Jumlah *
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value
                    )
                  }
                  placeholder="300"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Satuan *
                </label>

                <select
                  value={unit}
                  onChange={(event) =>
                    setUnit(
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                >
                  <option value="kg">
                    Kilogram (kg)
                  </option>

                  <option value="ton">
                    Ton
                  </option>

                  <option value="gram">
                    Gram
                  </option>

                  <option value="liter">
                    Liter
                  </option>

                  <option value="unit">
                    Unit
                  </option>
                </select>
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Kondisi material
              </label>

              <textarea
                value={condition}
                onChange={(event) =>
                  setCondition(
                    event.target.value
                  )
                }
                placeholder="Contoh: Layu, masih bersih, tidak berjamur"
                rows={3}
                className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              />
            </div>

            {/* Location + GPS */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Lokasi surplus *
              </label>

              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={location}
                  onChange={(event) =>
                    setLocation(
                      event.target.value
                    )
                  }
                  placeholder="Contoh: Pasar Inpres, Lubuklinggau"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                />
              </div>

              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gpsLoading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {gpsLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mendapatkan lokasi...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    Gunakan lokasi saya
                  </>
                )}
              </button>

              {latitude !== null &&
                longitude !== null && (
                  <div className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    <p className="font-semibold">
                      Lokasi GPS berhasil ditemukan
                    </p>

                    <p className="mt-1">
                      Latitude:{" "}
                      {latitude.toFixed(6)}
                    </p>

                    <p>
                      Longitude:{" "}
                      {longitude.toFixed(6)}
                    </p>
                  </div>
                )}

              {gpsError && (
                <p className="mt-2 text-xs text-red-600">
                  {gpsError}
                </p>
              )}
            </div>

            {/* Available date */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Tanggal tersedia
              </label>

              <input
                type="date"
                value={availableDate}
                onChange={(event) =>
                  setAvailableDate(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Catatan
              </label>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="Tambahkan informasi lain mengenai surplus..."
                rows={3}
                className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Lanjut
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* =========================
          STEP 2
      ========================= */}
      {step === 2 && (
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-7">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ImagePlus className="h-6 w-6" />
            </div>

            <h2 className="text-2xl font-black text-gray-900">
              Tambahkan foto
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Foto akan digunakan ReFarm AI untuk
              melakukan assessment awal terhadap
              material.
            </p>
          </div>

          {!photoPreview ? (
            <label className="group flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 px-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                <Upload className="h-6 w-6" />
              </div>

              <p className="font-bold text-gray-800">
                Upload foto material
              </p>

              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG, WEBP · Maksimal 10 MB
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative overflow-hidden rounded-3xl border border-gray-200">
              <img
                src={photoPreview}
                alt="Preview surplus"
                className="max-h-[420px] w-full object-cover"
              />

              <button
                type="button"
                onClick={removePhoto}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-5 pt-12 text-white">
                <p className="text-sm font-semibold">
                  {photoFile?.name}
                </p>

                {photoFile && (
                  <p className="mt-1 text-xs opacity-80">
                    {(
                      photoFile.size /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-7 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>

            <button
              type="button"
              onClick={() => submitSurplus()}
              disabled={loading}
              className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4" />
                  Simpan Surplus
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* =========================
          STEP 3
      ========================= */}
      {step === 3 && (
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
              <Sparkles className="h-8 w-8" />
            </div>

            <h2 className="text-2xl font-black text-gray-900">
              Surplus berhasil disimpan
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
              Data surplus sudah tercatat.
              Sekarang ReFarm AI dapat membantu
              melakukan assessment awal berdasarkan
              foto material.
            </p>
          </div>

          <div className="mt-7 rounded-2xl bg-gray-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Material
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {materialName}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-medium text-gray-500">
                  Jumlah
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {quantity} {unit}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={runAssessment}
            disabled={
              assessmentLoading || !photoFile
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {assessmentLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                ReFarm AI sedang menganalisis...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analisis dengan ReFarm AI
              </>
            )}
          </button>

          {!photoFile && (
            <p className="mt-3 text-center text-xs text-amber-600">
              Tidak ada foto. Assessment AI
              membutuhkan foto material.
            </p>
          )}

          <button
            type="button"
            onClick={skipAssessment}
            disabled={assessmentLoading}
            className="mt-3 w-full rounded-2xl px-5 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
          >
            Lewati dan lihat surplus
          </button>
        </div>
      )}

      {/* =========================
          STEP 4
      ========================= */}
      {step === 4 && (
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
              <Sparkles className="h-8 w-8" />
            </div>

            <h2 className="text-2xl font-black text-gray-900">
              Assessment AI selesai
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Berikut assessment awal dari ReFarm AI.
            </p>
          </div>

          {assessment && (
            <div className="mt-7 space-y-4">
              {/* Material */}
              {assessment.material_type && (
                <div className="rounded-2xl bg-gray-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Material teridentifikasi
                  </p>

                  <p className="mt-1 text-lg font-black text-gray-900">
                    {assessment.material_type}
                  </p>
                </div>
              )}

              {/* Condition */}
              {assessment.condition && (
                <div className="rounded-2xl border border-gray-100 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Kondisi
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    {assessment.condition}
                  </p>
                </div>
              )}

              {/* Recovery Potential */}
              {typeof assessment.recovery_potential ===
                "number" && (
                <div className="rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-800">
                      Potensi Recovery
                    </p>

                    <p className="font-black text-emerald-700">
                      {Math.round(
                        assessment.recovery_potential
                      )}
                      %
                    </p>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            assessment.recovery_potential
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Pathways */}
              {assessment.recommended_pathways &&
                assessment.recommended_pathways
                  .length > 0 && (
                  <div className="rounded-2xl border border-gray-100 p-5">
                    <p className="text-sm font-bold text-gray-800">
                      Rekomendasi Recovery
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {assessment.recommended_pathways.map(
                        (pathway) => (
                          <span
                            key={pathway}
                            className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                          >
                            {PATHWAY_LABELS[
                              pathway
                            ] || pathway}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Explanation */}
              {assessment.explanation && (
                <div className="rounded-2xl border border-gray-100 p-5">
                  <p className="text-sm font-bold text-gray-800">
                    Penjelasan AI
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {assessment.explanation}
                  </p>
                </div>
              )}

              {/* Confidence */}
              {typeof assessment.confidence ===
                "number" && (
                <p className="text-center text-xs text-gray-400">
                  Tingkat keyakinan AI:{" "}
                  {Math.round(
                    assessment.confidence * 100
                  )}
                  %
                </p>
              )}

              {/* Disclaimer */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                Assessment ini merupakan rekomendasi
                awal dari AI, bukan sertifikasi keamanan
                atau kelayakan material. Keputusan akhir
                tetap perlu divalidasi oleh recovery
                partner dan standar yang berlaku.
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={goToDiscover}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Cari Recovery Partner
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/surplus")
            }
            className="mt-3 w-full rounded-2xl px-5 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
          >
            Lihat Surplus Saya
          </button>
        </div>
      )}
    </div>
  );
}
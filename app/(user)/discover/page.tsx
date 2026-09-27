"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  Leaf,
  CheckCircle2,
  Package,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";

import RecoveryMap from "@/components/recovery-map-wrapper";

type DiscoverPartner = {
  id: string;
  name: string;
  type: string;
  location: string;
  capacity: number;
  lat: number;
  lng: number;
  verified: boolean;
  description: string;

  score: number;
  matchId: string | null;
  demandId: string | null;

  materialName: string;
  pathway: string;
  quantityNeeded: number;
  capacityAvailable: number | null;

  compatibilityScore: number | null;
  quantityScore: number | null;
  distanceScore: number | null;
  capacityScore: number | null;
};

const filters = [
  "Semua",
  "Compost",
  "Animal Feed",
  "Organic Fertilizer",
  "Food Processing",
  "Bioconversion",
];

export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [partners, setPartners] = useState<DiscoverPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD DISCOVER
  // =========================================================
  async function loadDiscover() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/discover", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const contentType =
        response.headers.get("content-type") || "";

      const rawText = await response.text();

      console.log(
        "DISCOVER STATUS:",
        response.status
      );

      console.log(
        "DISCOVER CONTENT-TYPE:",
        contentType
      );

      console.log(
        "DISCOVER RESPONSE:",
        rawText
      );

      if (!response.ok) {
        throw new Error(
          `API /api/discover gagal (${response.status}). ${rawText.slice(
            0,
            300
          )}`
        );
      }

      if (!contentType.includes("application/json")) {
        throw new Error(
          "API /api/discover tidak mengembalikan JSON. Kemungkinan route API tidak ditemukan atau terjadi error server."
        );
      }

      let data: any;

      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          "Response /api/discover bukan JSON yang valid."
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.detail ||
            data?.error ||
            "Gagal mengambil data Discover."
        );
      }

      const rawPartners = Array.isArray(
        data?.partners
      )
        ? data.partners
        : [];

      // =========================================================
      // NORMALIZE DATA
      // =========================================================
      const normalizedPartners: DiscoverPartner[] =
        rawPartners.map((partner: any) => ({
          id: String(partner?.id ?? ""),

          name: String(
            partner?.name ??
              partner?.organization_name ??
              "Recovery Partner"
          ),

          type: String(
            partner?.type ??
              partner?.pathway ??
              "Recovery"
          ),

          location: String(
            partner?.location ??
              partner?.location_text ??
              "Lokasi belum tersedia"
          ),

          capacity: toNumber(
            partner?.capacity ??
              partner?.capacityKgPerWeek
          ),

          lat: toNumber(
            partner?.lat ??
              partner?.latitude
          ),

          lng: toNumber(
            partner?.lng ??
              partner?.longitude
          ),

          verified: Boolean(partner?.verified),

          description: String(
            partner?.description ??
              "Recovery partner ReFarm Loop."
          ),

          score: toNumber(partner?.score),

          matchId:
            partner?.matchId != null &&
            partner?.matchId !== ""
              ? String(partner.matchId)
              : null,

          demandId:
            partner?.demandId != null &&
            partner?.demandId !== ""
              ? String(partner.demandId)
              : null,

          materialName: String(
            partner?.materialName ??
              partner?.material ??
              ""
          ),

          pathway: String(
            partner?.pathway ?? ""
          ),

          quantityNeeded: toNumber(
            partner?.quantityNeeded
          ),

          capacityAvailable:
            partner?.capacityAvailable != null
              ? toNumber(
                  partner.capacityAvailable
                )
              : null,

          compatibilityScore:
            toNullableNumber(
              partner?.compatibilityScore
            ),

          quantityScore:
            toNullableNumber(
              partner?.quantityScore
            ),

          distanceScore:
            toNullableNumber(
              partner?.distanceScore
            ),

          capacityScore:
            toNullableNumber(
              partner?.capacityScore
            ),
        }));

      // =========================================================
      // REMOVE DUPLICATES
      // =========================================================
      const uniquePartners =
        normalizedPartners.filter(
          (partner, index, array) => {
            const firstIndex =
              array.findIndex(
                (item) =>
                  item.id === partner.id &&
                  item.matchId ===
                    partner.matchId &&
                  item.demandId ===
                    partner.demandId
              );

            return index === firstIndex;
          }
        );

      console.log(
        "Discover berhasil:",
        uniquePartners.length,
        "partner"
      );

      setPartners(uniquePartners);
    } catch (err) {
      console.error(
        "Discover error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data Discover."
      );

      setPartners([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================
  useEffect(() => {
    loadDiscover();
  }, []);

  // =========================================================
  // FILTER
  // =========================================================
  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const matchesFilter =
        activeFilter === "Semua" ||
        partner.type === activeFilter;

      const keyword =
        search.toLowerCase().trim();

      if (!keyword) {
        return matchesFilter;
      }

      const matchesSearch =
        partner.name
          .toLowerCase()
          .includes(keyword) ||
        partner.location
          .toLowerCase()
          .includes(keyword) ||
        partner.type
          .toLowerCase()
          .includes(keyword) ||
        partner.materialName
          .toLowerCase()
          .includes(keyword);

      return (
        matchesFilter &&
        matchesSearch
      );
    });
  }, [
    partners,
    search,
    activeFilter,
  ]);

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <main className="min-h-screen bg-[#f7faf2] px-8 py-8">
      {/* HEADER */}
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#587f35]">
            <Sparkles className="h-4 w-4" />
            ReFarm Matching
          </div>

          <h1 className="text-[42px] font-extrabold tracking-tight text-[#101b0d]">
            Discover
          </h1>

          <p className="mt-1 text-[16px] text-[#60705b]">
            Temukan partner recovery yang sesuai
            dengan surplus Anda.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDiscover}
          disabled={loading}
          className="flex w-fit items-center gap-2 rounded-full border border-[#dce7d0] bg-white px-4 py-2.5 text-sm font-bold text-[#507531] shadow-sm transition hover:bg-[#f0f6e7] disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading
                ? "animate-spin"
                : ""
            }`}
          />

          {loading
            ? "Memuat..."
            : "Refresh Matching"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-5 rounded-[18px] border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700">
            Gagal memuat Discover
          </p>

          <p className="mt-1 whitespace-pre-wrap text-sm text-red-600">
            {error}
          </p>
        </div>
      )}

      {/* SEARCH */}
      <div className="mb-5 flex items-center rounded-full border border-[#dce7d0] bg-white px-5 py-3 shadow-sm">
        <Search className="mr-3 h-5 w-5 text-[#71806a]" />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Cari partner, material, lokasi, atau jenis recovery..."
          className="w-full bg-transparent text-[16px] text-[#263321] outline-none placeholder:text-[#9aa59a]"
        />
      </div>

      {/* FILTER */}
      <div className="mb-8 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() =>
              setActiveFilter(filter)
            }
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeFilter === filter
                ? "bg-[#587f35] text-white"
                : "bg-[#e7f2d2] text-[#41632d] hover:bg-[#dcebc2]"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* PARTNERS */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[23px] font-extrabold text-[#182415]">
                Recommended Partners
              </h2>

              <p className="mt-1 text-xs text-[#71806a]">
                Partner recovery yang tersedia
                dan relevan untuk surplus Anda.
              </p>
            </div>

            <span className="text-sm text-[#71806a]">
              {filteredPartners.length} partner
            </span>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-[22px] border border-[#dfe8d5] bg-white p-5"
                  >
                    <div className="mb-4 h-12 w-12 rounded-2xl bg-[#e9f4d5]" />

                    <div className="h-5 w-2/3 rounded bg-[#edf1e9]" />

                    <div className="mt-3 h-4 w-1/2 rounded bg-[#edf1e9]" />

                    <div className="mt-4 h-10 rounded bg-[#edf1e9]" />

                    <div className="mt-5 h-10 rounded bg-[#edf1e9]" />
                  </div>
                )
              )}
            </div>
          ) : filteredPartners.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredPartners.map(
                (partner, index) => {
                  const cardKey = [
                    partner.id,
                    partner.matchId ??
                      "no-match",
                    partner.demandId ??
                      "no-demand",
                    index,
                  ].join("-");

                  return (
                    <div
                      key={cardKey}
                      className="rounded-[22px] border border-[#dfe8d5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {/* CARD HEADER */}
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9f4d5]">
                          <Leaf className="h-6 w-6 text-[#557f35]" />
                        </div>

                        <div className="flex items-center gap-2">
                          {partner.verified && (
                            <div className="flex items-center gap-1 rounded-full bg-[#edf7e2] px-3 py-1 text-xs font-semibold text-[#4f7b30]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Terverifikasi
                            </div>
                          )}

                          <div className="rounded-full bg-[#e9f4d5] px-3 py-1 text-xs font-black text-[#507531]">
                            {partner.matchId
                              ? `${safeScore(
                                  partner.score
                                )}% Match`
                              : "Belum dinilai"}
                          </div>
                        </div>
                      </div>

                      {/* NAME */}
                      <h3 className="text-lg font-extrabold text-[#172313]">
                        {partner.name}
                      </h3>

                      {/* LOCATION */}
                      <div className="mt-2 flex items-center gap-1.5 text-sm text-[#687463]">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {partner.location}
                      </div>

                      {/* DESCRIPTION */}
                      <p className="mt-3 min-h-[42px] text-sm leading-6 text-[#687463]">
                        {partner.description ||
                          "Recovery partner ReFarm Loop."}
                      </p>

                      {/* MATERIAL */}
                      <div className="mt-4 rounded-xl bg-[#f5f9ef] p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#879181]">
                          Kebutuhan Material
                        </p>

                        <div className="mt-1 flex items-center justify-between gap-3">
                          <span className="font-bold text-[#32442c]">
                            {partner.materialName ||
                              "Belum menentukan kebutuhan"}
                          </span>

                          <span className="text-sm font-black text-[#557f35]">
                            {partner.quantityNeeded >
                            0
                              ? `${partner.quantityNeeded.toLocaleString(
                                  "id-ID"
                                )} kg`
                              : "Belum tersedia"}
                          </span>
                        </div>
                      </div>

                      {/* CAPACITY */}
                      <div className="mt-4 flex items-center justify-between border-t border-[#edf1e9] pt-4">
                        <div>
                          <p className="text-xs text-[#879181]">
                            Recovery capacity
                          </p>

                          <div className="mt-1 flex items-center gap-1.5">
                            <Package className="h-4 w-4 text-[#5d8538]" />

                            <span className="text-sm font-bold text-[#32442c]">
                              {partner.capacity >
                              0
                                ? `${partner.capacity.toLocaleString(
                                    "id-ID"
                                  )} kg/week`
                                : "Belum tersedia"}
                            </span>
                          </div>
                        </div>

                        {partner.matchId ? (
                          <a
                            href={`/discover/${partner.matchId}`}
                            className="flex items-center gap-1 rounded-full bg-[#f0f6e7] px-3 py-2 text-xs font-bold text-[#507531] hover:bg-[#e5f0d8]"
                          >
                            Lihat detail
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="rounded-full bg-[#f3f6ef] px-3 py-2 text-xs font-bold text-[#7a8474]">
                            Belum ada demand
                          </span>
                        )}
                      </div>

                      {/* MATCH SCORES */}
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        <ScoreBox
                          label="Material"
                          value={
                            partner.compatibilityScore
                          }
                        />

                        <ScoreBox
                          label="Jumlah"
                          value={
                            partner.quantityScore
                          }
                        />

                        <ScoreBox
                          label="Jarak"
                          value={
                            partner.distanceScore
                          }
                        />

                        <ScoreBox
                          label="Kapasitas"
                          value={
                            partner.capacityScore
                          }
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            /* EMPTY STATE */
            <div className="rounded-[22px] border border-[#dfe8d5] bg-white p-12 text-center">
              <Leaf className="mx-auto mb-3 h-8 w-8 text-[#63883e]" />

              <h3 className="font-bold text-[#263321]">
                Partner tidak ditemukan
              </h3>

              <p className="mt-1 text-sm text-[#71806a]">
                Belum ada partner recovery
                yang sesuai dengan filter kamu.
              </p>

              <p className="mt-2 text-xs text-[#879181]">
                Partner tanpa demand aktif tetap
                akan ditampilkan di Discover.
              </p>
            </div>
          )}
        </section>

        {/* MAP */}
        <aside>
          <div className="sticky top-6 overflow-hidden rounded-[24px] border border-[#dce7d0] bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-bold tracking-[0.14em] text-[#66883d]">
                RECOVERY MAP
              </p>

              <h2 className="mt-1 text-xl font-extrabold text-[#1b2816]">
                Partner di sekitar area
              </h2>
            </div>

            <div className="h-[480px] overflow-hidden rounded-[20px]">
              <RecoveryMap
                partners={filteredPartners.map(
                  (partner) => ({
                    id: partner.id,
                    name: partner.name,
                    type: partner.type,
                    location:
                      partner.location,
                    capacity:
                      partner.capacity,
                    lat: partner.lat,
                    lng: partner.lng,
                    verified:
                      partner.verified,
                    description:
                      partner.description,
                  })
                )}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-[#71806a]">
              <span>
                {filteredPartners.length} lokasi
                ditampilkan
              </span>

              <span>
                © OpenStreetMap
              </span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

// =========================================================
// HELPERS
// =========================================================

function toNumber(value: unknown): number {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function toNullableNumber(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function safeScore(
  value: unknown
): string {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toFixed(0);
}

function ScoreBox({
  label,
  value,
}: {
  label: string;
  value?: number | null;
}) {
  const safeValue =
    typeof value === "number" &&
    Number.isFinite(value)
      ? value
      : null;

  return (
    <div className="rounded-lg bg-[#f7faf2] px-2 py-2 text-center">
      <p className="text-[9px] font-bold uppercase tracking-wide text-[#879181]">
        {label}
      </p>

      <p className="mt-0.5 text-sm font-black text-[#32442c]">
        {safeValue === null
          ? "—"
          : safeValue.toFixed(0)}
      </p>
    </div>
  );
}
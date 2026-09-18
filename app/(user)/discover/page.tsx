"use client";

import { useMemo, useState } from "react";
import {
  Search,
  MapPin,
  Leaf,
  CheckCircle2,
  Package,
  ArrowUpRight,
} from "lucide-react";

import RecoveryMap from "@/components/recovery-map-wrapper";

const dummyPartners = [
  {
    id: "partner-1",
    name: "GreenCycle Compost",
    type: "Compost",
    location: "Sukarami, Palembang",
    capacity: 2500,
    lat: -2.9296,
    lng: 104.7008,
    verified: true,
    description:
      "Mengolah surplus sayuran dan limbah organik menjadi kompos.",
  },
  {
    id: "partner-2",
    name: "FeedLoop Farm",
    type: "Animal Feed",
    location: "Alang-Alang Lebar, Palembang",
    capacity: 1800,
    lat: -2.9394,
    lng: 104.7056,
    verified: true,
    description:
      "Menerima surplus pertanian yang sesuai untuk bahan pakan ternak.",
  },
  {
    id: "partner-3",
    name: "AgroRenew Fertilizer",
    type: "Organic Fertilizer",
    location: "Ilir Barat I, Palembang",
    capacity: 3200,
    lat: -2.9878,
    lng: 104.7335,
    verified: true,
    description:
      "Mengolah material organik menjadi pupuk organik untuk pertanian.",
  },
  {
    id: "partner-4",
    name: "FreshCycle Kitchen",
    type: "Food Processing",
    location: "Kemuning, Palembang",
    capacity: 950,
    lat: -2.9652,
    lng: 104.7503,
    verified: true,
    description:
      "Memanfaatkan surplus pangan yang masih layak untuk pengolahan makanan.",
  },
  {
    id: "partner-5",
    name: "BioLoop Organics",
    type: "Bioconversion",
    location: "Kertapati, Palembang",
    capacity: 4200,
    lat: -3.0207,
    lng: 104.7875,
    verified: true,
    description:
      "Mengolah material organik melalui proses biokonversi.",
  },
];

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

  const filteredPartners = useMemo(() => {
    return dummyPartners.filter((partner) => {
      const matchesFilter =
        activeFilter === "Semua" || partner.type === activeFilter;

      const keyword = search.toLowerCase();

      const matchesSearch =
        partner.name.toLowerCase().includes(keyword) ||
        partner.location.toLowerCase().includes(keyword) ||
        partner.type.toLowerCase().includes(keyword);

      return matchesFilter && matchesSearch;
    });
  }, [search, activeFilter]);

  return (
    <main className="min-h-screen bg-[#f7faf2] px-8 py-8">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[42px] font-extrabold tracking-tight text-[#101b0d]">
          Discover
        </h1>

        <p className="mt-1 text-[16px] text-[#60705b]">
          Temukan partner dan peluang recovery untuk surplus Anda.
        </p>
      </div>

      {/* Search */}
      <div className="mb-5 flex items-center rounded-full border border-[#dce7d0] bg-white px-5 py-3 shadow-sm">
        <Search className="mr-3 h-5 w-5 text-[#71806a]" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari partner, lokasi, atau jenis recovery..."
          className="w-full bg-transparent text-[16px] text-[#263321] outline-none placeholder:text-[#9aa59a]"
        />
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
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

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Partners */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[23px] font-extrabold text-[#182415]">
              Recommended Partners
            </h2>

            <span className="text-sm text-[#71806a]">
              {filteredPartners.length} terverifikasi
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredPartners.map((partner) => (
              <div
                key={partner.id}
                className="rounded-[22px] border border-[#dfe8d5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9f4d5]">
                    <Leaf className="h-6 w-6 text-[#557f35]" />
                  </div>

                  {partner.verified && (
                    <div className="flex items-center gap-1 rounded-full bg-[#edf7e2] px-3 py-1 text-xs font-semibold text-[#4f7b30]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Terverifikasi
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-extrabold text-[#172313]">
                  {partner.name}
                </h3>

                <div className="mt-2 flex items-center gap-1.5 text-sm text-[#687463]">
                  <MapPin className="h-4 w-4" />
                  {partner.location}
                </div>

                <p className="mt-3 min-h-[42px] text-sm leading-6 text-[#687463]">
                  {partner.description}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-[#edf1e9] pt-4">
                  <div>
                    <p className="text-xs text-[#879181]">
                      Recovery capacity
                    </p>

                    <div className="mt-1 flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-[#5d8538]" />

                      <span className="text-sm font-bold text-[#32442c]">
                        {partner.capacity.toLocaleString("id-ID")} kg/week
                      </span>
                    </div>
                  </div>

                  <button className="flex items-center gap-1 rounded-full bg-[#f0f6e7] px-3 py-2 text-xs font-bold text-[#507531] hover:bg-[#e5f0d8]">
                    Lihat detail
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredPartners.length === 0 && (
            <div className="rounded-[22px] border border-[#dfe8d5] bg-white p-12 text-center">
              <Leaf className="mx-auto mb-3 h-8 w-8 text-[#63883e]" />

              <h3 className="font-bold text-[#263321]">
                Partner tidak ditemukan
              </h3>

              <p className="mt-1 text-sm text-[#71806a]">
                Coba gunakan kata kunci atau kategori lain.
              </p>
            </div>
          )}
        </section>

        {/* Map */}
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
              <RecoveryMap partners={filteredPartners} />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-[#71806a]">
              <span>
                {filteredPartners.length} lokasi ditampilkan
              </span>

              <span>© OpenStreetMap</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
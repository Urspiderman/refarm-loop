import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Plus,
  ChevronRight,
  Leaf,
} from "lucide-react";

const labels: Record<string, string> = {
  listed: "Terdaftar",
  matched: "Cocok",
  accepted: "Diterima",
  scheduled: "Dijadwalkan",
  picked_up: "Sudah Diambil",
  received: "Diterima Mitra",
  completed: "Selesai",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

const filters = [
  {
    label: "Semua",
    value: "all",
  },
  {
    label: "Terdaftar",
    value: "listed",
  },
  {
    label: "Cocok",
    value: "matched",
  },
  {
    label: "Dalam Proses",
    value: "process",
  },
  {
    label: "Selesai",
    value: "completed",
  },
];

export default async function Surplus({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
  }>;
}) {
  const s = await createClient();

  const params = await searchParams;
  const activeFilter = params.filter || "all";

  const {
    data: { user },
  } = await s.auth.getUser();

  /*
   * =========================================================
   * AMBIL DATA SURPLUS
   * =========================================================
   */

  const { data } = user
    ? await s
        .from("surplus_listings")
        .select("*,material_assessments(*)")
        .eq("supplier_id", user.id)
        .order("created_at", {
          ascending: false,
        })
    : { data: [] };

  /*
   * =========================================================
   * BUAT SIGNED URL FOTO
   * =========================================================
   */

  const surplusWithPhotos = await Promise.all(
    (data || []).map(async (x: any) => {
      let photoUrl: string | null = null;

      if (x.photo_path) {
        const { data: signedUrlData, error: signedUrlError } =
          await s.storage
            .from("refarm-media")
            .createSignedUrl(x.photo_path, 60 * 60);

        if (signedUrlError) {
          console.error(
            "Gagal membuat signed URL:",
            x.photo_path,
            signedUrlError
          );
        } else {
          photoUrl = signedUrlData?.signedUrl || null;
        }
      }

      return {
        ...x,
        photoUrl,
      };
    })
  );

  /*
   * =========================================================
   * FILTER DATA
   * =========================================================
   */

  const filteredData = surplusWithPhotos.filter((x: any) => {
    if (activeFilter === "all") {
      return true;
    }

    if (activeFilter === "listed") {
      return x.status === "listed";
    }

    if (activeFilter === "matched") {
      return x.status === "matched";
    }

    if (activeFilter === "process") {
      return [
        "accepted",
        "scheduled",
        "picked_up",
        "received",
      ].includes(x.status);
    }

    if (activeFilter === "completed") {
      return x.status === "completed";
    }

    return true;
  });

  return (
    <div className="px-5 py-8 md:px-8 md:py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">
            Surplus Saya
          </h1>

          <p className="mt-1 text-sm text-[var(--muted)]">
            Semua surplus yang Anda daftarkan.
          </p>
        </div>

        <Link
          href="/surplus/new"
          className="btn-primary shrink-0"
        >
          <Plus size={17} />
          Tambah Surplus
        </Link>
      </div>

      {/* Filter */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => {
          const isActive =
            activeFilter === filter.value;

          const href =
            filter.value === "all"
              ? "/surplus"
              : `/surplus?filter=${filter.value}`;

          return (
            <Link
              key={filter.value}
              href={href}
              className={`pill whitespace-nowrap transition ${
                isActive
                  ? "bg-[var(--green-800)] text-white"
                  : "hover:bg-[var(--mint-2)]"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {/* Result Info */}
      <div className="mt-4 text-xs font-medium text-[var(--muted)]">
        Menampilkan {filteredData.length} dari{" "}
        {surplusWithPhotos.length} surplus
      </div>

      {/* Empty State */}
      {!filteredData.length ? (
        <div className="card mt-5 flex min-h-[390px] flex-col items-center justify-center p-8 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
            <Leaf size={42} />
          </div>

          <h2 className="mt-6 text-lg font-black">
            {activeFilter === "all"
              ? "Belum ada surplus."
              : "Tidak ada surplus pada kategori ini."}
          </h2>

          <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
            {activeFilter === "all"
              ? "Daftarkan surplus pertanian Anda untuk menemukan peluang recovery."
              : "Coba pilih filter lain untuk melihat surplus Anda."}
          </p>

          {activeFilter === "all" && (
            <Link
              href="/surplus/new"
              className="btn-primary mt-5"
            >
              <Plus size={16} />
              Tambah Surplus
            </Link>
          )}

          {activeFilter !== "all" && (
            <Link
              href="/surplus"
              className="btn-primary mt-5"
            >
              Lihat Semua Surplus
            </Link>
          )}
        </div>
      ) : (
        /* Surplus List */
        <div className="mt-5 grid gap-4">
          {filteredData.map((x: any) => (
            <Link
              href={`/surplus/${x.id}`}
              key={x.id}
              className="card block p-4 transition hover:bg-[var(--mint-2)]"
            >
              <div className="flex gap-4">
                {/* Photo */}
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[var(--mint)]">
                  {x.photoUrl ? (
                    <img
                      src={x.photoUrl}
                      alt={
                        x.material_name ||
                        "Foto surplus"
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Leaf
                        size={28}
                        className="text-[var(--green-800)]"
                      />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black">
                        {x.material_name}
                      </h3>

                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {x.quantity} {x.unit} •{" "}
                        {x.condition}
                      </p>
                    </div>

                    <span className="pill">
                      {labels[x.status] || x.status}
                    </span>
                  </div>

                  {/* AI Assessment */}
                  {x.material_assessments?.[0] && (
                    <div className="mt-3 rounded-xl bg-[var(--mint-2)] p-3">
                      <p className="text-xs font-bold text-[var(--green-900)]">
                        Penilaian AI
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(
                          x.material_assessments[0]
                            .recommended_pathways || []
                        ).map((p: string) => (
                          <span
                            className="pill"
                            key={p}
                          >
                            {p.replaceAll(
                              "_",
                              " "
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Details */}
                  <div className="mt-3 flex items-center justify-end text-xs font-bold text-[var(--green-900)]">
                    Lihat Detail
                    <ChevronRight size={15} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Sparkles,
  Truck,
} from "lucide-react";
import IncomingActions from "@/components/partner/incoming-actions";

const statusLabels: Record<string, string> = {
  proposed: "Menunggu Respons",
  accepted: "Diterima",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  completed: "Selesai",
};

export default async function IncomingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const s = await createClient();

  // =========================================================
  // USER
  // =========================================================

  const {
    data: { user },
  } = await s.auth.getUser();

  if (!user) {
    return null;
  }

  // =========================================================
  // MATCH
  // =========================================================

  const { data: match, error: matchError } = await s
    .from("matches")
    .select(`
      id,
      surplus_id,
      demand_id,
      score,
      compatibility_score,
      quantity_score,
      distance_score,
      capacity_score,
      status
    `)
    .eq("id", id)
    .maybeSingle();

  if (matchError) {
    console.error("Incoming detail match error:", matchError);
  }

  if (!match) {
    return (
      <AppShell role="recovery_partner">
        <div className="px-5 py-8 md:px-8 md:py-10">
          <Link
            href="/partner/incoming"
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--green-900)] hover:underline"
          >
            <ArrowLeft size={16} />
            Kembali ke Pasokan Masuk
          </Link>

          <div className="card mt-6 flex min-h-[300px] items-center justify-center p-8 text-center">
            <div>
              <h1 className="text-xl font-black">
                Request tidak ditemukan
              </h1>

              <p className="mt-2 text-sm text-[var(--muted)]">
                Request recovery ini tidak tersedia atau
                sudah tidak dapat diakses.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // =========================================================
  // DEMAND
  // =========================================================

  const { data: demand } = await s
    .from("material_demands")
    .select(`
      id,
      recovery_partner_id,
      material_name,
      pathway,
      quantity_needed,
      capacity_available_kg,
      min_condition,
      active
    `)
    .eq("id", match.demand_id)
    .eq("recovery_partner_id", user.id)
    .maybeSingle();

  if (!demand) {
    return (
      <AppShell role="recovery_partner">
        <div className="px-5 py-8 md:px-8 md:py-10">
          <Link
            href="/partner/incoming"
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--green-900)] hover:underline"
          >
            <ArrowLeft size={16} />
            Kembali ke Pasokan Masuk
          </Link>

          <div className="card mt-6 flex min-h-[300px] items-center justify-center p-8 text-center">
            <div>
              <h1 className="text-xl font-black">
                Request tidak tersedia
              </h1>

              <p className="mt-2 text-sm text-[var(--muted)]">
                Request ini bukan bagian dari demand
                recovery partner Anda.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // =========================================================
  // SURPLUS
  // =========================================================

  const { data: surplus } = await s
    .from("surplus_listings")
    .select(`
      id,
      supplier_id,
      material_name,
      quantity,
      unit,
      condition,
      location_text,
      status
    `)
    .eq("id", match.surplus_id)
    .maybeSingle();

  // =========================================================
  // SCORE
  // =========================================================

  const score = Math.round(Number(match.score || 0));

  return (
    <AppShell role="recovery_partner">
      <div className="px-5 py-8 md:px-8 md:py-10">

        {/* =====================================================
            BACK
        ===================================================== */}

        <Link
          href="/partner/incoming"
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--green-900)] hover:underline"
        >
          <ArrowLeft size={16} />
          Pasokan Masuk
        </Link>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint)] text-[var(--green-800)]">
                <Truck size={20} />
              </span>

              <span className="text-sm font-bold text-[var(--muted)]">
                Recovery Request
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight">
              {surplus?.material_name || demand.material_name}
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Detail surplus yang cocok dengan
              demand recovery Anda.
            </p>
          </div>

          {/* SCORE */}

          <div className="card min-w-[130px] p-5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
              <Sparkles size={19} />
            </div>

            <p className="mt-3 text-xs text-[var(--muted)]">
              Match Score
            </p>

            <p className="mt-1 text-3xl font-black text-[var(--green-800)]">
              {score}%
            </p>
          </div>
        </div>

        {/* =====================================================
            STATUS
        ===================================================== */}

        <div className="card mt-6 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mint)] text-[var(--green-800)]">
              {match.status === "proposed" ? (
                <Clock3 size={19} />
              ) : (
                <CheckCircle2 size={19} />
              )}
            </div>

            <div>
              <p className="text-xs text-[var(--muted)]">
                Status Request
              </p>

              <p className="mt-1 font-black">
                {statusLabels[match.status] || match.status}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            SURPLUS
        ===================================================== */}

        <section className="mt-7">
          <h2 className="mb-4 text-xl font-black">
            Informasi Surplus
          </h2>

          <div className="card p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--mint)] text-[var(--green-800)]">
                <Package size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-black">
                  {surplus?.material_name || "Material"}
                </h3>

                <p className="mt-1 text-sm text-[var(--muted)]">
                  Surplus dari supplier
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Info
                label="Quantity"
                value={
                  surplus?.quantity
                    ? `${surplus.quantity} ${surplus.unit || ""}`
                    : "-"
                }
              />

              <Info
                label="Kondisi"
                value={surplus?.condition || "-"}
              />

              <Info
                label="Status"
                value={surplus?.status || "-"}
              />
            </div>

            {surplus?.location_text && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]">
                <MapPin size={16} />

                <span>{surplus.location_text}</span>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            DEMAND
        ===================================================== */}

        <section className="mt-7">
          <h2 className="mb-4 text-xl font-black">
            Demand Anda
          </h2>

          <div className="card p-5">
            <h3 className="font-black">
              {demand.material_name}
            </h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Info
                label="Recovery Pathway"
                value={
                  demand.pathway?.replaceAll("_", " ") || "-"
                }
              />

              <Info
                label="Quantity Dibutuhkan"
                value={
                  demand.quantity_needed
                    ? `${demand.quantity_needed}`
                    : "-"
                }
              />

              <Info
                label="Kapasitas"
                value={
                  demand.capacity_available_kg
                    ? `${demand.capacity_available_kg} kg`
                    : "-"
                }
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            MATCH BREAKDOWN
        ===================================================== */}

        <section className="mt-7">
          <h2 className="mb-4 text-xl font-black">
            Match Analysis
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Score
              label="Compatibility"
              value={match.compatibility_score}
            />

            <Score
              label="Quantity"
              value={match.quantity_score}
            />

            <Score
              label="Distance"
              value={match.distance_score}
            />

            <Score
              label="Capacity"
              value={match.capacity_score}
            />
          </div>
        </section>

        {/* =====================================================
            ACTION
        ===================================================== */}

        {match.status === "proposed" && (
          <div className="card mt-7 bg-[var(--mint)] p-6">
            <div>
              <h2 className="text-lg font-black">
                Review Request
              </h2>

              <p className="mt-1 max-w-xl text-sm text-[var(--green-900)]">
                Request ini sesuai dengan demand Anda.
                Review informasi surplus sebelum
                menerima proses recovery.
              </p>
            </div>

            <div className="mt-5">
              <IncomingActions matchId={match.id} />
            </div>

            <p className="mt-3 text-xs text-[var(--muted)]">
              Menerima request akan mengubah status
              matching menjadi diterima.
            </p>
          </div>
        )}

        {/* =====================================================
            ACCEPTED
        ===================================================== */}

        {match.status === "accepted" && (
          <div className="card mt-7 border border-[var(--green-800)]/20 bg-[var(--mint)] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--green-800)] text-white">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <h2 className="text-lg font-black">
                  Request Diterima
                </h2>

                <p className="mt-1 text-sm text-[var(--green-900)]">
                  Anda telah menerima request recovery ini.
                  Proses selanjutnya dapat dilanjutkan ke
                  transaksi dan pengelolaan recovery.
                </p>

                <Link
                  href="/partner/transactions"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--green-800)] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
                >
                  Lihat Transaksi
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            REJECTED
        ===================================================== */}

        {match.status === "rejected" && (
          <div className="card mt-7 bg-[var(--mint-2)] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[var(--muted)]">
                <Clock3 size={22} />
              </div>

              <div>
                <h2 className="text-lg font-black">
                  Request Ditolak
                </h2>

                <p className="mt-1 text-sm text-[var(--muted)]">
                  Request recovery ini telah ditolak dan
                  tidak dapat diproses kembali dari halaman ini.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}

/* =========================================================
   INFO
========================================================= */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[var(--mint-2)] p-3">
      <p className="text-xs text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-sm font-black capitalize">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   SCORE
========================================================= */

function Score({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[var(--green-800)]">
        {Math.round(Number(value || 0))}
      </p>
    </div>
  );
}
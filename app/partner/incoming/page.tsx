import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import {
  Truck,
  Package,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock3,
  XCircle,
  Leaf,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  proposed: "Menunggu",
  accepted: "Diterima",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  completed: "Selesai",
};

export default async function IncomingPage() {
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
  // DEMAND MILIK PARTNER
  // =========================================================

  const { data: demands } = await s
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
    .eq("recovery_partner_id", user.id);

  const demandIds =
    demands?.map((demand) => demand.id) || [];

  // =========================================================
  // MATCHING REQUEST
  // =========================================================

  let matches: any[] = [];

  if (demandIds.length > 0) {
    const { data: matchData } = await s
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
      .in("demand_id", demandIds)
      .order("score", {
        ascending: false,
      });

    matches = matchData || [];
  }

  // =========================================================
  // SURPLUS
  // =========================================================

  const surplusIds = [
    ...new Set(
      matches.map((match) => match.surplus_id)
    ),
  ];

  let surplusList: any[] = [];

  if (surplusIds.length > 0) {
    const { data: surplusData } = await s
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
      .in("id", surplusIds);

    surplusList = surplusData || [];
  }

  // =========================================================
  // GABUNGKAN MATCH + DEMAND + SURPLUS
  // =========================================================

  const incoming = matches.map((match) => {
    const demand = demands?.find(
      (item) => item.id === match.demand_id
    );

    const surplus = surplusList.find(
      (item) => item.id === match.surplus_id
    );

    return {
      ...match,
      demand,
      surplus,
    };
  });

  // =========================================================
  // STATISTICS
  // =========================================================

  const pendingCount = incoming.filter(
    (item) => item.status === "proposed"
  ).length;

  const activeDemandCount =
    demands?.filter((item) => item.active).length || 0;

  return (
    <AppShell role="recovery_partner">
      <div className="px-5 py-8 md:px-8 md:py-10">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-7">
          <p className="text-sm text-[var(--muted)]">
            Recovery Partner
          </p>

          <h1 className="mt-1 text-4xl font-black tracking-tight">
            Pasokan Masuk
          </h1>

          <p className="mt-2 text-base text-[var(--muted)]">
            Lihat surplus yang cocok dengan demand Anda.
          </p>
        </div>

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="grid gap-4 md:grid-cols-3">

          <Stat
            label="Pasokan Masuk"
            value={incoming.length}
          />

          <Stat
            label="Menunggu Respons"
            value={pendingCount}
          />

          <Stat
            label="Demand Aktif"
            value={activeDemandCount}
          />

        </div>

        {/* =====================================================
            INTRO BANNER
        ===================================================== */}

        <div className="card mt-7 overflow-hidden bg-[var(--mint)] p-6">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[var(--green-800)]">
              <Truck size={27} />
            </div>

            <div>
              <h2 className="text-xl font-black">
                Pasokan yang Sesuai
              </h2>

              <p className="mt-1 text-sm text-[var(--green-900)]">
                Surplus yang cocok dengan kebutuhan
                recovery Anda akan muncul di sini.
              </p>
            </div>

          </div>

        </div>

        {/* =====================================================
            INCOMING LIST
        ===================================================== */}

        <section className="mt-7">

          <div className="mb-4 flex items-center justify-between">

            <h2 className="text-xl font-black">
              Request Masuk
            </h2>

            <span className="text-sm text-[var(--muted)]">
              {incoming.length} request
            </span>

          </div>

          {incoming.length === 0 ? (

            /* =================================================
               EMPTY STATE
            ================================================= */

            <div className="card flex min-h-[300px] flex-col items-center justify-center p-8 text-center">

              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                <Leaf size={35} />
              </div>

              <h3 className="mt-5 text-lg font-black">
                Belum ada pasokan masuk
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                Ketika surplus supplier cocok dengan
                demand yang Anda buat, request akan
                muncul di halaman ini.
              </p>

              <Link
                href="/partner/demands"
                className="btn-primary mt-5"
              >
                Lihat Demand Saya
                <ArrowRight size={16} />
              </Link>

            </div>

          ) : (

            /* =================================================
               REQUEST CARDS
            ================================================= */

            <div className="grid gap-4">

              {incoming.map((item) => {

                const surplus = item.surplus;
                const demand = item.demand;

                const score = Math.round(
                  Number(item.score || 0)
                );

                const isPending =
                  item.status === "proposed";

                return (
                  <div
                    key={item.id}
                    className="card p-5"
                  >

                    {/* TOP */}
                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <div className="flex items-center gap-2">

                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--mint)] text-[var(--green-800)]">
                            <Package size={18} />
                          </span>

                          <span className="text-xs font-bold text-[var(--muted)]">
                            Recovery Request
                          </span>

                        </div>

                        <h3 className="mt-3 text-xl font-black">
                          {surplus?.material_name ||
                            demand?.material_name ||
                            "Material"}
                        </h3>

                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {surplus?.quantity ?? "-"}{" "}
                          {surplus?.unit ?? ""}
                          {" • "}
                          {surplus?.condition || "-"}
                        </p>

                      </div>

                      {/* SCORE */}

                      <div className="shrink-0 text-right">

                        <p className="text-xs text-[var(--muted)]">
                          Match
                        </p>

                        <p className="mt-1 text-2xl font-black text-[var(--green-800)]">
                          {score}%
                        </p>

                      </div>

                    </div>

                    {/* DETAILS */}

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">

                      <Info
                        label="Recovery Pathway"
                        value={
                          demand?.pathway
                            ?.replaceAll("_", " ") ||
                          "-"
                        }
                      />

                      <Info
                        label="Kebutuhan"
                        value={
                          demand?.quantity_needed
                            ? `${demand.quantity_needed}`
                            : "-"
                        }
                      />

                      <Info
                        label="Kapasitas"
                        value={
                          demand?.capacity_available_kg
                            ? `${demand.capacity_available_kg} kg`
                            : "-"
                        }
                      />

                    </div>

                    {/* LOCATION */}

                    {surplus?.location_text && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]">

                        <MapPin size={15} />

                        <span>
                          {surplus.location_text}
                        </span>

                      </div>
                    )}

                    {/* STATUS */}

                    <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">

                      <div className="flex items-center gap-2">

                        {isPending ? (
                          <Clock3
                            size={15}
                            className="text-[var(--green-800)]"
                          />
                        ) : item.status ===
                          "accepted" ? (
                          <CheckCircle2
                            size={15}
                            className="text-[var(--green-800)]"
                          />
                        ) : (
                          <XCircle
                            size={15}
                            className="text-[var(--muted)]"
                          />
                        )}

                        <span className="text-xs font-bold">
                          {statusLabels[
                            item.status
                          ] || item.status}
                        </span>

                      </div>

                      <Link
                        href={`/partner/incoming/${item.id}`}
                        className="flex items-center gap-1 text-xs font-bold text-[var(--green-900)] hover:underline"
                      >
                        Lihat Detail
                        <ArrowRight size={14} />
                      </Link>

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </section>

        {/* =====================================================
            CTA
        ===================================================== */}

        <Link
          href="/partner/demands/new"
          className="btn-primary mt-7 w-full md:w-auto"
        >
          + Tambah Demand
          <ArrowRight size={17} />
        </Link>

      </div>
    </AppShell>
  );
}

/* =========================================================
   STAT
========================================================= */

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="card p-5">

      <p className="text-sm text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black">
        {value}
      </p>

    </div>
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
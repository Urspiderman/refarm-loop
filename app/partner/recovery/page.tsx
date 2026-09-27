import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Leaf,
  Package,
  Recycle,
} from "lucide-react";

export default async function RecoveryPage() {
  const s = await createClient();

  const {
    data: { user },
  } = await s.auth.getUser();

  // Jika belum login
  if (!user) {
    return null;
  }

  // =========================================================
  // RECOVERY RECORDS
  // =========================================================

  const { data: recoveryRecords } = await s
    .from("recovery_records")
    .select(`
      id,
      transaction_id,
      recovery_partner_id,
      pathway,
      input_quantity,
      output_quantity,
      recovered_at,
      notes,
      created_at
    `)
    .eq("recovery_partner_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  // =========================================================
  // SUMMARY
  // =========================================================

  const records = recoveryRecords || [];

  const processingCount = records.filter(
    (record) => !record.recovered_at
  ).length;

  const completedCount = records.filter(
    (record) => !!record.recovered_at
  ).length;

  const totalInput = records.reduce(
    (total, record) =>
      total + Number(record.input_quantity || 0),
    0
  );

  const totalOutput = records.reduce(
    (total, record) =>
      total + Number(record.output_quantity || 0),
    0
  );

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <AppShell role="recovery_partner">
      <div className="px-5 py-8 md:px-8 md:py-10">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-7 flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--muted)]">
              Recovery Partner
            </p>

            <h1 className="mt-1 text-4xl font-black tracking-tight">
              Pemulihan
            </h1>

            <p className="mt-2 text-base text-[var(--muted)]">
              Pantau material surplus yang sedang dan
              telah dipulihkan melalui recovery pathway.
            </p>
          </div>
        </div>

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="grid gap-4 md:grid-cols-4">

          <Stat
            label="Total Recovery"
            value={records.length}
          />

          <Stat
            label="Sedang Diproses"
            value={processingCount}
          />

          <Stat
            label="Selesai"
            value={completedCount}
          />

          <Stat
            label="Material Recovered"
            value={`${totalOutput.toLocaleString(
              "id-ID"
            )} kg`}
          />

        </div>

        {/* =====================================================
            RECOVERY OVERVIEW
        ===================================================== */}

        <div className="card mt-7 overflow-hidden bg-[var(--mint)] p-6 md:p-7">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--green-800)]">
              <Recycle size={28} />
            </div>

            <div>
              <h2 className="text-xl font-black">
                Circular Recovery
              </h2>

              <p className="mt-1 text-sm text-[var(--green-900)]">
                Material surplus diproses kembali menjadi
                nilai baru melalui pathway recovery.
              </p>
            </div>

          </div>

        </div>

        {/* =====================================================
            INPUT / OUTPUT SUMMARY
        ===================================================== */}

        <section className="mt-7">

          <h2 className="mb-4 text-xl font-black">
            Recovery Overview
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            <div className="card p-5">

              <div className="flex items-center gap-3">

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                  <Package size={19} />
                </span>

                <div>
                  <p className="text-sm text-[var(--muted)]">
                    Total Input
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {totalInput.toLocaleString(
                      "id-ID"
                    )}{" "}
                    kg
                  </p>
                </div>

              </div>

              <p className="mt-4 text-sm text-[var(--muted)]">
                Total material surplus yang tercatat
                masuk ke proses recovery.
              </p>

            </div>

            <div className="card p-5">

              <div className="flex items-center gap-3">

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                  <Leaf size={19} />
                </span>

                <div>
                  <p className="text-sm text-[var(--muted)]">
                    Total Output
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {totalOutput.toLocaleString(
                      "id-ID"
                    )}{" "}
                    kg
                  </p>
                </div>

              </div>

              <p className="mt-4 text-sm text-[var(--muted)]">
                Total output recovery yang telah
                dicatat oleh partner.
              </p>

            </div>

          </div>

        </section>

        {/* =====================================================
            RECOVERY RECORDS
        ===================================================== */}

        <section className="mt-7">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="text-xl font-black">
                Recovery Records
              </h2>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Riwayat proses pemulihan material.
              </p>
            </div>

            <span className="text-sm text-[var(--muted)]">
              {records.length} record
            </span>

          </div>

          {records.length === 0 ? (

            /* =================================================
               EMPTY STATE
            ================================================= */

            <div className="card p-8">

              <div className="flex flex-col items-center justify-center text-center">

                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                  <Recycle size={25} />
                </span>

                <h3 className="mt-4 text-lg font-black">
                  Belum ada recovery record
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                  Recovery record akan muncul setelah
                  transaksi surplus mulai diproses oleh
                  recovery partner.
                </p>

                <Link
                  href="/partner/incoming"
                  className="btn-primary mt-5"
                >
                  Lihat Pasokan Masuk
                  <ArrowRight size={17} />
                </Link>

              </div>

            </div>

          ) : (

            /* =================================================
               RECORD LIST
            ================================================= */

            <div className="space-y-4">

              {records.map((record) => {

                const isCompleted =
                  !!record.recovered_at;

                const inputQuantity =
                  Number(
                    record.input_quantity || 0
                  );

                const outputQuantity =
                  Number(
                    record.output_quantity || 0
                  );

                return (
                  <div
                    key={record.id}
                    className="card p-5"
                  >

                    {/* TOP */}

                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                      <div className="flex items-start gap-3">

                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                          <Recycle size={20} />
                        </span>

                        <div>

                          <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                            Recovery Record
                          </p>

                          <h3 className="mt-1 text-lg font-black">
                            {formatPathway(
                              record.pathway
                            )}
                          </h3>

                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {formatDate(
                              record.created_at
                            )}
                          </p>

                        </div>

                      </div>

                      {/* STATUS */}

                      {isCompleted ? (

                        <div className="flex items-center gap-2 text-sm font-bold text-[var(--green-800)]">

                          <CheckCircle2 size={17} />

                          Selesai

                        </div>

                      ) : (

                        <div className="flex items-center gap-2 text-sm font-bold text-amber-700">

                          <Clock3 size={17} />

                          Sedang Diproses

                        </div>

                      )}

                    </div>

                    {/* DATA */}

                    <div className="mt-5 grid gap-3 md:grid-cols-3">

                      <InfoCard
                        label="Input Material"
                        value={`${inputQuantity.toLocaleString(
                          "id-ID"
                        )} kg`}
                      />

                      <InfoCard
                        label="Output Recovery"
                        value={
                          record.output_quantity !==
                          null
                            ? `${outputQuantity.toLocaleString(
                                "id-ID"
                              )} kg`
                            : "Belum tersedia"
                        }
                      />

                      <InfoCard
                        label="Recovery Pathway"
                        value={formatPathway(
                          record.pathway
                        )}
                      />

                    </div>

                    {/* NOTES */}

                    {record.notes && (
                      <div className="mt-4 border-t border-[var(--border)] pt-4">

                        <p className="text-xs font-bold text-[var(--muted)]">
                          Catatan
                        </p>

                        <p className="mt-1 text-sm leading-6">
                          {record.notes}
                        </p>

                      </div>
                    )}

                    {/* FOOTER */}

                    <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <p className="text-xs text-[var(--muted)]">
                          Transaction
                        </p>

                        <p className="mt-1 text-xs font-bold">
                          {record.transaction_id.slice(
                            0,
                            8
                          )}
                          ...
                        </p>

                      </div>

                      <Link
                        href={`/activity/${record.transaction_id}`}
                        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--green-800)] hover:underline"
                      >
                        Lihat Transaction
                        <ArrowRight size={16} />
                      </Link>

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </section>

        {/* =====================================================
            BOTTOM INFORMATION
        ===================================================== */}

        <div className="card mt-7 bg-[var(--mint)] p-5">

          <div className="flex items-start gap-3">

            <Leaf
              size={20}
              className="mt-0.5 shrink-0 text-[var(--green-800)]"
            />

            <div>

              <p className="text-sm font-black">
                ReFarm Loop Recovery
              </p>

              <p className="mt-1 text-sm leading-6 text-[var(--green-900)]">
                Setiap recovery record mencatat material
                yang masuk, pathway pemulihan, output
                yang dihasilkan, dan waktu penyelesaian
                proses recovery.
              </p>

            </div>

          </div>

        </div>

      </div>
    </AppShell>
  );
}

/* =========================================================
   STAT COMPONENT
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
   INFO CARD
========================================================= */

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[var(--mint-2)] p-4">

      <p className="text-xs text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-sm font-black">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   PATHWAY FORMATTER
========================================================= */

function formatPathway(
  pathway: string | null
) {
  const labels: Record<
    string,
    string
  > = {
    animal_feed: "Animal Feed",
    compost: "Compost",
    organic_fertilizer:
      "Organic Fertilizer",
    food_processing:
      "Food Processing",
    bioconversion:
      "Bioconversion",
    other: "Other",
  };

  if (!pathway) {
    return "Recovery";
  }

  return (
    labels[pathway] ||
    pathway
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      )
  );
}

/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(
  value: string | null
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}
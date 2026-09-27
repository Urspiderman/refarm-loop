import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import TransactionAction from "./TransactionAction";

const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  awaiting_payment: "Menunggu Pembayaran",
  paid: "Dibayar",
  in_collection: "Dalam Pengambilan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  refunded: "Refund",
};

const statusClasses: Record<string, string> = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-700",

  awaiting_payment:
    "border-orange-200 bg-orange-50 text-orange-700",

  paid:
    "border-blue-200 bg-blue-50 text-blue-700",

  in_collection:
    "border-purple-200 bg-purple-50 text-purple-700",

  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  cancelled:
    "border-red-200 bg-red-50 text-red-700",

  refunded:
    "border-gray-200 bg-gray-50 text-gray-700",
};

export default async function PartnerTransactionsPage() {
  const supabase = await createClient();

  // =========================================================
  // AUTH
  // =========================================================
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // =========================================================
  // GET TRANSACTIONS
  // =========================================================
  const { data: transactions } = await supabase
    .from("transactions")
    .select(`
      id,
      surplus_id,
      quantity,
      unit_price,
      gross_amount,
      platform_fee,
      payment_fee,
      supplier_amount,
      status,
      created_at
    `)
    .eq("buyer_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  const transactionList = transactions ?? [];

  // =========================================================
  // SUMMARY
  // =========================================================
  const totalTransactions = transactionList.length;

  const pendingTransactions = transactionList.filter(
    (item) => item.status === "pending"
  ).length;

  const collectionTransactions = transactionList.filter(
    (item) => item.status === "in_collection"
  ).length;

  const completedTransactions = transactionList.filter(
    (item) => item.status === "completed"
  ).length;

  return (
    <AppShell role="recovery_partner">
      <main className="mx-auto w-full max-w-[1380px] space-y-7">

        {/* =====================================================
            HEADER
        ===================================================== */}
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">
                Recovery Partner
              </p>

              <h1 className="mt-1 text-4xl font-black tracking-tight text-[var(--green-900)]">
                Transaksi
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
                Kelola transaksi material surplus dari
                penerimaan hingga proses recovery.
              </p>
            </div>

            <div className="inline-flex w-fit items-center rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--green-800)] shadow-sm">
              {totalTransactions} transaksi
            </div>
          </div>
        </section>

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">

          {/* TOTAL */}
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--mint-2)]">
                <Package
                  size={19}
                  className="text-[var(--green-800)]"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs text-[var(--muted)]">
                  Total Transaksi
                </p>

                <p className="mt-0.5 text-2xl font-black text-[var(--green-900)]">
                  {totalTransactions}
                </p>
              </div>
            </div>
          </div>

          {/* PENDING */}
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <Clock3
                  size={19}
                  className="text-amber-700"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs text-[var(--muted)]">
                  Menunggu
                </p>

                <p className="mt-0.5 text-2xl font-black text-[var(--green-900)]">
                  {pendingTransactions}
                </p>
              </div>
            </div>
          </div>

          {/* COLLECTION */}
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <Truck
                  size={19}
                  className="text-blue-700"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs text-[var(--muted)]">
                  Dalam Pengambilan
                </p>

                <p className="mt-0.5 text-2xl font-black text-[var(--green-900)]">
                  {collectionTransactions}
                </p>
              </div>
            </div>
          </div>

          {/* COMPLETED */}
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <CheckCircle2
                  size={19}
                  className="text-emerald-700"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs text-[var(--muted)]">
                  Selesai
                </p>

                <p className="mt-0.5 text-2xl font-black text-[var(--green-900)]">
                  {completedTransactions}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            FLOW
        ===================================================== */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--mint)]">
          <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
                <Truck
                  size={17}
                  className="text-[var(--green-800)]"
                />
              </div>

              <div>
                <h2 className="text-sm font-black text-[var(--green-900)]">
                  Alur Transaksi
                </h2>

                <p className="mt-0.5 text-xs text-[var(--green-800)]">
                  Terima → ambil → recovery → selesai
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-[var(--green-800)]">
              <span className="rounded-full bg-white px-3 py-1.5">
                Pending
              </span>

              <ArrowRight size={13} />

              <span className="rounded-full bg-white px-3 py-1.5">
                In Collection
              </span>

              <ArrowRight size={13} />

              <span className="rounded-full bg-white px-3 py-1.5">
                Completed
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            TRANSACTION HEADER
        ===================================================== */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black text-[var(--green-900)]">
                Daftar Transaksi
              </h2>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Transaksi material yang sedang atau telah diproses.
              </p>
            </div>

            <span className="hidden text-sm text-[var(--muted)] sm:block">
              {totalTransactions} transaksi
            </span>
          </div>

          {/* =====================================================
              EMPTY
          ===================================================== */}
          {transactionList.length === 0 ? (
            <div className="rounded-3xl border border-[var(--border)] bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--mint-2)]">
                <Package
                  size={27}
                  className="text-[var(--green-800)]"
                />
              </div>

              <h3 className="mt-4 text-lg font-black text-[var(--green-900)]">
                Belum ada transaksi
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                Transaksi akan muncul setelah kamu
                menerima pasokan dari halaman Pasokan Masuk.
              </p>

              <Link
                href="/partner/incoming"
                className="btn-primary mt-5 inline-flex items-center gap-2"
              >
                Lihat Pasokan Masuk
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (

            /* =====================================================
               LIST
            ===================================================== */
            <div className="space-y-3">
              {transactionList.map((transaction) => {
                const status = transaction.status;

                return (
                  <article
                    key={transaction.id}
                    className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="p-4 sm:p-5">

                      {/* TOP ROW */}
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        {/* TRANSACTION INFO */}
                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                                statusClasses[status] ??
                                "border-gray-200 bg-gray-50 text-gray-700"
                              }`}
                            >
                              {statusLabels[status] ?? status}
                            </span>

                            <span className="text-xs text-[var(--muted)]">
                              {new Date(
                                transaction.created_at
                              ).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>

                          <div className="mt-2">
                            <h3 className="text-lg font-black text-[var(--green-900)]">
                              Transaksi #
                              {transaction.id.slice(0, 8)}
                            </h3>
                          </div>
                        </div>

                        {/* ACTION */}
                        <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-auto">
                          <TransactionAction
                            transactionId={transaction.id}
                            status={status}
                          />

                          <Link
                            href={`/activity/${transaction.id}`}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-bold text-[var(--green-900)] transition hover:bg-[var(--mint)]"
                          >
                            Detail
                            <ArrowRight size={15} />
                          </Link>
                        </div>
                      </div>

                      {/* DIVIDER */}
                      <div className="my-4 h-px bg-[var(--border)]" />

                      {/* TRANSACTION DATA */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">

                        {/* QUANTITY */}
                        <div className="rounded-xl bg-[var(--mint)] px-3 py-3 sm:px-4">
                          <p className="text-[11px] text-[var(--muted)]">
                            Quantity
                          </p>

                          <p className="mt-1 text-base font-black text-[var(--green-900)] sm:text-lg">
                            {Number(
                              transaction.quantity
                            ).toLocaleString("id-ID")}
                          </p>

                          <p className="mt-0.5 hidden text-[11px] text-[var(--muted)] sm:block">
                            Material surplus
                          </p>
                        </div>

                        {/* PRICE */}
                        <div className="rounded-xl bg-[#fafbf8] px-3 py-3 sm:px-4">
                          <p className="text-[11px] text-[var(--muted)]">
                            Harga Satuan
                          </p>

                          <p className="mt-1 text-base font-black text-[var(--green-900)] sm:text-lg">
                            Rp{" "}
                            {Number(
                              transaction.unit_price
                            ).toLocaleString("id-ID")}
                          </p>

                          <p className="mt-0.5 hidden text-[11px] text-[var(--muted)] sm:block">
                            Per unit
                          </p>
                        </div>

                        {/* GROSS */}
                        <div className="rounded-xl bg-[#fafbf8] px-3 py-3 sm:px-4">
                          <p className="text-[11px] text-[var(--muted)]">
                            Nilai Transaksi
                          </p>

                          <p className="mt-1 text-base font-black text-[var(--green-900)] sm:text-lg">
                            Rp{" "}
                            {Number(
                              transaction.gross_amount ?? 0
                            ).toLocaleString("id-ID")}
                          </p>

                          <p className="mt-0.5 hidden text-[11px] text-[var(--muted)] sm:block">
                            Gross amount
                          </p>
                        </div>
                      </div>

                      {/* STATUS FOOTER */}
                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#fafbf8] px-3 py-2.5">
                        {status === "completed" ? (
                          <CheckCircle2
                            size={15}
                            className="shrink-0 text-emerald-600"
                          />
                        ) : status === "in_collection" ? (
                          <Truck
                            size={15}
                            className="shrink-0 text-purple-600"
                          />
                        ) : (
                          <Clock3
                            size={15}
                            className="shrink-0 text-amber-600"
                          />
                        )}

                        <span className="text-xs font-medium text-[var(--muted)]">
                          {status === "pending"
                            ? "Menunggu proses pengambilan"
                            : status === "in_collection"
                            ? "Material sedang dalam proses pengambilan"
                            : status === "completed"
                            ? "Recovery telah selesai"
                            : statusLabels[status] ?? status}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* =====================================================
            NOTE
        ===================================================== */}
        <div className="flex items-start gap-2 pb-4 text-xs text-[var(--muted)]">
          <XCircle
            size={15}
            className="mt-0.5 shrink-0"
          />

          <span>
            Transaksi yang dibatalkan atau refunded tidak
            dapat diproses ke tahap recovery.
          </span>
        </div>
      </main>
    </AppShell>
  );
}
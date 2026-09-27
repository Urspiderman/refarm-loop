"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Package,
  Search,
  Truck,
  XCircle,
} from "lucide-react";

type TransactionStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "in_collection"
  | "completed"
  | "cancelled"
  | "refunded";

type Transaction = {
  id: string;
  date: string;
  surplus: string;
  quantity: number;
  unit: string;
  partner: string;
  recovery: string;
  amount: number;
  status: TransactionStatus;
  payment: string;
};

const filters = [
  "Semua",
  "Pending",
  "Awaiting Payment",
  "Paid",
  "In Collection",
  "Completed",
  "Cancelled",
  "Refunded",
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatStatus(status: TransactionStatus) {
  const labels: Record<TransactionStatus, string> = {
    pending: "Pending",
    awaiting_payment: "Awaiting Payment",
    paid: "Paid",
    in_collection: "In Collection",
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };

  return labels[status];
}

function StatusBadge({
  status,
}: {
  status: TransactionStatus;
}) {
  const config: Record<
    TransactionStatus,
    {
      icon: typeof CheckCircle2;
      className: string;
    }
  > = {
    completed: {
      icon: CheckCircle2,
      className: "bg-[#e8f5dc] text-[#4d7b2f]",
    },
    paid: {
      icon: CheckCircle2,
      className: "bg-[#e8f5dc] text-[#4d7b2f]",
    },
    in_collection: {
      icon: Truck,
      className: "bg-[#eef3d9] text-[#657a32]",
    },
    awaiting_payment: {
      icon: CreditCard,
      className: "bg-[#fff5d8] text-[#92732d]",
    },
    pending: {
      icon: Clock3,
      className: "bg-[#fff5d8] text-[#92732d]",
    },
    cancelled: {
      icon: XCircle,
      className: "bg-[#fbe8e5] text-[#a2574d]",
    },
    refunded: {
      icon: CreditCard,
      className: "bg-[#fbe8e5] text-[#a2574d]",
    },
  };

  const item = config[status];
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${item.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {formatStatus(status)}
    </span>
  );
}

function paymentLabel(status: TransactionStatus) {
  if (status === "paid" || status === "completed") {
    return "Paid";
  }

  if (status === "refunded") {
    return "Refunded";
  }

  return "Waiting";
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Ambil transaction dari API internal.
   *
   * API ini sebaiknya mengembalikan:
   * {
   *   success: true,
   *   transactions: [...]
   * }
   *
   * Jika endpoint belum ada, kita fallback ke query
   * Supabase langsung melalui route yang akan kita buat.
   */
  useMemo(() => {
    let cancelled = false;

    async function loadTransactions() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/transactions", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error || "Gagal mengambil transaction."
          );
        }

        if (!cancelled) {
          setTransactions(result.transactions ?? []);
        }
      } catch (err) {
        console.error("TRANSACTIONS PAGE ERROR:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil transaction."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTransactions();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesFilter =
        activeFilter === "Semua" ||
        formatStatus(transaction.status) === activeFilter;

      const keyword = search.toLowerCase().trim();

      if (!keyword) {
        return matchesFilter;
      }

      const matchesSearch =
        transaction.id.toLowerCase().includes(keyword) ||
        transaction.surplus.toLowerCase().includes(keyword) ||
        transaction.partner.toLowerCase().includes(keyword) ||
        transaction.recovery.toLowerCase().includes(keyword);

      return matchesFilter && matchesSearch;
    });
  }, [transactions, search, activeFilter]);

  const totalValue = transactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );

  const completedCount = transactions.filter(
    (transaction) => transaction.status === "completed"
  ).length;

  const totalKg = transactions.reduce(
    (sum, transaction) => sum + transaction.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-[#f7faf2] px-8 py-8">
      {/* HEADER */}
      <div className="mb-7">
        <h1 className="text-[42px] font-extrabold tracking-tight text-[#101b0d]">
          Transactions
        </h1>

        <p className="mt-1 text-[16px] text-[#60705b]">
          Pantau transaksi surplus dan pembayaran.
        </p>
      </div>

      {/* SUMMARY */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* TOTAL TRANSACTIONS */}
        <div className="rounded-[22px] border border-[#dfe8d5] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#71806a]">
                Total Transactions
              </p>

              <p className="mt-2 text-3xl font-extrabold text-[#1b2816]">
                {transactions.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e9f4d5]">
              <Package className="h-5 w-5 text-[#587f35]" />
            </div>
          </div>
        </div>

        {/* TOTAL VALUE */}
        <div className="rounded-[22px] border border-[#dfe8d5] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#71806a]">
                Total Transaction Value
              </p>

              <p className="mt-2 text-2xl font-extrabold text-[#1b2816]">
                {formatRupiah(totalValue)}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e9f4d5]">
              <CreditCard className="h-5 w-5 text-[#587f35]" />
            </div>
          </div>
        </div>

        {/* COMPLETED */}
        <div className="rounded-[22px] border border-[#dfe8d5] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#71806a]">
                Completed Recovery
              </p>

              <p className="mt-2 text-3xl font-extrabold text-[#1b2816]">
                {completedCount}
              </p>

              <p className="mt-1 text-xs text-[#879181]">
                {totalKg.toLocaleString("id-ID")} kg registered
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e9f4d5]">
              <CheckCircle2 className="h-5 w-5 text-[#587f35]" />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <section className="overflow-hidden rounded-[24px] border border-[#dfe8d5] bg-white shadow-sm">
        {/* TOOLBAR */}
        <div className="border-b border-[#edf1e9] p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            {/* SEARCH */}
            <div className="flex w-full items-center rounded-full border border-[#dce7d0] bg-[#fbfdf9] px-4 py-2.5 xl:max-w-[430px]">
              <Search className="mr-3 h-5 w-5 text-[#71806a]" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari transaksi, surplus, atau partner..."
                className="w-full bg-transparent text-sm text-[#263321] outline-none placeholder:text-[#9aa59a]"
              />
            </div>

            {/* FILTER */}
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    activeFilter === filter
                      ? "bg-[#587f35] text-white"
                      : "bg-[#edf5e1] text-[#4e7136] hover:bg-[#e2efd3]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="m-5 rounded-2xl border border-[#f0c9c4] bg-[#fff5f3] px-5 py-4">
            <p className="text-sm font-semibold text-[#a2574d]">
              Gagal memuat transaction
            </p>

            <p className="mt-1 text-xs text-[#a2574d]">
              {error}
            </p>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#dce7d0] border-t-[#587f35]" />

            <p className="mt-4 text-sm text-[#71806a]">
              Memuat transaction...
            </p>
          </div>
        ) : (
          <>
            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px]">
                <thead>
                  <tr className="border-b border-[#edf1e9] bg-[#fbfdf9]">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#84907f]">
                      Transaction
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#84907f]">
                      Surplus
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#84907f]">
                      Recovery Partner
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#84907f]">
                      Value
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#84907f]">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-[#84907f]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-[#edf1e9] last:border-0 hover:bg-[#fbfdf9]"
                    >
                      {/* TRANSACTION */}
                      <td className="px-6 py-5">
                        <p className="text-sm font-extrabold text-[#263321]">
                          #{transaction.id.slice(0, 8)}
                        </p>

                        <p className="mt-1 text-xs text-[#879181]">
                          {formatDate(transaction.date)}
                        </p>
                      </td>

                      {/* SURPLUS */}
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-[#263321]">
                          {transaction.surplus}
                        </p>

                        <p className="mt-1 text-xs text-[#879181]">
                          {transaction.quantity.toLocaleString(
                            "id-ID"
                          )}{" "}
                          {transaction.unit} ·{" "}
                          {transaction.recovery}
                        </p>
                      </td>

                      {/* PARTNER */}
                      <td className="px-6 py-5">
                        <p className="text-sm font-semibold text-[#32442c]">
                          {transaction.partner}
                        </p>

                        <p className="mt-1 text-xs text-[#879181]">
                          {transaction.payment}
                        </p>
                      </td>

                      {/* VALUE */}
                      <td className="px-6 py-5">
                        <p className="text-sm font-extrabold text-[#263321]">
                          {formatRupiah(transaction.amount)}
                        </p>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-5">
                        <StatusBadge status={transaction.status} />
                      </td>

                      {/* ACTION */}
                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/activity/${transaction.id}`}
                          className="inline-flex items-center gap-1 rounded-full bg-[#f0f6e7] px-3 py-2 text-xs font-bold text-[#507531] transition hover:bg-[#e4efd8]"
                        >
                          Detail
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* EMPTY STATE */}
            {filteredTransactions.length === 0 && (
              <div className="px-6 py-16 text-center">
                <Package className="mx-auto mb-3 h-8 w-8 text-[#63883e]" />

                <h3 className="font-bold text-[#263321]">
                  Transaksi tidak ditemukan
                </h3>

                <p className="mt-1 text-sm text-[#71806a]">
                  {transactions.length === 0
                    ? "Belum ada transaction yang dibuat."
                    : "Coba gunakan kata kunci atau filter yang berbeda."}
                </p>
              </div>
            )}

            {/* FOOTER */}
            <div className="border-t border-[#edf1e9] bg-[#fbfdf9] px-6 py-4">
              <p className="text-xs text-[#879181]">
                Menampilkan {filteredTransactions.length} dari{" "}
                {transactions.length} transaksi
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
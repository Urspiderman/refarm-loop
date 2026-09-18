"use client";

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
  | "Completed"
  | "Processing"
  | "Pending"
  | "Cancelled";

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

const dummyTransactions: Transaction[] = [
  {
    id: "RF-2026-001",
    date: "18 Sep 2026",
    surplus: "Tomat",
    quantity: 250,
    unit: "kg",
    partner: "GreenCycle Compost",
    recovery: "Compost",
    amount: 375000,
    status: "Completed",
    payment: "Paid",
  },
  {
    id: "RF-2026-002",
    date: "17 Sep 2026",
    surplus: "Sayuran Campuran",
    quantity: 180,
    unit: "kg",
    partner: "FeedLoop Farm",
    recovery: "Animal Feed",
    amount: 270000,
    status: "Processing",
    payment: "Waiting",
  },
  {
    id: "RF-2026-003",
    date: "16 Sep 2026",
    surplus: "Cabai",
    quantity: 320,
    unit: "kg",
    partner: "AgroRenew Fertilizer",
    recovery: "Organic Fertilizer",
    amount: 640000,
    status: "Pending",
    payment: "Waiting",
  },
  {
    id: "RF-2026-004",
    date: "15 Sep 2026",
    surplus: "Pisang",
    quantity: 150,
    unit: "kg",
    partner: "FreshCycle Kitchen",
    recovery: "Food Processing",
    amount: 450000,
    status: "Completed",
    payment: "Paid",
  },
  {
    id: "RF-2026-005",
    date: "13 Sep 2026",
    surplus: "Wortel",
    quantity: 275,
    unit: "kg",
    partner: "BioLoop Organics",
    recovery: "Bioconversion",
    amount: 412500,
    status: "Completed",
    payment: "Paid",
  },
  {
    id: "RF-2026-006",
    date: "12 Sep 2026",
    surplus: "Kubis",
    quantity: 210,
    unit: "kg",
    partner: "GreenCycle Compost",
    recovery: "Compost",
    amount: 315000,
    status: "Processing",
    payment: "Waiting",
  },
  {
    id: "RF-2026-007",
    date: "10 Sep 2026",
    surplus: "Jagung",
    quantity: 400,
    unit: "kg",
    partner: "FeedLoop Farm",
    recovery: "Animal Feed",
    amount: 800000,
    status: "Completed",
    payment: "Paid",
  },
  {
    id: "RF-2026-008",
    date: "08 Sep 2026",
    surplus: "Sawi",
    quantity: 125,
    unit: "kg",
    partner: "GreenCycle Compost",
    recovery: "Compost",
    amount: 187500,
    status: "Cancelled",
    payment: "Refunded",
  },
];

const filters = [
  "Semua",
  "Pending",
  "Processing",
  "Completed",
  "Cancelled",
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const config = {
    Completed: {
      icon: CheckCircle2,
      label: "Completed",
      className: "bg-[#e8f5dc] text-[#4d7b2f]",
    },
    Processing: {
      icon: Truck,
      label: "Processing",
      className: "bg-[#eef3d9] text-[#657a32]",
    },
    Pending: {
      icon: Clock3,
      label: "Pending",
      className: "bg-[#fff5d8] text-[#92732d]",
    },
    Cancelled: {
      icon: XCircle,
      label: "Cancelled",
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
      {item.label}
    </span>
  );
}

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");

  const filteredTransactions = useMemo(() => {
    return dummyTransactions.filter((transaction) => {
      const matchesFilter =
        activeFilter === "Semua" ||
        transaction.status === activeFilter;

      const keyword = search.toLowerCase();

      const matchesSearch =
        transaction.id.toLowerCase().includes(keyword) ||
        transaction.surplus.toLowerCase().includes(keyword) ||
        transaction.partner.toLowerCase().includes(keyword) ||
        transaction.recovery.toLowerCase().includes(keyword);

      return matchesFilter && matchesSearch;
    });
  }, [search, activeFilter]);

  const totalValue = dummyTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );

  const completedCount = dummyTransactions.filter(
    (transaction) => transaction.status === "Completed"
  ).length;

  const totalKg = dummyTransactions.reduce(
    (sum, transaction) => sum + transaction.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-[#f7faf2] px-8 py-8">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[42px] font-extrabold tracking-tight text-[#101b0d]">
          Transactions
        </h1>

        <p className="mt-1 text-[16px] text-[#60705b]">
          Pantau transaksi surplus dan pembayaran.
        </p>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[22px] border border-[#dfe8d5] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#71806a]">
                Total Transactions
              </p>

              <p className="mt-2 text-3xl font-extrabold text-[#1b2816]">
                {dummyTransactions.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e9f4d5]">
              <Package className="h-5 w-5 text-[#587f35]" />
            </div>
          </div>
        </div>

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

      {/* Main card */}
      <section className="overflow-hidden rounded-[24px] border border-[#dfe8d5] bg-white shadow-sm">
        {/* Toolbar */}
        <div className="border-b border-[#edf1e9] p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            {/* Search */}
            <div className="flex w-full items-center rounded-full border border-[#dce7d0] bg-[#fbfdf9] px-4 py-2.5 xl:max-w-[430px]">
              <Search className="mr-3 h-5 w-5 text-[#71806a]" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari transaksi, surplus, atau partner..."
                className="w-full bg-transparent text-sm text-[#263321] outline-none placeholder:text-[#9aa59a]"
              />
            </div>

            {/* Filter */}
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

        {/* Table */}
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
                  {/* Transaction */}
                  <td className="px-6 py-5">
                    <p className="text-sm font-extrabold text-[#263321]">
                      #{transaction.id}
                    </p>

                    <p className="mt-1 text-xs text-[#879181]">
                      {transaction.date}
                    </p>
                  </td>

                  {/* Surplus */}
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-[#263321]">
                      {transaction.surplus}
                    </p>

                    <p className="mt-1 text-xs text-[#879181]">
                      {transaction.quantity.toLocaleString("id-ID")}{" "}
                      {transaction.unit} · {transaction.recovery}
                    </p>
                  </td>

                  {/* Partner */}
                  <td className="px-6 py-5">
                    <p className="text-sm font-semibold text-[#32442c]">
                      {transaction.partner}
                    </p>

                    <p className="mt-1 text-xs text-[#879181]">
                      {transaction.payment}
                    </p>
                  </td>

                  {/* Value */}
                  <td className="px-6 py-5">
                    <p className="text-sm font-extrabold text-[#263321]">
                      {formatRupiah(transaction.amount)}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-5">
                    <StatusBadge status={transaction.status} />
                  </td>

                  {/* Action */}
                  <td className="px-6 py-5 text-right">
                    <button className="inline-flex items-center gap-1 rounded-full bg-[#f0f6e7] px-3 py-2 text-xs font-bold text-[#507531] transition hover:bg-[#e4efd8]">
                      Detail
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredTransactions.length === 0 && (
          <div className="px-6 py-16 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-[#63883e]" />

            <h3 className="font-bold text-[#263321]">
              Transaksi tidak ditemukan
            </h3>

            <p className="mt-1 text-sm text-[#71806a]">
              Coba gunakan kata kunci atau filter yang berbeda.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[#edf1e9] bg-[#fbfdf9] px-6 py-4">
          <p className="text-xs text-[#879181]">
            Menampilkan {filteredTransactions.length} dari{" "}
            {dummyTransactions.length} transaksi
          </p>
        </div>
      </section>
    </main>
  );
}
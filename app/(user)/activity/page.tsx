import Link from "next/link";
import {
  Package,
  Handshake,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  CreditCard,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type FilterType = "all" | "surplus" | "matching" | "transaction";

type ActivityItem = {
  id: string;
  type: "surplus" | "matching" | "transaction";
  title: string;
  description: string;
  status: string;
  created_at: string;
  href?: string;
};

export default async function Activity({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;

  const rawFilter = params?.filter;

  const filter: FilterType =
    rawFilter === "surplus" ||
    rawFilter === "matching" ||
    rawFilter === "transaction"
      ? rawFilter
      : "all";

  if (!user) {
    return (
      <div className="page">
        <div className="card p-8 text-center">
          <p className="font-semibold">Silakan login terlebih dahulu.</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // 1. AMBIL SURPLUS MILIK USER
  // =========================================================

  const { data: surplusData, error: surplusError } = await supabase
    .from("surplus_listings")
    .select("id, material_name, quantity, unit, status, created_at")
    .eq("supplier_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (surplusError) {
    console.error("ACTIVITY SURPLUS ERROR:", surplusError);
  }

  const surplus = surplusData ?? [];

  const surplusIds = surplus.map((item) => item.id);

  // =========================================================
  // 2. AMBIL MATCHING
  // =========================================================

  let matches: any[] = [];

  if (surplusIds.length > 0) {
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .select(
        "id, surplus_id, demand_id, score, compatibility_score, quantity_score, distance_score, capacity_score, status, created_at"
      )
      .in("surplus_id", surplusIds)
      .order("created_at", { ascending: false })
      .limit(50);

    if (matchError) {
      console.error("ACTIVITY MATCH ERROR:", matchError);
    }

    matches = matchData ?? [];
  }

  // =========================================================
  // 3. AMBIL TRANSACTIONS MILIK USER
  // =========================================================

  const { data: transactionData, error: transactionError } =
    await supabase
      .from("transactions")
      .select(
        "id, surplus_id, buyer_id, supplier_id, quantity, unit_price, gross_amount, platform_fee, payment_fee, supplier_amount, status, created_at, updated_at, match_id"
      )
      .eq("supplier_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

  if (transactionError) {
    console.error("ACTIVITY TRANSACTION ERROR:", transactionError);
  }

  const transactions = transactionData ?? [];

  // =========================================================
  // 4. BENTUK DATA ACTIVITY
  // =========================================================

  const activities: ActivityItem[] = [];

  // -------------------------
  // SURPLUS
  // -------------------------

  surplus.forEach((item) => {
    activities.push({
      id: `surplus-${item.id}`,
      type: "surplus",
      title: `Surplus ${item.material_name} ditambahkan`,
      description: `${item.quantity} ${item.unit}`,
      status: item.status,
      created_at: item.created_at,
    });
  });

  // -------------------------
  // MATCHING
  // -------------------------

  matches.forEach((match) => {
    const relatedSurplus = surplus.find(
      (item) => item.id === match.surplus_id
    );

    activities.push({
      id: `matching-${match.id}`,
      type: "matching",
      title: relatedSurplus
        ? `Matching untuk ${relatedSurplus.material_name}`
        : "Matching surplus ditemukan",
      description: `Skor kecocokan ${formatScore(match.score)}`,
      status: match.status ?? "proposed",
      created_at: match.created_at,
    });
  });

  // -------------------------
  // TRANSACTION
  // -------------------------

  transactions.forEach((transaction) => {
    const relatedSurplus = surplus.find(
      (item) => item.id === transaction.surplus_id
    );

    activities.push({
      id: `transaction-${transaction.id}`,
      type: "transaction",
      title: relatedSurplus
        ? `Transaction ${relatedSurplus.material_name}`
        : "Transaction surplus",
      description: `${transaction.quantity} unit • ${formatTransactionStatus(
        transaction.status
      )}`,
      status: transaction.status,
      created_at: transaction.created_at,
      href: `/activity/${transaction.id}`,
    });
  });

  // =========================================================
  // 5. FILTER
  // =========================================================

  const filteredActivities =
    filter === "all"
      ? activities
      : activities.filter((item) => item.type === filter);

  // Urutkan terbaru
  filteredActivities.sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
  );

  // =========================================================
  // 6. UI
  // =========================================================

  return (
    <div className="page">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Activity
        </h1>

        <p className="mt-1 text-sm text-[var(--muted)]">
          Pantau semua aktivitas dan perubahan status surplus kamu.
        </p>
      </div>

      {/* FILTER */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        <FilterLink
          href="/activity"
          label="Semua"
          active={filter === "all"}
        />

        <FilterLink
          href="/activity?filter=surplus"
          label="Surplus"
          active={filter === "surplus"}
        />

        <FilterLink
          href="/activity?filter=matching"
          label="Matching"
          active={filter === "matching"}
        />

        <FilterLink
          href="/activity?filter=transaction"
          label="Transaction"
          active={filter === "transaction"}
        />
      </div>

      {/* ACTIVITY LIST */}
      <div className="card mt-5 p-5 md:p-7">
        {filteredActivities.length > 0 ? (
          <div className="space-y-0">
            {filteredActivities.map((item, index) => (
              <ActivityRow
                key={item.id}
                item={item}
                last={index === filteredActivities.length - 1}
              />
            ))}
          </div>
        ) : (
          <EmptyState filter={filter} />
        )}
      </div>
    </div>
  );
}

// =========================================================
// FILTER BUTTON
// =========================================================

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[var(--green-800)] text-white"
          : "bg-[var(--mint)] text-[var(--green-800)] hover:opacity-80"
      }`}
    >
      {label}
    </Link>
  );
}

// =========================================================
// ACTIVITY ROW
// =========================================================

function ActivityRow({
  item,
  last,
}: {
  item: ActivityItem;
  last: boolean;
}) {
  const icon = getActivityIcon(item);

  const content = (
    <div className="flex gap-4">
      {/* ICON */}
      <div className="relative flex shrink-0 flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
          {icon}
        </div>

        {!last && (
          <div className="mt-2 h-full min-h-8 w-px bg-[var(--line)]" />
        )}
      </div>

      {/* CONTENT */}
      <div
        className={`flex-1 ${
          !last ? "border-b border-[var(--line)] pb-5" : "pb-1"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-bold">{item.title}</p>

            <p className="mt-1 text-sm text-[var(--muted)]">
              {item.description}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} />

              <span className="text-xs text-[var(--muted)]">
                {formatDate(item.created_at)}
              </span>
            </div>
          </div>

          {item.href && (
            <ArrowRight
              size={18}
              className="mt-1 shrink-0 text-[var(--muted)]"
            />
          )}
        </div>
      </div>
    </div>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        className="block rounded-xl py-4 transition hover:bg-[var(--mint)]/40"
      >
        {content}
      </Link>
    );
  }

  return <div className="py-4">{content}</div>;
}

// =========================================================
// ICON
// =========================================================

function getActivityIcon(item: ActivityItem) {
  if (item.type === "transaction") {
    if (
      item.status === "completed" ||
      item.status === "paid"
    ) {
      return <CheckCircle2 size={18} />;
    }

    return <CreditCard size={18} />;
  }

  if (item.type === "matching") {
    return <Handshake size={18} />;
  }

  if (
    item.status === "completed" ||
    item.status === "received"
  ) {
    return <CheckCircle2 size={18} />;
  }

  if (
    item.status === "picked_up" ||
    item.status === "scheduled"
  ) {
    return <Truck size={18} />;
  }

  return <Package size={18} />;
}

// =========================================================
// STATUS BADGE
// =========================================================

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full bg-[var(--mint)] px-2.5 py-1 text-xs font-semibold text-[var(--green-800)]">
      {formatStatus(status)}
    </span>
  );
}

// =========================================================
// EMPTY STATE
// =========================================================

function EmptyState({ filter }: { filter: FilterType }) {
  const message =
    filter === "surplus"
      ? "Belum ada aktivitas surplus."
      : filter === "matching"
      ? "Belum ada aktivitas matching."
      : filter === "transaction"
      ? "Belum ada transaction."
      : "Belum ada aktivitas.";

  return (
    <div className="py-12 text-center">
      <Clock
        size={28}
        className="mx-auto text-[var(--green-700)]"
      />

      <p className="mt-3 text-sm font-semibold">
        {message}
      </p>

      <p className="mt-1 text-xs text-[var(--muted)]">
        Aktivitas baru akan muncul di sini.
      </p>
    </div>
  );
}

// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

// =========================================================
// FORMAT SCORE
// =========================================================

function formatScore(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return "-";
  }

  return `${Math.round(Number(score))}%`;
}

// =========================================================
// FORMAT STATUS
// =========================================================

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    listed: "Listed",
    matched: "Matched",
    accepted: "Accepted",
    scheduled: "Scheduled",
    picked_up: "Picked Up",
    received: "Received",
    completed: "Completed",
    rejected: "Rejected",
    cancelled: "Cancelled",

    proposed: "Proposed",
    pending: "Pending",
    awaiting_payment: "Awaiting Payment",
    paid: "Paid",
    in_collection: "In Collection",
    refunded: "Refunded",
  };

  return (
    labels[status] ??
    status.replaceAll("_", " ")
  );
}

// =========================================================
// TRANSACTION STATUS
// =========================================================

function formatTransactionStatus(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    awaiting_payment: "Awaiting Payment",
    paid: "Paid",
    in_collection: "In Collection",
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };

  return (
    labels[status] ??
    status.replaceAll("_", " ")
  );
}
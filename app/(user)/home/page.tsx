import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Package,
  Search,
  Receipt,
  Truck,
  Recycle,
  Heart,
  ArrowRight,
  Leaf,
} from "lucide-react";

export default async function Home() {
  const s = await createClient();

  const {
    data: { user },
  } = await s.auth.getUser();

  const { count } = user
    ? await s
        .from("surplus_listings")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("supplier_id", user.id)
    : { count: 0 };

  return (
    <div className="px-5 py-8 md:px-8 md:py-10">
      {/* Header */}
      <div className="mb-7 flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">
            Selamat datang
          </p>

          <h1 className="mt-1 text-4xl font-black tracking-tight">
            {user?.user_metadata?.full_name || "User"}
          </h1>

          <p className="mt-2 text-base text-[var(--muted)]">
            Kelola surplus dan kembalikan material ke dalam siklus.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          label="Surplus Saya"
          value={count || 0}
        />

        <Stat
          label="Transaksi Aktif"
          value={0}
        />

        <Stat
          label="Material Recovered"
          value="0 kg"
        />

        <Stat
          label="Impact"
          value={0}
        />
      </div>

      {/* ReFarm Loop Banner */}
      <div className="card mt-7 overflow-hidden bg-[var(--mint)] p-6 md:p-7">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--green-800)]">
            <Leaf size={28} />
          </div>

          <div>
            <h2 className="text-xl font-black">
              ReFarm Loop
            </h2>

            <p className="mt-1 text-sm text-[var(--green-900)]">
              Connecting surplus with recovery partners for a circular future.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <section className="mt-7">
        <h2 className="mb-4 text-xl font-black">
          Quick Access
        </h2>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            ["/surplus", "Surplus Saya", Package],
            ["/discover", "Cari Mitra", Search],
            ["/activity", "Transaksi", Receipt],
            ["/discover", "Collector", Truck],
            ["/discover", "Recovery", Recycle],
            ["/activity", "Impact", Heart],
          ].map(([href, label, Icon]: any) => (
            <Link
              href={href}
              key={label}
              className="card flex min-h-28 flex-col items-center justify-center gap-2 hover:bg-[var(--mint-2)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
                <Icon size={19} />
              </span>

              <span className="text-xs font-bold">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Add Surplus */}
      <Link
        href="/surplus/new"
        className="btn-primary mt-7 w-full md:w-auto"
      >
        + Tambah Surplus
        <ArrowRight size={17} />
      </Link>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: any;
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
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  Compass,
  Activity,
  User,
  Bot,
  Receipt,
  Truck,
  Recycle,
  Leaf,
} from "lucide-react";

const supplier = [
  ["/home", "Beranda", Home],
  ["/surplus", "Surplus Saya", Package],
  ["/discover", "Cari Mitra", Compass],
  ["/transactions", "Transaksi", Receipt],
  ["/activity", "Aktivitas", Activity],
  ["/profile", "Profil", User],
] as const;

const partner = [
  ["/partner/home", "Beranda", Home],
  ["/partner/demands", "Permintaan Material", Package],
  ["/partner/incoming", "Pasokan Masuk", Truck],
  ["/partner/recovery", "Pemulihan", Recycle],
  ["/partner/transactions", "Transaksi", Receipt],
  ["/partner/profile", "Profil", User],
] as const;

const collector = [
  ["/collector/dashboard", "Dashboard", Home],
  ["/collector/pickups", "Tugas Pengambilan", Truck],
  ["/collector/route", "Rute", Compass],
  ["/collector/history", "Riwayat", Activity],
  ["/profile", "Profil", User],
] as const;

export default function AppShell({
  children,
  role = "supplier_farmer",
}: {
  children: React.ReactNode;
  role?: string;
}) {
  const path = usePathname();

  const items =
    role === "recovery_partner"
      ? partner
      : role === "collector"
        ? collector
        : supplier;

  return (
    <div className="min-h-screen bg-[var(--bg)] lg:flex">

      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[270px] shrink-0 bg-[#203a18] px-5 py-7 text-white lg:flex lg:flex-col">

        {/* ===================================================
            LOGO
        =================================================== */}

        <div className="mb-10 flex items-center gap-3 text-[25px] font-black">
          <Leaf size={28} />
          <span>ReFarm Loop</span>
        </div>

        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <nav className="space-y-1.5">

          {items.map(
            ([href, label, Icon]) => {

              const isActive =
                path === href ||
                path.startsWith(`${href}/`);

              return (
                <Link
                  href={href}
                  key={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-white/15"
                      : "hover:bg-white/10"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            }
          )}

        </nav>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="min-w-0 flex-1 pb-24 lg:ml-[270px] lg:pb-8">
        <div className="w-full min-w-0">
          {children}
        </div>
      </main>

      {/* =====================================================
          REFARM AI FLOATING BUTTON
      ===================================================== */}

      <Link
        href="/ai"
        aria-label="ReFarm AI"
        className="fixed bottom-20 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--green-800)] text-white shadow-xl transition hover:bg-[var(--green-900)] lg:bottom-8 lg:right-8"
      >
        <Bot size={22} />
      </Link>

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
      ===================================================== */}

      <nav
        className="fixed bottom-0 left-0 right-0 z-20 grid border-t border-[var(--line)] bg-white/95 backdrop-blur lg:hidden"
        style={{
          gridTemplateColumns: `repeat(${Math.min(
            items.length,
            5
          )}, 1fr)`,
        }}
      >

        {items
          .slice(0, 5)
          .map(
            ([href, label, Icon]) => {

              const isActive =
                path === href ||
                path.startsWith(`${href}/`);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-1 py-2 text-[9px] font-semibold transition ${
                    isActive
                      ? "text-[var(--green-800)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </Link>
              );
            }
          )}

      </nav>

    </div>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Network,
  Boxes,
  Truck,
  BrainCircuit,
  HeartPulse,
  Users,
  Handshake,
  Receipt,
  Bot,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const items = [
  ["/admin/overview", "Overview", LayoutDashboard, "/admin/overview"],
  ["/admin/network", "Network", Network, "/admin/network"],
  ["/admin/material-flow", "Material Flow", Boxes, "/admin/material-flow"],
  ["/admin/operations", "Operations", Truck, "/admin/operations"],
  ["/admin/transactions", "Transactions", Receipt, "/admin/transactions"],
  ["/admin/ai-monitor", "AI Monitor", BrainCircuit, "/admin/ai-monitor"],
  ["/admin/users", "Users", Users, "/admin/users"],
  ["/admin/partner/dashboard", "Partners", Handshake, "/admin/partner"],
  ["/admin/impact", "Impact", HeartPulse, "/admin/impact"],
] as const;

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  async function out() {
    await createClient().auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#f5f7f2]">
      <aside className="fixed inset-y-0 left-0 hidden w-[270px] bg-[#203a18] px-5 py-7 text-white lg:block">
        <div className="mb-10 px-3 text-xl font-black">
          ReFarm Loop{" "}
          <span className="text-xs font-medium opacity-60">
            CONTROL TOWER
          </span>
        </div>

        <nav className="space-y-1">
          {items.map(([href, label, Icon, activePath]) => {
            const isActive = pathname.startsWith(activePath);

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
          })}
        </nav>

        <Link
          href="/ai"
          className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold opacity-80 hover:bg-white/10"
        >
          <Bot size={18} />
          ReFarm AI
        </Link>

        <button
          type="button"
          onClick={out}
          className="mt-8 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold opacity-80 hover:bg-white/10"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="min-h-screen lg:ml-[270px]">
        {children}
      </main>
    </div>
  );
}
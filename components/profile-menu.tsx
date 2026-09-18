"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UserRound,
  ShieldCheck,
  Bell,
  HelpCircle,
  Info,
  ChevronRight,
  LogOut,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

type ProfileMenuProps = {
  role: string;
  organizationName?: string | null;
};

const items = [
  {
    icon: UserRound,
    label: "Edit Profile",
  },
  {
    icon: ShieldCheck,
    label: "Keamanan Akun",
  },
  {
    icon: Bell,
    label: "Notifikasi",
  },
  {
    icon: HelpCircle,
    label: "Bantuan & FAQ",
  },
  {
    icon: Info,
    label: "Tentang ReFarm Loop",
  },
];

function formatRole(role: string) {
  const labels: Record<string, string> = {
    supplier_farmer: "Supplier Farmer",
    supplier_market: "Supplier Market",
    recovery_partner: "Recovery Partner",
    collector: "Collector",
    admin: "Administrator",
  };

  return labels[role] || role.replaceAll("_", " ");
}

export default function ProfileMenu({
  role,
  organizationName,
}: ProfileMenuProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      setLoading(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="mt-7 space-y-3">
      {/* PROFILE OPTIONS */}
      {items.map(({ icon: Icon, label }) => (
        <button
          key={label}
          type="button"
          className="card flex w-full items-center gap-4 p-4 text-left transition hover:bg-black/[0.02]"
        >
          <Icon size={19} />

          <span className="flex-1 text-sm font-bold">
            {label}
          </span>

          <ChevronRight
            size={18}
            className="text-[var(--muted)]"
          />
        </button>
      ))}

      {/* ROLE */}
      <div className="card mt-6 p-4">
        <p className="text-xs text-[var(--muted)]">
          Role
        </p>

        <p className="mt-1 font-bold">
          {formatRole(role)}
        </p>

        {organizationName && (
          <div className="mt-3 border-t border-black/5 pt-3">
            <p className="text-xs text-[var(--muted)]">
              Organization
            </p>

            <p className="mt-1 font-bold">
              {organizationName}
            </p>
          </div>
        )}
      </div>

      {/* LOGOUT */}
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className="flex w-full items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-left text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2
            size={19}
            className="animate-spin"
          />
        ) : (
          <LogOut size={19} />
        )}

        <span className="flex-1 text-sm font-bold">
          {loading ? "Keluar..." : "Logout"}
        </span>

        {loading && (
          <span className="text-xs font-medium">
            Memproses
          </span>
        )}
      </button>
    </div>
  );
}
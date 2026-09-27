import { requireRole } from "@/lib/auth";
import AppShell from "@/components/app-shell";
import ProfileMenu from "@/components/profile-menu";
import AdminShell from "@/components/admin-shell";
import {
  UserRound,
  ShieldCheck,
} from "lucide-react";

export default async function Profile() {
  const {
    user,
    profile,
    role,
  } = await requireRole([
    "supplier_farmer",
    "supplier_market",
    "recovery_partner",
    "collector",
    "admin",
  ]);

  const content = (
    <div className="page">

      {/* =====================================================
          PROFILE HEADER
      ===================================================== */}

      <div className="flex items-center gap-4">

        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-800)]">
          <UserRound size={28} />
        </div>

        <div>
          <h1>
            {profile?.full_name ||
              user.email ||
              "User"}
          </h1>

          <p>
            {user.email}
          </p>
        </div>

      </div>

      {/* =====================================================
          ROLE
      ===================================================== */}

      <div className="card mt-6 p-5">

        <div className="flex items-center gap-3">

          <ShieldCheck className="text-[var(--green-800)]" />

          <div>

            <p className="text-xs text-[var(--muted)]">
              Role
            </p>

            <p className="font-black capitalize">
              {role.replaceAll("_", " ")}
            </p>

          </div>

        </div>

      </div>

      {/* =====================================================
          PROFILE MENU
      ===================================================== */}

      <ProfileMenu role={role} />

    </div>
  );

  if (role === "admin") {
    return (
      <AdminShell>
        {content}
      </AdminShell>
    );
  }

  return (
    <AppShell role={role}>
      {content}
    </AppShell>
  );
}
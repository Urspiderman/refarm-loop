import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/roles";

export async function getSessionContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      profile: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    supabase,
    user,
    profile,
  };
}

export async function requireRole(roles: Role[]) {
  const context = await getSessionContext();

  if (!context.user) {
    redirect("/login");
  }

  const role = context.profile?.role as Role | undefined;

  if (!role || !roles.includes(role)) {
    redirect("/home");
  }

  return {
    ...context,
    role,
  };
}
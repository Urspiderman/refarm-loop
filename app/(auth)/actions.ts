"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/roles";

type AuthState = {
  error: string;
  success: string;
};

export async function authenticate(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const mode = String(formData.get("mode") ?? "login");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(
    formData.get("role") ?? "supplier_farmer"
  );

  if (!email || !password) {
    return {
      error: "Email dan password wajib diisi.",
      success: "",
    };
  }

  // =========================================================
  // LOGIN
  // =========================================================

  if (mode === "login") {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      return {
        error: error.message,
        success: "",
      };
    }

    const user = data.user;

    if (!user) {
      return {
        error: "User tidak ditemukan setelah proses login.",
        success: "",
      };
    }

    // =======================================================
    // GET ROLE FROM PROFILES
    // =======================================================

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || !profile?.role) {
      console.error(
        "Login profile role error:",
        profileError
      );

      await supabase.auth.signOut();

      return {
        error:
          "Role akun tidak ditemukan. Pastikan profile user sudah dibuat di database.",
        success: "",
      };
    }

    // =======================================================
    // REDIRECT BASED ON ROLE
    // =======================================================

    revalidatePath("/", "layout");

    redirect(roleHome(profile.role));
  }

  // =========================================================
  // REGISTER
  // =========================================================

  if (mode === "register") {
    if (!name) {
      return {
        error: "Nama wajib diisi.",
        success: "",
      };
    }

    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role,
          },
        },
      });

    if (error) {
      return {
        error: error.message,
        success: "",
      };
    }

    // =======================================================
    // EMAIL VERIFICATION
    // =======================================================

    if (!data.session) {
      return {
        error: "",
        success:
          "Pendaftaran berhasil. Silakan cek email untuk verifikasi jika diminta.",
      };
    }

    const user = data.user;

    if (!user) {
      return {
        error:
          "User tidak ditemukan setelah proses pendaftaran.",
        success: "",
      };
    }

    // =======================================================
    // GET ROLE FROM PROFILES
    // =======================================================

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || !profile?.role) {
      console.error(
        "Register profile role error:",
        profileError
      );

      await supabase.auth.signOut();

      return {
        error:
          "Akun berhasil dibuat, tetapi role profile belum ditemukan. Pastikan trigger profile sudah aktif di database.",
        success: "",
      };
    }

    revalidatePath("/", "layout");

    redirect(roleHome(profile.role));
  }

  return {
    error: "Mode autentikasi tidak valid.",
    success: "",
  };
}
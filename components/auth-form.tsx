"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { roleHome } from "@/lib/roles";

type AuthFormProps = {
  mode: "login" | "register";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("supplier_farmer");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({
              email,
              password,
            })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: name,
                  role,
                },
              },
            });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      // Register berhasil tetapi Supabase meminta verifikasi email.
      if (mode === "register" && !result.data.session) {
        setError(
          "Pendaftaran berhasil. Silakan cek email untuk verifikasi jika diminta."
        );
        return;
      }

      const user = result.data.user;

      if (!user) {
        setError("User tidak ditemukan setelah proses autentikasi.");
        return;
      }

      // Ambil role asli dari tabel profiles.
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.role) {
        console.error("Profile role error:", profileError);

        setError(
          "Role akun tidak ditemukan. Pastikan profile user sudah dibuat di database."
        );
        return;
      }

      // Redirect berdasarkan role yang tersimpan di database.
      router.push(roleHome(profile.role));
      router.refresh();
    } catch (err) {
      console.error("Auth error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="card w-full max-w-md p-7"
    >
      <div className="mb-7">
        <div className="text-2xl font-black text-[var(--green-900)]">
          ReFarm Loop
        </div>

        <p className="mt-1 text-sm text-[var(--muted)]">
          {mode === "login"
            ? "Masuk ke akun Anda"
            : "Buat akun baru"}
        </p>
      </div>

      {mode === "register" && (
        <>
          <label
            htmlFor="name"
            className="text-sm font-semibold"
          >
            Nama
          </label>

          <input
            id="name"
            type="text"
            className="input mb-4 mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />

          <label
            htmlFor="role"
            className="text-sm font-semibold"
          >
            Role
          </label>

          <select
            id="role"
            className="input mb-4 mt-1"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="supplier_farmer">
              Farmer
            </option>

            <option value="supplier_market">
              Market / Trader
            </option>

            <option value="recovery_partner">
              Recovery Partner
            </option>

            <option value="collector">
              Collector
            </option>
          </select>
        </>
      )}

      <label
        htmlFor="email"
        className="text-sm font-semibold"
      >
        Email
      </label>

      <input
        id="email"
        type="email"
        className="input mb-4 mt-1"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <label
        htmlFor="password"
        className="text-sm font-semibold"
      >
        Password
      </label>

      <input
        id="password"
        type="password"
        className="input mb-5 mt-1"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        autoComplete={
          mode === "login"
            ? "current-password"
            : "new-password"
        }
      />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={loading}
      >
        {loading
          ? "Memproses..."
          : mode === "login"
            ? "Masuk"
            : "Daftar"}
      </button>

      <a
        href={mode === "login" ? "/register" : "/login"}
        className="mt-4 block text-center text-sm text-[var(--green-700)]"
      >
        {mode === "login"
          ? "Belum punya akun? Daftar"
          : "Sudah punya akun? Masuk"}
      </a>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { authenticate } from "@/app/(auth)/actions";

type AuthFormProps = {
  mode: "login" | "register";
};

const initialState = {
  error: "",
  success: "",
};

export default function AuthForm({
  mode,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(
    authenticate,
    initialState
  );

  return (
    <form
      action={formAction}
      className="card w-full max-w-md p-7"
    >
      <input
        type="hidden"
        name="mode"
        value={mode}
      />

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

      {/* =====================================================
          REGISTER FIELDS
      ===================================================== */}

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
            name="name"
            type="text"
            className="input mb-4 mt-1"
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
            name="role"
            className="input mb-4 mt-1"
            defaultValue="supplier_farmer"
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

      {/* =====================================================
          EMAIL
      ===================================================== */}

      <label
        htmlFor="email"
        className="text-sm font-semibold"
      >
        Email
      </label>

      <input
        id="email"
        name="email"
        type="email"
        className="input mb-4 mt-1"
        required
        autoComplete="email"
      />

      {/* =====================================================
          PASSWORD
      ===================================================== */}

      <label
        htmlFor="password"
        className="text-sm font-semibold"
      >
        Password
      </label>

      <input
        id="password"
        name="password"
        type="password"
        className="input mb-5 mt-1"
        required
        minLength={8}
        autoComplete={
          mode === "login"
            ? "current-password"
            : "new-password"
        }
      />

      {/* =====================================================
          ERROR
      ===================================================== */}

      {state.error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {state.success && (
        <p className="mb-4 rounded-lg bg-[var(--mint)] p-3 text-sm text-[var(--green-900)]">
          {state.success}
        </p>
      )}

      {/* =====================================================
          SUBMIT
      ===================================================== */}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={pending}
      >
        {pending
          ? "Memproses..."
          : mode === "login"
            ? "Masuk"
            : "Daftar"}
      </button>

      {/* =====================================================
          SWITCH AUTH MODE
      ===================================================== */}

      <a
        href={
          mode === "login"
            ? "/register"
            : "/login"
        }
        className="mt-4 block text-center text-sm text-[var(--green-700)]"
      >
        {mode === "login"
          ? "Belum punya akun? Daftar"
          : "Sudah punya akun? Masuk"}
      </a>
    </form>
  );
}
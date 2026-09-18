import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // =========================================================
  // GET AUTHENTICATED USER
  // =========================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // =========================================================
  // PUBLIC ROUTES
  // =========================================================

  const publicPath =
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/api/");

  // User belum login dan mencoba halaman private
  if (!user && !publicPath) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  // User belum login tetapi mengakses halaman public
  if (!user) {
    return response;
  }

  // =========================================================
  // GET ROLE FROM public.profiles
  // =========================================================
  // public.profiles adalah sumber role utama.
  // Jangan gunakan user.user_metadata.role sebagai fallback.

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Profile tidak ditemukan
  if (profileError || !profile?.role) {
    console.error("RBAC: profile/role tidak ditemukan", {
      userId: user.id,
      error: profileError,
    });

    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  const role = profile.role;

  // =========================================================
  // DETERMINE ROLE HOME
  // =========================================================

  let home = "/home";

  switch (role) {
    case "admin":
      home = "/admin/overview";
      break;

    case "recovery_partner":
      home = "/partners";
      break;

    case "collector":
      home = "/collector/dashboard";
      break;

    case "supplier_farmer":
    case "supplier_market":
      home = "/home";
      break;

    default:
      console.error("RBAC: role tidak valid", {
        userId: user.id,
        role,
      });

      return NextResponse.redirect(
        new URL("/login", request.url)
      );
  }

  // =========================================================
  // LOGIN / REGISTER
  // =========================================================

  if (path === "/login" || path === "/register") {
    return NextResponse.redirect(
      new URL(home, request.url)
    );
  }

  // =========================================================
  // ADMIN ONLY
  // =========================================================

  if (path.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(
      new URL(home, request.url)
    );
  }

  // =========================================================
  // RECOVERY PARTNER ONLY
  // =========================================================

  if (
    path.startsWith("/partners") &&
    role !== "recovery_partner"
  ) {
    return NextResponse.redirect(
      new URL(home, request.url)
    );
  }

  // =========================================================
  // COLLECTOR ONLY
  // =========================================================

  if (
    path.startsWith("/collector") &&
    role !== "collector"
  ) {
    return NextResponse.redirect(
      new URL(home, request.url)
    );
  }

  // =========================================================
  // SUPPLIER ONLY
  // =========================================================

  const supplierOnlyPaths =
    path.startsWith("/surplus") ||
    path.startsWith("/discover") ||
    path.startsWith("/transactions") ||
    path.startsWith("/activity");

  if (
    supplierOnlyPaths &&
    role !== "supplier_farmer" &&
    role !== "supplier_market"
  ) {
    return NextResponse.redirect(
      new URL(home, request.url)
    );
  }

  // =========================================================
  // ALL CHECKS PASSED
  // =========================================================

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
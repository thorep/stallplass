// src/middleware.ts
import { updateSession } from "@/utils/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Create a supabase client using the same cookie logic
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => request.cookies.get(key)?.value,
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // Add routes that need to be protected here.
  // Note: /dashboard and /mine-hester handle auth in their page components to show landing pages
  const protectedPaths = ["/dashboard2", "/meldinger", "/profil"];

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Redirect unauthenticated users from protected routes to login with return URL
  if (isProtected && !session) {
    const loginUrl = new URL("/logg-inn", request.url);
    // Store the original URL they were trying to access
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/signup pages
  if ((pathname === "/logg-inn" || pathname === "/registrer") && session) {
    // Check if there's a return URL to redirect to
    const returnUrl = request.nextUrl.searchParams.get("returnUrl");
    if (returnUrl && returnUrl.startsWith("/")) {
      const destinationUrl = new URL(returnUrl, request.url);
      return NextResponse.redirect(destinationUrl);
    }
    // Default redirect to dashboard
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Run middleware for all routes except static/image assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

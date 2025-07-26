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
  const protectedPaths = ["/dashboard"];

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Redirect unauthenticated users from protected routes to login
  if (isProtected && !session) {
    const loginUrl = new URL("/logg-inn", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login page to dashboard
  if (pathname === "/logg-inn" && session) {
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

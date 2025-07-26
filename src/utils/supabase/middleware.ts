/**
 * 🚨 CRITICAL AUTH FILE - DO NOT MODIFY WITHOUT EXPLICIT PERMISSION 🚨
 *
 * This file implements the official Supabase middleware pattern for session management.
 * Changes to this file WILL break authentication state across the entire application.
 *
 * ❌ DO NOT:
 * - Change the updateSession function signature
 * - Modify the cookie handling logic (get, set, remove)
 * - Remove the supabase.auth.getUser() call
 * - Change the NextResponse handling
 *
 * ✅ ONLY MODIFY IF:
 * - User explicitly asks to update authentication system
 * - Following official Supabase documentation updates
 * - With explicit approval and testing
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieOptions = {
  name: string;
  value: string;
  domain?: string;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  secure?: boolean;
  sameSite?: boolean | "lax" | "strict" | "none";
};

export const updateSession = async (request: NextRequest) => {
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
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Partial<CookieOptions>) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: Partial<CookieOptions>) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // This will refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: { user },
  } = await supabase.auth.getUser();

  return response;
};

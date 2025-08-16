import { createClient } from "@/utils/supabase/server";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

/**
 * Official Supabase server-side authentication utilities
 * Based on: https://supabase.com/docs/guides/auth/server-side/nextjs
 */

/**
 * Get the current authenticated user on the server
 * Returns null if not authenticated - follows official Supabase pattern
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Require authentication on a server component/page
 * Redirects to login if not authenticated
 * Returns the authenticated user
 */
export async function requireAuth(currentPath?: string): Promise<User> {
  const user = await getUser();
  console.log("USer12312123:", user);
  if (!user) {
    console.log("Redirect");
    const loginUrl = currentPath
      ? `/logg-inn?returnUrl=${encodeURIComponent(currentPath)}`
      : "/logg-inn";
    redirect(loginUrl);
  }

  return user;
}

/**
 * Check if the current user is an admin
 */
export async function isUserAdmin(userId?: string): Promise<boolean> {
  try {
    const { prisma } = await import("@/services/prisma");
    const profileId = userId || (await getUser())?.id;

    if (!profileId) {
      return false;
    }

    const profile = await prisma.profiles.findUnique({
      where: { id: profileId },
      select: { isAdmin: true },
    });

    return profile?.isAdmin || false;
  } catch {
    return false;
  }
}

/**
 * Require admin authentication on a server component/page
 * Redirects to login if not authenticated, throws error if not admin
 */
export async function requireAdminAuth(): Promise<User> {
  const user = await requireAuth();
  const isAdmin = await isUserAdmin(user.id);

  if (!isAdmin) {
    throw new Error("Admin access required");
  }

  return user;
}

/**
 * Require email verification on a server component/page
 * Redirects to login if not authenticated
 * Redirects to email verification page if email not confirmed
 * Returns the authenticated and verified user
 */
export async function requireVerifiedEmail(currentPath?: string): Promise<User> {
  const user = await getUser();

  if (!user) {
    const loginUrl = currentPath
      ? `/logg-inn?returnUrl=${encodeURIComponent(currentPath)}`
      : "/logg-inn";
    redirect(loginUrl);
  }

  // Check if email is verified
  if (!user.email_confirmed_at) {
    redirect("/verifiser-epost");
  }

  return user;
}

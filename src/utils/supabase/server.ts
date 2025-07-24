/**
 * 🚨 CRITICAL AUTH FILE - DO NOT MODIFY WITHOUT EXPLICIT PERMISSION 🚨
 * 
 * This file implements the official Supabase server client pattern for Next.js App Router.
 * Changes to this file WILL break server-side authentication, login actions, and API routes.
 * 
 * ❌ DO NOT:
 * - Change the import path from '@supabase/ssr'
 * - Modify the createServerClient function
 * - Change the cookies.getAll() or cookies.setAll() implementation
 * - Remove the try/catch block in setAll
 * - Change the export signature
 * 
 * ✅ ONLY MODIFY IF:
 * - User explicitly asks to update authentication system
 * - Following official Supabase documentation updates
 * - With explicit approval and testing
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
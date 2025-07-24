/**
 * 🚨 CRITICAL AUTH FILE - DO NOT MODIFY WITHOUT EXPLICIT PERMISSION 🚨
 * 
 * This file implements the official Supabase browser client pattern.
 * Changes to this file WILL break authentication across the entire app.
 * 
 * ❌ DO NOT:
 * - Change the import path from '@supabase/ssr'
 * - Modify the createBrowserClient function
 * - Add additional configuration unless explicitly requested
 * - Change the export signature
 * 
 * ✅ ONLY MODIFY IF:
 * - User explicitly asks to update authentication system
 * - Following official Supabase documentation updates
 * - With explicit approval and testing
 */
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
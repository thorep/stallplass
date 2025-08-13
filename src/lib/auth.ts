/**
 * Clean authentication helper using Supabase's official cookie-based auth pattern
 * Follows https://supabase.com/docs/guides/auth/server-side/nextjs
 * This replaces the old bearer token middleware pattern
 */

import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

/**
 * Get authenticated user from cookies (server-side)
 * Uses official Supabase pattern - calls getUser() which validates with Supabase servers
 * Returns null if not authenticated
 */
export async function getAuthUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

/**
 * Require authentication for an API route
 * Returns the authenticated user or sends 401 response
 */
export async function requireAuth(): Promise<User | NextResponse> {
  const user = await getAuthUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  return user;
}

/**
 * Require admin authentication for an API route
 * Returns the authenticated admin user or sends appropriate error response
 */
export async function requireAdmin(): Promise<User | NextResponse> {
  const user = await getAuthUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Check if user is admin in profiles table
  const { prisma } = await import('@/services/prisma');
  const profile = await prisma.profiles.findUnique({
    where: { id: user.id },
    select: { isAdmin: true }
  });
  
  if (!profile?.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }
  
  return user;
}

/**
 * Require email verification for an API route
 * Returns the authenticated user with verified email or sends appropriate error response
 */
export async function requireVerifiedEmail(): Promise<User | NextResponse> {
  const user = await getAuthUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: 'Email verification required' },
      { status: 403 }
    );
  }
  
  return user;
}

/**
 * Get profile data for authenticated user
 * Combines Supabase auth user with profiles table data
 */
export async function getAuthProfile() {
  const user = await getAuthUser();
  
  if (!user) {
    return null;
  }
  
  const { prisma } = await import('@/services/prisma');
  const profile = await prisma.profiles.findUnique({
    where: { id: user.id }
  });
  
  return profile;
}

/**
 * Check if current user is admin (without requiring auth)
 * Useful for conditional UI rendering
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getAuthUser();
  
  if (!user) {
    return false;
  }
  
  const { prisma } = await import('@/services/prisma');
  const profile = await prisma.profiles.findUnique({
    where: { id: user.id },
    select: { isAdmin: true }
  });
  
  return profile?.isAdmin || false;
}
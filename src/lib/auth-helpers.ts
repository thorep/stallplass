// Auth helper functions using Supabase
import { createClient } from '@/lib/supabase/server';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    role?: string;
  };
}

/**
 * Get authenticated user from request
 * Returns user with standard id field (not firebaseId)
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    
    // Get the session from the request
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      return null;
    }

    return {
      id: session.user.id, // This is the Supabase user ID, now used as our main user ID
      email: session.user.email || '',
      user_metadata: session.user.user_metadata
    };
  } catch (_) {
    return null;
  }
}

/**
 * Require authentication and return user
 * Throws error if user is not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Check if user has admin role
 */
export async function isAdmin(user: AuthUser): Promise<boolean> {
  return user.user_metadata?.role === 'admin';
}

/**
 * Require admin access
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  
  if (!await isAdmin(user)) {
    throw new Error('Admin access required');
  }
  
  return user;
}
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Server-side Supabase client with service role key
// This bypasses Row Level Security - use with caution!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for server-side client')
}

export const supabaseServer = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to validate user permissions before using server client
export async function validateUserPermission(
  userId: string,
  operation: string,
  resourceId?: string
): Promise<boolean> {
  // Add your permission validation logic here
  // Example: Check if user is admin, owns the resource, etc.
  
  // For now, just log the operation for debugging
  console.log(`Server operation: ${operation} by user ${userId} on resource ${resourceId}`)
  
  // TODO: Implement actual permission checks based on your business logic
  return true
}

// Helper function for admin operations
export async function performAdminOperation<T>(
  operation: () => Promise<T>,
  adminUserId: string,
  operationName: string
): Promise<T> {
  // Validate admin permissions
  const isAdmin = await validateUserPermission(adminUserId, `admin:${operationName}`)
  
  if (!isAdmin) {
    throw new Error('Insufficient permissions for admin operation')
  }
  
  return await operation()
}

// Example server-side operations
export const serverOperations = {
  // Admin user management
  async getAllUsers() {
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getAllUsersWithCounts() {
    // Get users
    const { data: usersData, error: usersError } = await supabaseServer
      .from('users')
      .select(`
        id,
        email,
        name,
        phone,
        is_admin,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    // Get counts for each user
    const usersWithCounts = await Promise.all(
      usersData.map(async (user) => {
        // Count stables
        const { count: stablesCount, error: stablesError } = await supabaseServer
          .from('stables')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id);

        if (stablesError) throw stablesError;

        // Count rentals
        const { count: rentalsCount, error: rentalsError } = await supabaseServer
          .from('rentals')
          .select('*', { count: 'exact', head: true })
          .eq('rider_id', user.id);

        if (rentalsError) throw rentalsError;

        return {
          ...user,
          _count: {
            stables: stablesCount || 0,
            rentals: rentalsCount || 0
          }
        };
      })
    );

    return usersWithCounts;
  },

  async updateUserAdminStatus(userId: string, isAdmin: boolean) {
    const { data, error } = await supabaseServer
      .from('users')
      .update({ is_admin: isAdmin })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Admin payment operations
  async getPaymentHistory(stableId?: string) {
    let query = supabaseServer
      .from('payments')
      .select(`
        *,
        user:users (name, email),
        stable:stables (name)
      `)
      .order('created_at', { ascending: false })
    
    if (stableId) {
      query = query.eq('stable_id', stableId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  // System operations
  async cleanupOldSessions() {
    // Example: Clean up old sessions or temporary data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { error } = await supabaseServer
      .from('page_views')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
    
    if (error) throw error
  },

  // Analytics operations
  async getStableAnalytics(stableId: string) {
    const { data, error } = await supabaseServer
      .from('page_views')
      .select('*')
      .eq('entity_type', 'STABLE')
      .eq('entity_id', stableId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
    
    if (error) throw error
    return data
  }
}

// Re-export types for convenience
export type { Database } from '@/types/supabase'
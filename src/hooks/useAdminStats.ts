import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Admin statistics interface
export interface AdminStats {
  totalUsers: number;
  adminUsers: number;
  stableOwners: number;
  totalStables: number;
  featuredStables: number;
  advertisingStables: number;
  totalBoxes: number;
  availableBoxes: number;
  activeBoxes: number;
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalRevenue: number;
  lastUpdated: string;
}

// Detailed admin statistics interface
export interface AdminStatsDetailed {
  users: {
    total: number;
    admins: number;
    stableOwners: number;
    recentRegistrations: number; // Last 24h
  };
  stables: {
    total: number;
    featured: number;
    advertising: number;
    recentlyAdded: number; // Last 24h
  };
  boxes: {
    total: number;
    available: number;
    active: number;
    recentlyAdded: number; // Last 24h
  };
  payments: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
    totalRevenue: number;
    recentPayments: number; // Last 24h
    recentRevenue: number; // Last 24h
  };
  activity: {
    activeConversations: number;
    newMessagesToday: number;
    stableViews24h: number;
  };
}

interface UseAdminStatsOptions {
  enableRealtime?: boolean;
  refreshInterval?: number; // milliseconds
}

// Main admin statistics hook
export function useAdminStats(options: UseAdminStatsOptions = {}) {
  const { enableRealtime = true, refreshInterval = 30000 } = options;
  const [stats, setStats] = useState<AdminStatsDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const channelRef = useRef<RealtimeChannel[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch comprehensive admin statistics
  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      
      // Get current timestamp for "recent" calculations (24h ago)
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      const yesterdayISO = yesterday.toISOString();

      // Fetch all data in parallel
      const [
        usersResult,
        stablesResult,
        boxesResult,
        paymentsResult,
        conversationsResult,
        messagesResult,
        viewsResult
      ] = await Promise.allSettled([
        // User data
        supabase
          .from('users')
          .select('is_admin, created_at')
          .order('created_at', { ascending: false }),
        
        // Stable data
        supabase
          .from('stables')
          .select('featured, advertising_active, created_at, owner_id')
          .order('created_at', { ascending: false }),
        
        // Box data
        supabase
          .from('boxes')
          .select('is_available, is_active, created_at')
          .order('created_at', { ascending: false }),
        
        // Payment data
        supabase
          .from('payments')
          .select('status, total_amount, created_at')
          .order('created_at', { ascending: false }),
        
        // Active conversations
        supabase
          .from('conversations')
          .select('id, updated_at')
          .gte('updated_at', yesterdayISO),
        
        // Recent messages
        supabase
          .from('messages')
          .select('id, created_at')
          .gte('created_at', yesterdayISO),
        
        // Recent views - placeholder since table doesn't exist yet
        Promise.resolve({ data: [], error: null })
      ]);

      // Process results with error handling
      const users = usersResult.status === 'fulfilled' ? usersResult.value.data || [] : [];
      const stables = stablesResult.status === 'fulfilled' ? stablesResult.value.data || [] : [];
      const boxes = boxesResult.status === 'fulfilled' ? boxesResult.value.data || [] : [];
      const payments = paymentsResult.status === 'fulfilled' ? paymentsResult.value.data || [] : [];
      const conversations = conversationsResult.status === 'fulfilled' ? conversationsResult.value.data || [] : [];
      const messages = messagesResult.status === 'fulfilled' ? messagesResult.value.data || [] : [];
      const views = viewsResult.status === 'fulfilled' ? viewsResult.value.data || [] : [];

      // Calculate statistics
      const stableOwnerIds = new Set(stables.map(stable => stable.owner_id));
      
      const adminStatsDetailed: AdminStatsDetailed = {
        users: {
          total: users.length,
          admins: users.filter(user => user.is_admin).length,
          stableOwners: stableOwnerIds.size,
          recentRegistrations: users.filter(user => 
            new Date(user.created_at || '') >= yesterday
          ).length
        },
        stables: {
          total: stables.length,
          featured: stables.filter(stable => stable.featured).length,
          advertising: stables.filter(stable => stable.advertising_active).length,
          recentlyAdded: stables.filter(stable => 
            new Date(stable.created_at || '') >= yesterday
          ).length
        },
        boxes: {
          total: boxes.length,
          available: boxes.filter(box => box.is_available).length,
          active: boxes.filter(box => box.is_active).length,
          recentlyAdded: boxes.filter(box => 
            new Date(box.created_at || '') >= yesterday
          ).length
        },
        payments: {
          total: payments.length,
          completed: payments.filter(payment => payment.status === 'COMPLETED').length,
          pending: payments.filter(payment => 
            payment.status === 'PENDING' || payment.status === 'PROCESSING'
          ).length,
          failed: payments.filter(payment => payment.status === 'FAILED').length,
          totalRevenue: payments
            .filter(payment => payment.status === 'COMPLETED')
            .reduce((sum, payment) => sum + (payment.total_amount || 0), 0),
          recentPayments: payments.filter(payment => 
            new Date(payment.created_at || '') >= yesterday
          ).length,
          recentRevenue: payments
            .filter(payment => 
              payment.status === 'COMPLETED' && 
              new Date(payment.created_at || '') >= yesterday
            )
            .reduce((sum, payment) => sum + (payment.total_amount || 0), 0)
        },
        activity: {
          activeConversations: conversations.length,
          newMessagesToday: messages.length,
          stableViews24h: views.length
        }
      };

      setStats(adminStatsDetailed);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('Error fetching admin statistics:', err);
      setError(err instanceof Error ? err.message : 'Could not fetch admin statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!enableRealtime) return;

    const setupRealtimeSubscriptions = () => {
      // Subscribe to all relevant tables for live updates
      const tables = ['users', 'stables', 'boxes', 'payments', 'conversations', 'messages'];
      
      tables.forEach(tableName => {
        const channel = supabase
          .channel(`admin-stats-${tableName}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: tableName
            },
            () => {
              // Debounce updates to avoid too many API calls
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              timeoutRef.current = setTimeout(fetchStats, 1000);
            }
          )
          .subscribe();

        channelRef.current.push(channel);
      });
    };

    setupRealtimeSubscriptions();

    return () => {
      // Clean up subscriptions
      channelRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelRef.current = [];
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enableRealtime, fetchStats]);

  // Initial loading and periodic updates
  useEffect(() => {
    fetchStats();

    // Set up periodic updates as fallback
    if (refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStats, refreshInterval]);

  // Manual refresh function
  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchStats();
  }, [fetchStats]);

  // Convert to simplified AdminStats format for backward compatibility
  const simplifiedStats = stats ? {
    totalUsers: stats.users.total,
    adminUsers: stats.users.admins,
    stableOwners: stats.users.stableOwners,
    totalStables: stats.stables.total,
    featuredStables: stats.stables.featured,
    advertisingStables: stats.stables.advertising,
    totalBoxes: stats.boxes.total,
    availableBoxes: stats.boxes.available,
    activeBoxes: stats.boxes.active,
    totalPayments: stats.payments.total,
    completedPayments: stats.payments.completed,
    pendingPayments: stats.payments.pending,
    failedPayments: stats.payments.failed,
    totalRevenue: stats.payments.totalRevenue,
    lastUpdated: lastUpdated?.toISOString() || new Date().toISOString()
  } as AdminStats : null;

  return {
    stats,
    simplifiedStats,
    isLoading,
    error,
    lastUpdated,
    refresh,
    clearError: () => setError(null)
  };
}
'use client';

import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  fallback?: ReactNode;
}

/**
 * Client-side route protection wrapper
 * Use this for client components that need authentication
 */
export default function ProtectedRoute({ 
  children, 
  adminOnly = false, 
  fallback 
}: ProtectedRouteProps) {
  const { user, loading } = useSupabaseUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login with return URL
      const loginUrl = `/logg-inn?returnUrl=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
    }
  }, [user, loading, router, pathname]);

  // Show loading state
  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )
    );
  }

  // User not authenticated
  if (!user) {
    return null; // Will redirect in useEffect
  }

  // TODO: Add admin check if adminOnly is true
  // This would require adding isAdmin to the user context or fetching it
  if (adminOnly) {
    // Admin-only protection not yet implemented in ProtectedRoute
  }

  return <>{children}</>;
}

/**
 * Higher-order component version for easier usage
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { adminOnly?: boolean }
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute adminOnly={options?.adminOnly}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
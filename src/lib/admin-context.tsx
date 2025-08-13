'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './supabase-auth-context';

interface AdminContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children, isAdmin }: { children: ReactNode; isAdmin: boolean }) {
  const { user } = useAuth();

  return (
    <AdminContext.Provider value={{ isAuthenticated: !!user, isAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
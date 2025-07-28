'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './supabase-auth-context';

interface AdminContextType {
  getAuthToken: () => Promise<string | null>;
  isAdmin: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children, isAdmin }: { children: ReactNode; isAdmin: boolean }) {
  const { user, getIdToken } = useAuth();

  const getAuthToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const token = await getIdToken();
      return token;
    } catch (_) {
      return null;
    }
  };

  return (
    <AdminContext.Provider value={{ getAuthToken, isAdmin }}>
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
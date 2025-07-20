'use client';

import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import PaymentHistoryClient from './payment-history-client';
import { Payment } from '@/types';

interface PaymentWithRelations extends Payment {
  stable: {
    name: string;
  };
}

export default function PaymentHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentWithRelations[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      
      try {
        setPaymentsLoading(true);
        const token = await user.getIdToken();
        const response = await fetch('/api/payments/history', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setPayments(data);
        }
      } catch (error) {
        console.error('Error fetching payment history:', error);
      } finally {
        setPaymentsLoading(false);
      }
    };

    if (!loading && !user) {
      router.push('/logg-inn');
      return;
    }

    if (user) {
      fetchPayments();
    }
  }, [user, loading, router]);

  if (loading || paymentsLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-500">Laster...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Betalingshistorikk</h1>
        <PaymentHistoryClient payments={payments} />
      </main>
      <Footer />
    </div>
  );
}
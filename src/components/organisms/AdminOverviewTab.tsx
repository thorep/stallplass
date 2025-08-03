'use client';

import { 
  UsersIcon,
  HomeModernIcon,
  CubeIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { AdminStatsCard } from '@/components/molecules/AdminStatsCard';
import { AdminStatGroup } from '@/components/molecules/AdminStatGroup';
import { AdminCleanupControls } from '@/components/molecules/AdminCleanupControls';
import { AdminProfile, AdminStable, AdminBox, AdminInvoiceRequest } from '@/types/admin';
import { useAdminProfileStats, useAdminStableStats, useAdminBoxStats, useAdminPaymentStats } from '@/hooks/useAdminQueries';

interface AdminOverviewTabProps {
  profiles: AdminProfile[];
  stables: AdminStable[];
  boxes: AdminBox[];
  payments: AdminInvoiceRequest[];
  liveStats?: {
    profiles: {
      total: number;
      recentRegistrations: number;
    };
    stables: {
      total: number;
      recentlyAdded: number;
    };
    boxes: {
      total: number;
      available: number;
    };
    payments: {
      total: number;
      totalRevenue: number;
    };
  };
}

export function AdminOverviewTab({ 
  profiles, 
  stables, 
  boxes, 
  payments, 
  liveStats 
}: AdminOverviewTabProps) {
  const { data: profileStats, isLoading: profileStatsLoading } = useAdminProfileStats();
  const { data: stableStats, isLoading: stableStatsLoading } = useAdminStableStats();
  const { data: boxStats, isLoading: boxStatsLoading } = useAdminBoxStats();
  const { data: paymentStats, isLoading: paymentStatsLoading } = useAdminPaymentStats();
  
  return (
    <div className="space-y-6">
      {/* Quick Stats with Live Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatsCard
          icon={<UsersIcon className="h-8 w-8 text-purple-600" />}
          title="Profiler"
          value={profileStats?.total ?? liveStats?.profiles.total ?? profiles.length}
          subtitle={
            profileStatsLoading 
              ? "Laster..." 
              : profileStats?.newToday 
                ? `+${profileStats.newToday} i dag`
                : (liveStats?.profiles.recentRegistrations ?? 0) > 0 
                  ? `+${liveStats?.profiles.recentRegistrations} i dag`
                  : undefined
          }
          subtitleColor="green"
        />
        
        <AdminStatsCard
          icon={<HomeModernIcon className="h-8 w-8 text-green-600" />}
          title="Staller"
          value={stableStats?.total ?? liveStats?.stables.total ?? stables.length}
          subtitle={
            stableStatsLoading 
              ? "Laster..." 
              : stableStats?.newToday 
                ? `+${stableStats.newToday} i dag`
                : (liveStats?.stables.recentlyAdded ?? 0) > 0 
                  ? `+${liveStats?.stables.recentlyAdded} i dag`
                  : undefined
          }
          subtitleColor="green"
        />
        
        <AdminStatsCard
          icon={<CubeIcon className="h-8 w-8 text-blue-600" />}
          title="Bokser"
          value={boxStats?.total ?? liveStats?.boxes.total ?? boxes.length}
          subtitle={
            boxStatsLoading 
              ? "Laster..." 
              : boxStats?.newToday 
                ? `+${boxStats.newToday} i dag`
                : `${liveStats?.boxes.available ?? boxes.filter(box => box.isAvailable).length} ledige`
          }
        />
        
        <AdminStatsCard
          icon={<CreditCardIcon className="h-8 w-8 text-amber-600" />}
          title="Betalinger"
          value={paymentStats?.paymentsToday ?? liveStats?.payments.total ?? 0}
          subtitle={
            paymentStatsLoading 
              ? "Laster..." 
              : paymentStats 
                ? `${paymentStats.paymentsThisMonth} denne måneden`
                : `${(liveStats?.payments.totalRevenue ?? 0).toLocaleString('nb-NO')} kr`
          }
          subtitleColor="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminStatGroup 
          title="Profilstatistikk"
          stats={[
            {
              label: 'Totalt antall profiler:',
              value: profileStats?.total ?? profiles.length
            },
            {
              label: 'Nye i dag:',
              value: profileStats?.newToday ?? 0
            },
            {
              label: 'Admin profiler:',
              value: profiles.filter((profile: AdminProfile) => profile.isAdmin).length
            },
            {
              label: 'Stall eiere:',
              value: profiles.filter((profile: AdminProfile) => profile._count.stables > 0).length
            }
          ]}
        />

        <AdminStatGroup 
          title="Stall & Boks statistikk"
          stats={[
            {
              label: 'Totalt antall staller:',
              value: stableStats?.total ?? stables.length
            },
            {
              label: 'Nye staller i dag:',
              value: stableStats?.newToday ?? 0
            },
            {
              label: 'Totalt antall bokser:',
              value: boxStats?.total ?? boxes.length
            },
            {
              label: 'Nye bokser i dag:',
              value: boxStats?.newToday ?? 0
            },
            {
              label: 'Ledige bokser:',
              value: boxes.filter((box: AdminBox) => box.isAvailable).length
            },
            {
              label: 'Annonserende stables:',
              value: stables.filter((stable: AdminStable) => stable.advertisingActive).length
            }
          ]}
        />

        <AdminStatGroup 
          title="Betalingsstatistikk"
          stats={[
            {
              label: 'Fullførte betalinger:',
              value: payments.filter((payment: AdminInvoiceRequest) => payment.status === 'PAID').length
            },
            {
              label: 'Ventende betalinger:',
              value: payments.filter((payment: AdminInvoiceRequest) => 
                payment.status === 'PENDING' || payment.status === 'INVOICE_SENT'
              ).length
            },
            {
              label: 'Feilede betalinger:',
              value: payments.filter((payment: AdminInvoiceRequest) => payment.status === 'CANCELLED').length
            }
          ]}
        />
      </div>

      {/* Manual Cleanup Section */}
      <AdminCleanupControls />
    </div>
  );
}
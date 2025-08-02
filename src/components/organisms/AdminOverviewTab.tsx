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
  return (
    <div className="space-y-6">
      {/* Quick Stats with Live Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatsCard
          icon={<UsersIcon className="h-8 w-8 text-purple-600" />}
          title="Profiler"
          value={liveStats?.profiles.total ?? profiles.length}
          subtitle={
            (liveStats?.profiles.recentRegistrations ?? 0) > 0 
              ? `+${liveStats?.profiles.recentRegistrations} i dag`
              : undefined
          }
          subtitleColor="green"
        />
        
        <AdminStatsCard
          icon={<HomeModernIcon className="h-8 w-8 text-green-600" />}
          title="Staller"
          value={liveStats?.stables.total ?? stables.length}
          subtitle={
            (liveStats?.stables.recentlyAdded ?? 0) > 0 
              ? `+${liveStats?.stables.recentlyAdded} i dag`
              : undefined
          }
          subtitleColor="green"
        />
        
        <AdminStatsCard
          icon={<CubeIcon className="h-8 w-8 text-blue-600" />}
          title="Bokser"
          value={liveStats?.boxes.total ?? boxes.length}
          subtitle={`${liveStats?.boxes.available ?? boxes.filter(box => box.isAvailable).length} ledige`}
        />
        
        <AdminStatsCard
          icon={<CreditCardIcon className="h-8 w-8 text-amber-600" />}
          title="Betalinger"
          value={liveStats?.payments.total ?? payments.length}
          subtitle={`${(liveStats?.payments.totalRevenue ?? 0).toLocaleString('nb-NO')} kr`}
          subtitleColor="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminStatGroup 
          title="Profilstatistikk"
          stats={[
            {
              label: 'Totalt antall profiler:',
              value: profiles.length
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
              label: 'Ledige bokser:',
              value: boxes.filter((box: AdminBox) => box.isAvailable).length
            },
            {
              label: 'Annonserende stables:',
              value: stables.filter((stable: AdminStable) => stable.advertisingActive).length
            }
            // {
            //   label: 'Fremhevede stables:',
            //   value: stables.filter((stable: AdminStable) => stable.featured).length
            // }
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
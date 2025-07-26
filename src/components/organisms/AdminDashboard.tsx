'use client';

import { useState } from 'react';
import { RoadmapItem, BasePrice, PricingDiscount, StableAmenity, BoxAmenity } from '@/types';
import { AdminUser, AdminStable, AdminBox, AdminPayment } from '@/types/admin';
import { AdminStatsDetailed } from '@/hooks/useAdminStats';
import { 
  Cog6ToothIcon, 
  MapIcon, 
  CurrencyDollarIcon, 
  BuildingOfficeIcon,
  UsersIcon,
  HomeModernIcon,
  CubeIcon,
  CreditCardIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { RoadmapAdmin } from './RoadmapAdmin';
import { AmenitiesAdmin } from './AmenitiesAdmin';
import { PricingAdmin } from './PricingAdmin';
import { UsersAdmin } from './UsersAdmin';
import { StablesAdmin } from './StablesAdmin';
import { BoxesAdmin } from './BoxesAdmin';
import { PaymentsAdmin } from './PaymentsAdmin';
import { AdminOverviewTab } from './AdminOverviewTab';
import { useAdminStats } from '@/hooks/useAdminStats';
import { usePaymentTracking, usePaymentStats } from '@/hooks/usePaymentTracking';
import { LiveStatsGrid } from '@/components/molecules/LiveStatsGrid';
import { PaymentTrackingDashboard } from '@/components/molecules/PaymentTrackingDashboard';

interface AdminDashboardProps {
  initialData: {
    roadmapItems: RoadmapItem[];
    basePrice: BasePrice;
    discounts: PricingDiscount[];
    stableAmenities: StableAmenity[];
    boxAmenities: BoxAmenity[];
    users: AdminUser[];
    stables: AdminStable[];
    boxes: AdminBox[];
    payments: AdminPayment[];
  };
}

type AdminTab = 'overview' | 'live-stats' | 'payment-tracking' | 'roadmap' | 'amenities' | 'pricing' | 'users' | 'stables' | 'boxes' | 'payments';

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Real-time hooks
  const statsQuery = useAdminStats();
  const liveStats = statsQuery.data;
  const statsLoading = statsQuery.isLoading;
  const statsError = statsQuery.error;

  const paymentsQuery = usePaymentStats();
  const paymentStats = paymentsQuery.data;
  const paymentsLoading = paymentsQuery.isLoading;

  const tabs = [
    { id: 'overview', label: 'Oversikt', icon: Cog6ToothIcon },
    { id: 'live-stats', label: 'Live Statistikk', icon: ChartBarIcon },
    { id: 'payment-tracking', label: 'Betalingssporing', icon: CreditCardIcon },
    { id: 'users', label: 'Brukere', icon: UsersIcon },
    { id: 'stables', label: 'Staller', icon: HomeModernIcon },
    { id: 'boxes', label: 'Bokser', icon: CubeIcon },
    { id: 'payments', label: 'Betalinger', icon: CreditCardIcon },
    { id: 'roadmap', label: 'Roadmap', icon: MapIcon },
    { id: 'amenities', label: 'Fasiliteter', icon: BuildingOfficeIcon },
    { id: 'pricing', label: 'Priser', icon: CurrencyDollarIcon },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <AdminOverviewTab 
            users={initialData.users}
            stables={initialData.stables}
            boxes={initialData.boxes}
            payments={initialData.payments}
            liveStats={liveStats ?? null}
          />
        );
      
      case 'live-stats':
        return (
          <LiveStatsGrid
            stats={liveStats ?? null}
            isLoading={statsLoading}
            lastUpdated={null}
            error={statsError?.message ?? null}
          />
        );
      
      case 'payment-tracking':
        return (
          <PaymentTrackingDashboard
            paymentStats={paymentStats ?? null}
            isLoading={paymentsLoading}
            onRefresh={() => paymentsQuery.refetch()}
          />
        );
      
      case 'roadmap':
        return <RoadmapAdmin initialItems={initialData.roadmapItems} />;
      
      case 'amenities':
        return (
          <AmenitiesAdmin 
            initialStableAmenities={initialData.stableAmenities}
            initialBoxAmenities={initialData.boxAmenities}
          />
        );
      
      case 'pricing':
        return (
          <PricingAdmin 
            initialBasePrice={initialData.basePrice}
            initialDiscounts={initialData.discounts}
          />
        );
      
      case 'users':
        return <UsersAdmin initialUsers={initialData.users} />;
      
      case 'stables':
        return <StablesAdmin initialStables={initialData.stables} />;
      
      case 'boxes':
        return <BoxesAdmin initialBoxes={initialData.boxes} />;
      
      case 'payments':
        return <PaymentsAdmin initialPayments={initialData.payments} />;
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-slate-600">
                Administrer roadmap, fasiliteter og priser for Stallplass.
              </p>
            </div>
            
            {/* Live Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600">Live</span>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const hasActivity = tab.id === 'live-stats' && (liveStats?.users.newThisMonth ?? 0) > 0;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as AdminTab)}
                    className={`relative flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                    
                    {/* Activity Indicators */}
                    {hasActivity && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { RoadmapItem, BasePrice, PricingDiscount, StableAmenity, BoxAmenity } from '@/types';
import { 
  Cog6ToothIcon, 
  MapIcon, 
  CurrencyDollarIcon, 
  BuildingOfficeIcon,
  UsersIcon,
  HomeModernIcon,
  CubeIcon,
  CreditCardIcon,
  TrashIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { RoadmapAdmin } from './RoadmapAdmin';
import { AmenitiesAdmin } from './AmenitiesAdmin';
import { PricingAdmin } from './PricingAdmin';
import { UsersAdmin } from './UsersAdmin';
import { StablesAdmin } from './StablesAdmin';
import { BoxesAdmin } from './BoxesAdmin';
import { PaymentsAdmin } from './PaymentsAdmin';
import { useAuth } from '@/lib/supabase-auth-context';
import { useAdminStats } from '@/hooks/useAdminStats';
import { usePaymentTracking } from '@/hooks/usePaymentTracking';
import { LiveStatsGrid } from '@/components/molecules/LiveStatsGrid';
import { PaymentTrackingDashboard } from '@/components/molecules/PaymentTrackingDashboard';

interface AdminUser {
  id: string;
  firebaseId: string;
  email: string;
  name: string | null;
  phone: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    stables: number;
    rentals: number;
  };
}

interface AdminStable {
  id: string;
  name: string;
  location: string;
  city: string | null;
  featured: boolean;
  advertisingActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  owner: {
    id: string;
    email: string;
    name: string | null;
  };
  _count: {
    boxes: number;
    conversations: number;
    rentals: number;
  };
}

interface AdminBox {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  isActive: boolean;
  size: number | null;
  isIndoor: boolean;
  hasWindow: boolean;
  createdAt: string;
  stable: {
    id: string;
    name: string;
    owner: {
      email: string;
      name: string | null;
    };
  };
  _count: {
    conversations: number;
    rentals: number;
  };
}

interface AdminPayment {
  id: string;
  amount: number;
  months: number;
  discount: number;
  totalAmount: number;
  vippsOrderId: string;
  vippsReference: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  paymentMethod: 'VIPPS' | 'CARD';
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  createdAt: string;
  user: {
    id: string;
    firebaseId: string;
    email: string;
    name: string | null;
  };
  stable: {
    id: string;
    name: string;
    owner: {
      email: string;
      name: string | null;
    };
  };
}

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
  const { user, getIdToken } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{
    expiredStables: number;
    deactivatedBoxes: number;
    expiredSponsoredBoxes: number;
    timestamp: string;
  } | null>(null);

  // Real-time hooks
  const {
    stats: liveStats,
    isLoading: statsLoading,
    error: statsError,
    lastUpdated: statsLastUpdated
  } = useAdminStats({
    enableRealtime: true,
    refreshInterval: 30000 // 30 seconds
  });

  const {
    paymentStats,
    isLoading: paymentsLoading,
    refresh: refreshPayments
  } = usePaymentTracking({
    enableRealtime: true,
    maxRecentActivity: 20,
    trackingTimeWindow: 24
  });


  const handleManualCleanup = async () => {
    if (!user) return;
    
    setCleanupLoading(true);
    try {
      const token = await getIdToken();
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCleanupResult(data.results);
      } else {
        alert('Feil ved opprydding. Prøv igjen.');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      alert('Feil ved opprydding. Prøv igjen.');
    } finally {
      setCleanupLoading(false);
    }
  };

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
          <div className="space-y-6">
            {/* Quick Stats with Live Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center">
                  <UsersIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Brukere</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {liveStats?.users.total ?? initialData.users.length}
                    </p>
                    {(liveStats?.users.recentRegistrations ?? 0) > 0 && (
                      <p className="text-xs text-green-600">
                        +{liveStats?.users.recentRegistrations} i dag
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center">
                  <HomeModernIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Staller</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {liveStats?.stables.total ?? initialData.stables.length}
                    </p>
                    {(liveStats?.stables.recentlyAdded ?? 0) > 0 && (
                      <p className="text-xs text-green-600">
                        +{liveStats?.stables.recentlyAdded} i dag
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center">
                  <CubeIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Bokser</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {liveStats?.boxes.total ?? initialData.boxes.length}
                    </p>
                    <p className="text-xs text-slate-600">
                      {liveStats?.boxes.available ?? initialData.boxes.filter(box => box.isAvailable).length} ledige
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center">
                  <CreditCardIcon className="h-8 w-8 text-amber-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Betalinger</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {liveStats?.payments.total ?? initialData.payments.length}
                    </p>
                    <p className="text-xs text-green-600">
                      {(liveStats?.payments.totalRevenue ?? 0).toLocaleString('nb-NO')} kr
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Brukerstatistikk</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Totalt antall brukere:</span>
                    <span className="font-medium">{initialData.users.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Admin brukere:</span>
                    <span className="font-medium">
                      {initialData.users.filter((user: AdminUser) => user.isAdmin).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Stall eiere:</span>
                    <span className="font-medium">
                      {initialData.users.filter((user: AdminUser) => user._count.stables > 0).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Stall & Boks statistikk</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ledige bokser:</span>
                    <span className="font-medium">
                      {initialData.boxes.filter((box: AdminBox) => box.isAvailable).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Annonserende staller:</span>
                    <span className="font-medium">
                      {initialData.stables.filter((stable: AdminStable) => stable.advertisingActive).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fremhevede staller:</span>
                    <span className="font-medium">
                      {initialData.stables.filter((stable: AdminStable) => stable.featured).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Betalingsstatistikk</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fullførte betalinger:</span>
                    <span className="font-medium">
                      {initialData.payments.filter((payment: AdminPayment) => payment.status === 'COMPLETED').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ventende betalinger:</span>
                    <span className="font-medium">
                      {initialData.payments.filter((payment: AdminPayment) => payment.status === 'PENDING' || payment.status === 'PROCESSING').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Feilede betalinger:</span>
                    <span className="font-medium">
                      {initialData.payments.filter((payment: AdminPayment) => payment.status === 'FAILED').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Cleanup Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-slate-900">Manuell opprydding</h3>
                  <p className="text-sm text-slate-600">
                    Fjern utløpt annonsering og betalt plassering manuelt
                  </p>
                </div>
                <button
                  onClick={handleManualCleanup}
                  disabled={cleanupLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>{cleanupLoading ? 'Rydder opp...' : 'Kjør opprydding'}</span>
                </button>
              </div>
              
              {cleanupResult && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Opprydding fullført</h4>
                  <div className="space-y-1 text-sm text-green-800">
                    <div>• {cleanupResult.expiredStables} staller med utløpt annonsering deaktivert</div>
                    <div>• {cleanupResult.deactivatedBoxes} bokser deaktivert</div>
                    <div>• {cleanupResult.expiredSponsoredBoxes} utløpte betalte plasseringer fjernet</div>
                    <div className="text-xs text-green-600 mt-2">
                      Utført: {new Date(cleanupResult.timestamp).toLocaleString('nb-NO')}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Hva gjør oppryddingen:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Deaktiverer staller som har utløpt annonsering</li>
                    <li>Deaktiverer bokser som tilhører staller med utløpt annonsering</li>
                    <li>Fjerner betalt plassering som har utløpt</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'live-stats':
        return (
          <LiveStatsGrid
            stats={liveStats}
            isLoading={statsLoading}
            lastUpdated={statsLastUpdated}
            error={statsError}
          />
        );
      
      case 'payment-tracking':
        return (
          <PaymentTrackingDashboard
            paymentStats={paymentStats}
            isLoading={paymentsLoading}
            onRefresh={refreshPayments}
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
                const hasActivity = tab.id === 'live-stats' && (liveStats?.users.recentRegistrations ?? 0) > 0;
                
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
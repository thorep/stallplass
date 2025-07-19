'use client';

import { useState } from 'react';
import { RoadmapItem, BasePrice, PricingDiscount, StableAmenity, BoxAmenity } from '@prisma/client';
import { 
  Cog6ToothIcon, 
  MapIcon, 
  CurrencyDollarIcon, 
  BuildingOfficeIcon,
  UsersIcon,
  HomeModernIcon,
  CubeIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { RoadmapAdmin } from './RoadmapAdmin';
import { AmenitiesAdmin } from './AmenitiesAdmin';
import { PricingAdmin } from './PricingAdmin';
import { UsersAdmin } from './UsersAdmin';
import { StablesAdmin } from './StablesAdmin';
import { BoxesAdmin } from './BoxesAdmin';
import { PaymentsAdmin } from './PaymentsAdmin';

interface User {
  id: string;
  isAdmin: boolean;
  _count: {
    stables: number;
  };
}

interface Stable {
  featured: boolean;
}

interface Box {
  isAvailable: boolean;
  isActive: boolean;
}

interface Payment {
  status: string;
}

interface AdminDashboardProps {
  initialData: {
    roadmapItems: RoadmapItem[];
    basePrice: BasePrice;
    discounts: PricingDiscount[];
    stableAmenities: StableAmenity[];
    boxAmenities: BoxAmenity[];
    users: User[];
    stables: Stable[];
    boxes: Box[];
    payments: Payment[];
  };
}

type AdminTab = 'overview' | 'roadmap' | 'amenities' | 'pricing' | 'users' | 'stables' | 'boxes' | 'payments';

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const tabs = [
    { id: 'overview', label: 'Oversikt', icon: Cog6ToothIcon },
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center">
                  <UsersIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Brukere</p>
                    <p className="text-2xl font-bold text-slate-900">{initialData.users.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center">
                  <HomeModernIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Staller</p>
                    <p className="text-2xl font-bold text-slate-900">{initialData.stables.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center">
                  <CubeIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Bokser</p>
                    <p className="text-2xl font-bold text-slate-900">{initialData.boxes.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center">
                  <CreditCardIcon className="h-8 w-8 text-amber-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Totale betalinger</p>
                    <p className="text-2xl font-bold text-slate-900">{initialData.payments.length}</p>
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
                      {initialData.users.filter((user: User) => user.isAdmin).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Stall eiere:</span>
                    <span className="font-medium">
                      {initialData.users.filter((user: User) => user._count.stables > 0).length}
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
                      {initialData.boxes.filter((box: Box) => box.isAvailable).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Aktive bokser:</span>
                    <span className="font-medium">
                      {initialData.boxes.filter((box: Box) => box.isActive).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fremhevede staller:</span>
                    <span className="font-medium">
                      {initialData.stables.filter((stable: Stable) => stable.featured).length}
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
                      {initialData.payments.filter((payment: Payment) => payment.status === 'COMPLETED').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ventende betalinger:</span>
                    <span className="font-medium">
                      {initialData.payments.filter((payment: Payment) => payment.status === 'PENDING' || payment.status === 'PROCESSING').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Feilede betalinger:</span>
                    <span className="font-medium">
                      {initialData.payments.filter((payment: Payment) => payment.status === 'FAILED').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-slate-600">
            Administrer roadmap, fasiliteter og priser for Stallplass.
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as AdminTab)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
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
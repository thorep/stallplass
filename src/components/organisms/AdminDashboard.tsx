'use client';

import { useState } from 'react';
import { RoadmapItem, BasePrice, PricingDiscount, StableAmenity, BoxAmenity } from '@prisma/client';
import { 
  Cog6ToothIcon, 
  MapIcon, 
  CurrencyDollarIcon, 
  BuildingOfficeIcon,
  ArchiveBoxIcon 
} from '@heroicons/react/24/outline';
import { RoadmapAdmin } from './RoadmapAdmin';
import { AmenitiesAdmin } from './AmenitiesAdmin';
import { PricingAdmin } from './PricingAdmin';

interface AdminDashboardProps {
  initialData: {
    roadmapItems: RoadmapItem[];
    basePrice: BasePrice;
    discounts: PricingDiscount[];
    stableAmenities: StableAmenity[];
    boxAmenities: BoxAmenity[];
  };
}

type AdminTab = 'overview' | 'roadmap' | 'amenities' | 'pricing';

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const tabs = [
    { id: 'overview', label: 'Oversikt', icon: Cog6ToothIcon },
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
                  <MapIcon className="h-8 w-8 text-indigo-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Roadmap elementer</p>
                    <p className="text-2xl font-bold text-slate-900">{initialData.roadmapItems.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Stall fasiliteter</p>
                    <p className="text-2xl font-bold text-slate-900">{initialData.stableAmenities.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center">
                  <ArchiveBoxIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Boks fasiliteter</p>
                    <p className="text-2xl font-bold text-slate-900">{initialData.boxAmenities.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-amber-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Grunnpris</p>
                    <p className="text-2xl font-bold text-slate-900">{initialData.basePrice.price} kr</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Hurtig oversikt</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Aktive roadmap elementer:</span>
                  <span className="font-medium">
                    {initialData.roadmapItems.filter(item => item.status === 'PLANNED' || item.status === 'IN_PROGRESS').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Fullførte roadmap elementer:</span>
                  <span className="font-medium">
                    {initialData.roadmapItems.filter(item => item.status === 'COMPLETED').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Aktive rabatter:</span>
                  <span className="font-medium">
                    {initialData.discounts.filter(discount => discount.isActive).length}
                  </span>
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
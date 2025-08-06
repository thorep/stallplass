"use client";

import { useAdminStats } from "@/hooks/useAdminStats";
import { BoxAmenity, StableAmenity } from "@/types";
import { AdminBox, AdminInvoiceRequest, AdminProfile, AdminStable } from "@/types/admin";
import {
  BuildingOfficeIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  CubeIcon,
  CurrencyDollarIcon,
  HomeModernIcon,
  TagIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminOverviewTab } from "./AdminOverviewTab";
import { AmenitiesAdmin } from "./AmenitiesAdmin";
import { BoxesAdmin } from "./BoxesAdmin";
import { InvoiceRequestsAdmin } from "./InvoiceRequestsAdmin";
import { PricingAdmin } from "./PricingAdmin";
import { ServiceTypesAdmin } from "./ServiceTypesAdmin";
import { ServicesAdmin } from "./ServicesAdmin";
import { StablesAdmin } from "./StablesAdmin";
import { ProfilesAdmin } from "./UsersAdmin";
import { DiscountCodesAdmin } from "./DiscountCodesAdmin";
import { EmailConsentsAdmin } from "./EmailConsentsAdmin";

interface AdminDashboardProps {
  initialData: {
    stableAmenities: StableAmenity[];
    boxAmenities: BoxAmenity[];
    profiles: AdminProfile[];
    stables: AdminStable[];
    boxes: AdminBox[];
    payments: AdminInvoiceRequest[];
  };
}

type AdminTab =
  | "overview"
  | "amenities"
  | "pricing"
  | "profiles"
  | "stables"
  | "boxes"
  | "services"
  | "invoices"
  | "service-types"
  | "discount-codes"
  | "email-consents";

const validTabs: AdminTab[] = ["overview", "amenities", "pricing", "profiles", "stables", "boxes", "services", "invoices", "service-types", "discount-codes", "email-consents"];

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get tab from URL, default to "overview"
  const urlTab = searchParams.get('tab') as AdminTab;
  const validTab = validTabs.includes(urlTab) ? urlTab : "overview";
  
  // Use URL as the source of truth for active tab
  const activeTab = validTab;

  // Real-time hooks
  const statsQuery = useAdminStats();
  const liveStats = statsQuery.data;

  // Function to change tab by updating URL
  const changeTab = (newTab: AdminTab) => {
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set('tab', newTab);
    router.push(`/admin?${currentParams.toString()}`);
  };

  const tabs = [
    { id: "overview", label: "Oversikt", icon: Cog6ToothIcon },
    { id: "profiles", label: "Profiler", icon: UsersIcon },
    { id: "stables", label: "Staller", icon: HomeModernIcon },
    { id: "boxes", label: "Bokser", icon: CubeIcon },
    { id: "services", label: "Tjenester", icon: WrenchScrewdriverIcon },
    { id: "invoices", label: "Fakturaer", icon: CreditCardIcon },
    { id: "discount-codes", label: "Rabattkoder", icon: TagIcon },
    { id: "email-consents", label: "E-postsamtykker", icon: EnvelopeIcon },
    { id: "amenities", label: "Fasiliteter", icon: BuildingOfficeIcon },
    { id: "service-types", label: "Tjenestetyper", icon: TagIcon },
    { id: "pricing", label: "Priser", icon: CurrencyDollarIcon },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        // Convert AdminStatsDetailed to the expected liveStats format
        const convertedLiveStats = liveStats
          ? {
              profiles: {
                total: liveStats.profiles.total,
                recentRegistrations: liveStats.profiles.newThisMonth,
              },
              stables: {
                total: liveStats.stables.total,
                recentlyAdded: liveStats.stables.active,
              },
              boxes: {
                total: liveStats.boxes.total,
                available: liveStats.boxes.available,
              },
              payments: {
                total: liveStats.payments.total,
                totalRevenue: liveStats.payments.totalAmount,
              },
            }
          : undefined;

        return (
          <AdminOverviewTab
            profiles={initialData.profiles}
            stables={initialData.stables}
            boxes={initialData.boxes}
            payments={initialData.payments}
            liveStats={convertedLiveStats}
          />
        );


      case "amenities":
        return <AmenitiesAdmin />;

      case "pricing":
        return <PricingAdmin />;

      case "profiles":
        return <ProfilesAdmin initialProfiles={initialData.profiles} />;

      case "stables":
        return <StablesAdmin initialStables={initialData.stables} />;

      case "boxes":
        return <BoxesAdmin initialBoxes={initialData.boxes} />;

      case "services":
        return <ServicesAdmin />;

      case "invoices":
        return <InvoiceRequestsAdmin />;

      case "service-types":
        return <ServiceTypesAdmin />;

      case "discount-codes":
        return <DiscountCodesAdmin />;

      case "email-consents":
        return <EmailConsentsAdmin />;

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
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
              <p className="text-slate-600">Administrer fasiliteter og priser for Stallplass.</p>
            </div>

          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const hasActivity = false;

                return (
                  <button
                    key={tab.id}
                    onClick={() => changeTab(tab.id as AdminTab)}
                    className={`relative flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    }`}
                    data-cy={`admin-tab-${tab.id}`}
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

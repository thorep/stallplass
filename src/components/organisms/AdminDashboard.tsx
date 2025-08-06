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
  UserGroupIcon,
  BanknotesIcon,
  ComputerDesktopIcon,
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
import { EmailMarketingAdmin } from "./EmailMarketingAdmin";

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
  | "users-permissions"
  | "stables-boxes" 
  | "services"
  | "finance"
  | "system-marketing";

type AdminSubTab = 
  | "profiles"
  | "email-consents"
  | "stables"
  | "boxes"
  | "services"
  | "service-types"
  | "invoices"
  | "discount-codes"
  | "pricing"
  | "email-marketing"
  | "amenities";

const validTabs: AdminTab[] = ["overview", "users-permissions", "stables-boxes", "services", "finance", "system-marketing"];

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get tab from URL, default to "overview"
  const urlTab = searchParams.get('tab') as AdminTab;
  const validTab = validTabs.includes(urlTab) ? urlTab : "overview";
  
  // Use URL as the source of truth for active tab
  const activeTab = validTab;
  
  // Get subtab from URL - default to first subtab of each main tab
  const urlSubTab = searchParams.get('subtab') as AdminSubTab;
  const getDefaultSubTab = (mainTab: AdminTab): AdminSubTab => {
    switch (mainTab) {
      case "users-permissions": return "profiles";
      case "stables-boxes": return "stables";
      case "services": return "services";
      case "finance": return "invoices";
      case "system-marketing": return "email-marketing";
      default: return "profiles";
    }
  };
  
  const activeSubTab = urlSubTab || getDefaultSubTab(activeTab);

  // Real-time hooks
  const statsQuery = useAdminStats();
  const liveStats = statsQuery.data;

  // Function to change tab by updating URL
  const changeTab = (newTab: AdminTab, subTab?: AdminSubTab) => {
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set('tab', newTab);
    if (subTab) {
      currentParams.set('subtab', subTab);
    } else {
      currentParams.delete('subtab');
    }
    router.push(`/admin?${currentParams.toString()}`);
  };

  // Function to change subtab
  const changeSubTab = (newSubTab: AdminSubTab) => {
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set('subtab', newSubTab);
    router.push(`/admin?${currentParams.toString()}`);
  };

  const tabs = [
    { id: "overview", label: "Oversikt", icon: Cog6ToothIcon },
    { id: "users-permissions", label: "Brukere & Tillatelser", icon: UserGroupIcon },
    { id: "stables-boxes", label: "Staller & Bokser", icon: HomeModernIcon },
    { id: "services", label: "Tjenester", icon: WrenchScrewdriverIcon },
    { id: "finance", label: "Økonomi", icon: BanknotesIcon },
    { id: "system-marketing", label: "System & Markedsføring", icon: ComputerDesktopIcon },
  ];

  const getSubTabs = (mainTab: AdminTab) => {
    switch (mainTab) {
      case "users-permissions":
        return [
          { id: "profiles", label: "Profiler", icon: UsersIcon },
          { id: "email-consents", label: "E-postsamtykker", icon: EnvelopeIcon },
        ];
      case "stables-boxes":
        return [
          { id: "stables", label: "Staller", icon: HomeModernIcon },
          { id: "boxes", label: "Bokser", icon: CubeIcon },
        ];
      case "services":
        return [
          { id: "services", label: "Tjenester", icon: WrenchScrewdriverIcon },
          { id: "service-types", label: "Tjenestetyper", icon: TagIcon },
        ];
      case "finance":
        return [
          { id: "invoices", label: "Fakturaer", icon: CreditCardIcon },
          { id: "discount-codes", label: "Rabattkoder", icon: TagIcon },
          { id: "pricing", label: "Priser", icon: CurrencyDollarIcon },
        ];
      case "system-marketing":
        return [
          { id: "email-marketing", label: "E-postmarkedsføring", icon: EnvelopeIcon },
          { id: "amenities", label: "Fasiliteter", icon: BuildingOfficeIcon },
        ];
      default:
        return [];
    }
  };

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case "profiles":
        return <ProfilesAdmin initialProfiles={initialData.profiles} />;
      case "email-consents":
        return <EmailConsentsAdmin />;
      case "stables":
        return <StablesAdmin initialStables={initialData.stables} />;
      case "boxes":
        return <BoxesAdmin initialBoxes={initialData.boxes} />;
      case "services":
        return <ServicesAdmin />;
      case "service-types":
        return <ServiceTypesAdmin />;
      case "invoices":
        return <InvoiceRequestsAdmin />;
      case "discount-codes":
        return <DiscountCodesAdmin />;
      case "pricing":
        return <PricingAdmin />;
      case "email-marketing":
        return <EmailMarketingAdmin />;
      case "amenities":
        return <AmenitiesAdmin />;
      default:
        return null;
    }
  };

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

      case "users-permissions":
      case "stables-boxes":
      case "services":
      case "finance":
      case "system-marketing":
        return renderSubTabContent();

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

        {/* Main Tab Navigation */}
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

          {/* Sub Tab Navigation */}
          {activeTab !== "overview" && (
            <div className="mt-4 border-b border-slate-100">
              <nav className="-mb-px flex space-x-6">
                {getSubTabs(activeTab).map((subTab) => {
                  const SubIcon = subTab.icon;
                  
                  return (
                    <button
                      key={subTab.id}
                      onClick={() => changeSubTab(subTab.id as AdminSubTab)}
                      className={`flex items-center space-x-1.5 py-2 px-1 border-b-2 font-medium text-sm ${
                        activeSubTab === subTab.id
                          ? "border-indigo-400 text-indigo-500"
                          : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200"
                      }`}
                      data-cy={`admin-subtab-${subTab.id}`}
                    >
                      <SubIcon className="h-4 w-4" />
                      <span>{subTab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

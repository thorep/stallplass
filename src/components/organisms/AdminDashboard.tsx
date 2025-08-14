"use client";

import { useAdminStats } from "@/hooks/useAdminStats";
import { BoxAmenity, StableAmenity } from "@/types";
import { AdminBox, AdminProfile, AdminStable } from "@/types/admin";
import {
  BuildingOfficeIcon,
  Cog6ToothIcon,
  CubeIcon,
  HomeModernIcon,
  TagIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  EnvelopeIcon,
  UserGroupIcon,
  ComputerDesktopIcon,
  ChatBubbleLeftRightIcon,
  RocketLaunchIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Container, 
  Paper, 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  useTheme, 
  useMediaQuery 
} from '@mui/material';
import { AdminOverviewTab } from "./AdminOverviewTab";
import { AmenitiesAdmin } from "./AmenitiesAdmin";
import { BoxesAdmin } from "./BoxesAdmin";
import { ServiceTypesAdmin } from "./ServiceTypesAdmin";
import { ServicesAdmin } from "./ServicesAdmin";
import { StablesAdmin } from "./StablesAdmin";
import { ProfilesAdmin } from "./UsersAdmin";
import { EmailConsentsAdmin } from "./EmailConsentsAdmin";
import { EmailMarketingAdmin } from "./EmailMarketingAdmin";
import { AdvertisementSettingsAdmin } from "./AdvertisementSettingsAdmin";
import { ForumAdminClient } from "../admin/ForumAdminClient";
import { HorsesAdmin, type AdminHorse } from "./HorsesAdmin";

import type { User } from '@supabase/supabase-js';

interface AdminDashboardProps {
  user: User;
  initialData: {
    stableAmenities: StableAmenity[];
    boxAmenities: BoxAmenity[];
    profiles: AdminProfile[];
    stables: AdminStable[];
    boxes: AdminBox[];
    horses: AdminHorse[];
  };
}

type AdminTab =
  | "overview"
  | "users-permissions"
  | "stables-boxes" 
  | "services"
  | "horses"
  | "forum"
  | "boost"
  | "system-marketing";

type AdminSubTab = 
  | "profiles"
  | "email-consents"
  | "stables"
  | "boxes"
  | "services"
  | "service-types"
  | "horses-overview"
  | "forum-overview"
  | "boost-overview"
  | "email-marketing"
  | "advertisement-settings"
  | "amenities";

const validTabs: AdminTab[] = ["overview", "users-permissions", "stables-boxes", "services", "horses", "forum", "boost", "system-marketing"];

export function AdminDashboard({ initialData }: Readonly<Omit<AdminDashboardProps, 'user'>>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
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
      case "horses": return "horses-overview";
      case "forum": return "forum-overview";
      case "boost": return "boost-overview";
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
    { id: "horses", label: "Hester", icon: HeartIcon },
    { id: "forum", label: "Forum", icon: ChatBubbleLeftRightIcon },
    { id: "boost", label: "Boost", icon: RocketLaunchIcon },
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
      case "horses":
        return [
          { id: "horses-overview", label: "Hester Oversikt", icon: HeartIcon },
        ];
      case "forum":
        return [
          { id: "forum-overview", label: "Forum Oversikt", icon: ChatBubbleLeftRightIcon },
        ];
      case "boost":
        return [
          { id: "boost-overview", label: "Boost Oversikt", icon: RocketLaunchIcon },
        ];
      case "system-marketing":
        return [
          { id: "email-marketing", label: "E-postmarkedsføring", icon: EnvelopeIcon },
          { id: "advertisement-settings", label: "Annonse-innstillinger", icon: RocketLaunchIcon },
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
      case "horses-overview":
        return <HorsesAdmin initialHorses={initialData.horses} />;
      case "forum-overview":
        return <ForumAdminClient />;
      case "boost-overview":
        return <div className="p-8 text-center"><p className="text-slate-600">Boost administrasjon kommer snart...</p></div>;
      case "email-marketing":
        return <EmailMarketingAdmin />;
      case "advertisement-settings":
        return <AdvertisementSettingsAdmin />;
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
            }
          : undefined;

        return (
          <AdminOverviewTab
            profiles={initialData.profiles}
            stables={initialData.stables}
            boxes={initialData.boxes}
            liveStats={convertedLiveStats}
          />
        );

      case "users-permissions":
      case "stables-boxes":
      case "services":
      case "horses":
      case "forum":
      case "boost":
      case "system-marketing":
        return renderSubTabContent();

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" className="py-8">
      {/* Header Section */}
      <Box className="mb-8">
        <Box className="flex items-center justify-between">
          <Box>
            <Typography 
              variant="h3" 
              className="text-3xl font-bold text-slate-800 mb-2"
              sx={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}
            >
              Admin Dashboard
            </Typography>
            <Typography 
              variant="body1" 
              className="text-slate-600"
              sx={{ color: '#475569' }}
            >
              Administrer brukere, staller og tjenester for Stallplass.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Tab Navigation with Mobile Support */}
      <Box className="mb-6">
        <Tabs
          value={validTabs.indexOf(activeTab)}
          onChange={(_, newValue) => changeTab(validTabs[newValue])}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              minWidth: isMobile ? 'auto' : 120,
              fontWeight: 500,
              fontSize: '0.875rem',
              padding: isMobile ? '12px 8px' : '16px 16px',
              color: '#64748b',
              '&.Mui-selected': {
                color: '#4f46e5',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#4f46e5',
            },
            '& .MuiTabs-scrollButtons': {
              color: '#64748b',
            },
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Tab
                key={tab.id}
                label={
                  <Box className="flex items-center space-x-2">
                    <Icon className="h-5 w-5" />
                    <span className={isMobile ? "text-xs" : ""}>{tab.label}</span>
                  </Box>
                }
                data-cy={`admin-tab-${tab.id}`}
                sx={{
                  '& .MuiTab-iconWrapper': {
                    marginBottom: 0,
                    marginRight: '8px',
                  }
                }}
              />
            );
          })}
        </Tabs>

        {/* Sub Tab Navigation */}
        {activeTab !== "overview" && (
          <Box className="mt-4">
            <Tabs
              value={getSubTabs(activeTab).findIndex(subTab => subTab.id === activeSubTab)}
              onChange={(_, newValue) => {
                const subTab = getSubTabs(activeTab)[newValue];
                if (subTab) changeSubTab(subTab.id as AdminSubTab);
              }}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
              sx={{
                borderBottom: 1,
                borderColor: '#f1f5f9',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  minWidth: isMobile ? 'auto' : 100,
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  padding: isMobile ? '8px 6px' : '8px 12px',
                  color: '#94a3b8',
                  '&.Mui-selected': {
                    color: '#6366f1',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#6366f1',
                },
                '& .MuiTabs-scrollButtons': {
                  color: '#94a3b8',
                },
              }}
            >
              {getSubTabs(activeTab).map((subTab) => {
                const SubIcon = subTab.icon;
                return (
                  <Tab
                    key={subTab.id}
                    label={
                      <Box className="flex items-center space-x-1.5">
                        <SubIcon className="h-4 w-4" />
                        <span className={isMobile ? "text-xs" : ""}>{subTab.label}</span>
                      </Box>
                    }
                    data-cy={`admin-subtab-${subTab.id}`}
                    sx={{
                      '& .MuiTab-iconWrapper': {
                        marginBottom: 0,
                        marginRight: '6px',
                      }
                    }}
                  />
                );
              })}
            </Tabs>
          </Box>
        )}
      </Box>

      {/* Tab Content */}
      <Paper 
        className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
        sx={{
          borderRadius: '0.5rem',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          border: '1px solid #e2e8f0',
          padding: isMobile ? '1rem' : '1.5rem',
        }}
      >
        {renderTabContent()}
      </Paper>
    </Container>
  );
}

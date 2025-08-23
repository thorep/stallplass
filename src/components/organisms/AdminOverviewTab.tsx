"use client";

import { AdminCleanupControls } from "@/components/molecules/AdminCleanupControls";
import { AdminImageCleanupControls } from "@/components/molecules/AdminImageCleanupControls";
import { AdminNotificationControls } from "@/components/molecules/AdminNotificationControls";
import { AdminStatGroup } from "@/components/molecules/AdminStatGroup";
import { AdminStatsCard } from "@/components/molecules/AdminStatsCard";
import {
  useAdminBoxStats,
  useAdminProfileStats,
  useAdminStableStats,
} from "@/hooks/useAdminQueries";
import { AdminBox, AdminProfile, AdminStable } from "@/types/admin";
import { CubeIcon, HomeModernIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Box } from "@mui/material";

interface AdminOverviewTabProps {
  profiles: AdminProfile[];
  stables: AdminStable[];
  boxes: AdminBox[];
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
  };
}

export function AdminOverviewTab({ profiles, stables, boxes, liveStats }: AdminOverviewTabProps) {
  const { data: profileStats, isLoading: profileStatsLoading } = useAdminProfileStats();
  const { data: stableStats, isLoading: stableStatsLoading } = useAdminStableStats();
  const { data: boxStats, isLoading: boxStatsLoading } = useAdminBoxStats();
  return (
    <Box className="space-y-6">
      {/* Quick Stats with Live Data - Mobile-first responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <AdminStatsCard
            icon={<UsersIcon className="h-8 w-8 text-purple-600" />}
            title="Profiler"
            value={profileStats?.total ?? liveStats?.profiles.total ?? profiles.length}
            subtitle={
              profileStatsLoading
                ? "Laster..."
                : profileStats?.newToday !== undefined
                ? `+${profileStats.newToday} i dag`
                : undefined
            }
            subtitleColor="green"
          />
        </div>

        <div>
          <AdminStatsCard
            icon={<HomeModernIcon className="h-8 w-8 text-green-600" />}
            title="Staller"
            value={stableStats?.total ?? liveStats?.stables.total ?? stables.length}
            subtitle={
              stableStatsLoading
                ? "Laster..."
                : stableStats?.newToday !== undefined
                ? `+${stableStats.newToday} i dag`
                : undefined
            }
            subtitleColor="green"
          />
        </div>

        <div>
          <AdminStatsCard
            icon={<CubeIcon className="h-8 w-8 text-blue-600" />}
            title="Stallplasser"
            value={boxStats?.total ?? liveStats?.boxes.total ?? boxes.length}
            subtitle={
              boxStatsLoading
                ? "Laster..."
                : boxStats?.newToday !== undefined
                ? `+${boxStats.newToday} i dag`
                : undefined
            }
          />
        </div>
      </div>

      {/* Statistics Groups - Mobile-first responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <AdminStatGroup
            title="Profilstatistikk"
            stats={[
              {
                label: "Totalt antall profiler:",
                value: profileStats?.total ?? profiles.length,
              },
              {
                label: "Nye i dag:",
                value: profileStats?.newToday ?? 0,
              },
              {
                label: "Admin profiler:",
                value: profiles.filter((profile: AdminProfile) => profile.isAdmin).length,
              },
              {
                label: "Stall eiere:",
                value: profiles.filter((profile: AdminProfile) => profile._count.stables > 0)
                  .length,
              },
            ]}
          />
        </div>

        <div>
          <AdminStatGroup
            title="Stall & Stallplass-statistikk"
            stats={[
              {
                label: "Totalt antall staller:",
                value: stableStats?.total ?? stables.length,
              },
              {
                label: "Nye staller i dag:",
                value: stableStats?.newToday ?? 0,
              },
              {
                label: "Totalt antall bokser:",
                value: boxStats?.total ?? boxes.length,
              },
              {
                label: "Nye bokser i dag:",
                value: boxStats?.newToday ?? 0,
              },
              {
                label: "Ledige bokser:",
                value: boxes.filter((box: AdminBox) => ('availableQuantity' in box ? (box.availableQuantity as number) > 0 : false)).length,
              },
            ]}
          />
        </div>

        <div>
          <AdminStatGroup
            title="Plattformstatistikk"
            stats={[
              {
                label: "Arkiverte staller:",
                value: stables.filter((stable: AdminStable) => stable.archived).length,
              },
              {
                label: "Tilgjengelige stallplasser:",
                value: boxes.filter((box: AdminBox) => ('availableQuantity' in box ? (box.availableQuantity as number) > 0 : false)).length,
              },
              {
                label: "Total kapasitet:",
                value: boxes.length,
              },
            ]}
          />
        </div>
      </div>

      {/* Admin Actions Section - Mobile-first responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <AdminCleanupControls />
        </div>
        <div>
          <AdminImageCleanupControls />
        </div>
        <div>
          <AdminNotificationControls />
        </div>
      </div>
    </Box>
  );
}

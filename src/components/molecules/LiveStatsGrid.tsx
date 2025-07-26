'use client';

import { 
  UsersIcon,
  HomeModernIcon,
  CubeIcon,
  CreditCardIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { AdminStatsDetailed } from '@/hooks/useAdminStats';

interface LiveStatsGridProps {
  stats: AdminStatsDetailed | null;
  isLoading: boolean;
  lastUpdated: Date | null;
  error?: string | null;
}

interface StatCardProps {
  title: string;
  value: number;
  subValue?: number;
  subLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  isLoading?: boolean;
}

function StatCard({ 
  title, 
  value, 
  subValue, 
  subLabel, 
  icon: Icon, 
  iconColor, 
  trend, 
  isLoading = false 
}: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <Icon className={`h-8 w-8 ${iconColor}`} />
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <div className="flex items-baseline space-x-2">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-slate-900">{value.toLocaleString('nb-NO')}</p>
            )}
            {trend && (
              <div className={`flex items-center text-sm ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                <span>{trend.value}</span>
              </div>
            )}
          </div>
          {subValue !== undefined && subLabel && (
            <p className="text-sm text-slate-500 mt-1">
              {subValue.toLocaleString('nb-NO')} {subLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function LiveStatsGrid({ stats, isLoading, lastUpdated, error }: LiveStatsGridProps) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <ClockIcon className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Feil ved henting av statistikk
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Aldri';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 30) return 'Nå nettopp';
    if (seconds < 60) return `${seconds} sekunder siden`;
    if (minutes < 60) return `${minutes} minutter siden`;
    return date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Last Updated Indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Live Statistikk</h2>
        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <ClockIcon className="h-4 w-4" />
          <span>Sist oppdatert: {formatLastUpdated(lastUpdated)}</span>
          {isLoading && (
            <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Brukere"
          value={stats?.users.total || 0}
          subValue={stats?.users.newThisMonth || 0}
          subLabel="nye i dag"
          icon={UsersIcon}
          iconColor="text-purple-600"
          trend={stats?.users.newThisMonth ? {
            value: stats.users.newThisMonth,
            isPositive: stats.users.newThisMonth > 0,
            label: "denne måneden"
          } : undefined}
          isLoading={isLoading}
        />
        
        <StatCard
          title="Staller"
          value={stats?.stables.total || 0}
          subValue={0 || 0}
          subLabel="annonserer"
          icon={HomeModernIcon}
          iconColor="text-green-600"
          trend={undefined}
          isLoading={isLoading}
        />
        
        <StatCard
          title="Bokser"
          value={stats?.boxes.total || 0}
          subValue={stats?.boxes.available || 0}
          subLabel="ledige"
          icon={CubeIcon}
          iconColor="text-blue-600"
          trend={undefined}
          isLoading={isLoading}
        />
        
        <StatCard
          title="Betalinger"
          value={stats?.payments.total || 0}
          subValue={stats?.payments.totalAmount || 0}
          subLabel="kr totalt"
          icon={CreditCardIcon}
          iconColor="text-amber-600"
          trend={undefined}
          isLoading={isLoading}
        />
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Brukerdetaljer</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Admin users:</span>
              <span className="font-medium">{0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Stall eiere:</span>
              <span className="font-medium">{stats?.users.withStables || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Nye registreringer (24t):</span>
              <span className="font-medium text-green-600">{stats?.users.newThisMonth || 0}</span>
            </div>
          </div>
        </div>

        {/* Stable & Box Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Stall & Boks detaljer</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Fremhevede stables:</span>
              <span className="font-medium">{0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Aktive bokser:</span>
              <span className="font-medium">{stats?.boxes.available || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Nye bokser (24t):</span>
              <span className="font-medium text-green-600">{0}</span>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Betalingsdetaljer</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Fullførte:</span>
              <span className="font-medium text-green-600">{0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Ventende:</span>
              <span className="font-medium text-amber-600">{0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Feilede:</span>
              <span className="font-medium text-red-600">{stats?.payments.failed || 0}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-slate-600">Inntekt i dag:</span>
              <span className="font-medium text-green-600">
                {(stats?.payments.totalAmount || 0).toLocaleString('nb-NO')} kr
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Overview */}
      {stats?.activity && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Aktivitetsoversikt (24t)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.activity.conversationsActive}</p>
              <p className="text-sm text-slate-600">Aktive conversations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{0}</p>
              <p className="text-sm text-slate-600">Nye meldinger</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{0}</p>
              <p className="text-sm text-slate-600">Stall visninger</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
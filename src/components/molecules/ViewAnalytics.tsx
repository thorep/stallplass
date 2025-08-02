'use client';

import { useState, useEffect } from 'react';
import { EyeIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { getViewAnalytics, ViewAnalytics as ViewAnalyticsType } from '@/services/view-tracking-service';

interface ViewAnalyticsProps {
  ownerId: string;
  className?: string;
}

export default function ViewAnalytics({ ownerId, className = '' }: ViewAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ViewAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<number>(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getViewAnalytics(ownerId, { days: timeframe });
        setAnalytics(data);
      } catch {
        setError('Kunne ikke laste visningsstatistikk');
      } finally {
        setLoading(false);
      }
    };

    if (ownerId) {
      fetchAnalytics();
    }
  }, [ownerId, timeframe]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <EyeIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Visningsstatistikk</h3>
            <p className="text-slate-600 text-sm">Se hvor mange som har sett dine stables</p>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-slate-100 rounded"></div>
            <div className="h-10 bg-slate-100 rounded"></div>
            <div className="h-10 bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <EyeIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Visningsstatistikk</h3>
            <p className="text-slate-600 text-sm">Se hvor mange som har sett dine stables</p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <EyeIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Visningsstatistikk</h3>
            <p className="text-slate-600 text-sm">Se hvor mange som har sett dine staller og tjenester</p>
          </div>
        </div>

        {/* Timeframe selector */}
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(Number(e.target.value))}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={7}>Siste 7 dager</option>
          <option value={30}>Siste 30 dager</option>
          <option value={90}>Siste 90 dager</option>
        </select>
      </div>

      {/* Summary Stats */}
      {analytics.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Stallvisninger</p>
                <p className="text-2xl font-bold text-emerald-900">{analytics.summary.totalStableViews}</p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-emerald-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Boksvisninger</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.summary.totalBoxViews}</p>
              </div>
              <EyeIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Tjenestevisninger</p>
                <p className="text-2xl font-bold text-orange-900">{analytics.summary.totalServiceViews || 0}</p>
              </div>
              <EyeIcon className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Totale visninger</p>
                <p className="text-2xl font-bold text-purple-900">{analytics.summary.totalViews}</p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Stable Details */}
      {analytics.stables && analytics.stables.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">Staller</h4>
          <div className="space-y-3">
            {analytics.stables.map((stable) => (
              <div key={stable.stableId} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <h5 className="font-medium text-slate-900">{stable.stableName}</h5>
                  <p className="text-sm text-slate-600">Stall</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-600">{stable.views}</div>
                  <div className="text-sm text-slate-600">visninger</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Box Details */}
      {analytics.boxes && analytics.boxes.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">Bokser</h4>
          <div className="space-y-3">
            {analytics.boxes
              .sort((a, b) => b.views - a.views)
              .slice(0, 10)
              .map((box) => (
                <div key={box.boxId} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <h5 className="font-medium text-slate-900">{box.boxName}</h5>
                    <p className="text-sm text-slate-600">{box.stableName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-emerald-600">{box.views}</div>
                    <div className="text-sm text-slate-600">visninger</div>
                  </div>
                </div>
              ))}
          </div>
          {analytics.boxes.length > 10 && (
            <div className="text-center mt-4">
              <p className="text-sm text-slate-600">
                Viser topp 10 av {analytics.boxes.length} bokser
              </p>
            </div>
          )}
        </div>
      )}

      {/* Service Details */}
      {analytics.services && analytics.services.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">Tjenester</h4>
          <div className="space-y-3">
            {analytics.services
              .sort((a, b) => b.views - a.views)
              .map((service) => (
                <div key={service.serviceId} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <h5 className="font-medium text-slate-900">{service.serviceName}</h5>
                    <p className="text-sm text-slate-600 capitalize">
                      {service.serviceType === 'veterinarian' ? 'Veterinær' : 
                       service.serviceType === 'farrier' ? 'Hovsmed' : 
                       service.serviceType === 'trainer' ? 'Trener' : service.serviceType}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-orange-600">{service.views}</div>
                    <div className="text-sm text-slate-600">visninger</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* No data message */}
      {analytics.summary?.totalViews === 0 && (
        <div className="text-center py-8">
          <EyeIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-slate-900 mb-2">Ingen visninger ennå</h4>
          <p className="text-slate-600 max-w-md mx-auto">
            Når folk besøker dine stall- og tjenestesider vil du se statistikken her. 
            Sørg for at stallene, boksene og tjenestene dine er synlige og har bra beskrivelser.
          </p>
        </div>
      )}
    </div>
  );
}
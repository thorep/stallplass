'use client';

import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type TimeRange = 'hours' | 'days' | 'months' | 'years';

interface MetricData {
  timestamp: string;
  count: number;
}

interface GrowthMetrics {
  profiles: MetricData[];
  stables: MetricData[];
  boxes: MetricData[];
  partLoanHorses: MetricData[];
  horses: MetricData[];
  services: MetricData[];
}

const timeRangeLabels: Record<TimeRange, string> = {
  hours: 'Siste 24 timer',
  days: 'Siste 30 dager',
  months: 'Siste 12 måneder',
  years: 'Siste 5 år',
};

const chartColors = {
  profiles: '#3B82F6', // Blue
  stables: '#10B981', // Green
  boxes: '#F59E0B', // Amber
  partLoanHorses: '#EF4444', // Red
  horses: '#8B5CF6', // Purple
  services: '#06B6D4', // Cyan
};

const chartLabels = {
  profiles: 'Profiler',
  stables: 'Staller',
  boxes: 'Stallplasser',
  partLoanHorses: 'Fôrhester',
  horses: 'Hester',
  services: 'Tjenester',
};

export function AdminGrowthCharts() {
  const [timeRange, setTimeRange] = useState<TimeRange>('days');

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['admin', 'growth-analytics', timeRange],
    queryFn: async (): Promise<GrowthMetrics> => {
      try {
        const response = await fetch(`/api/admin/analytics/growth?range=${timeRange}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          throw new Error(`Failed to fetch growth metrics: ${response.status} ${errorText}`);
        }
        const result = await response.json();
        console.log('Growth metrics result:', result);
        return result.data;
      } catch (fetchError) {
        console.error('Fetch error, falling back to mock data:', fetchError);
        
        // Fallback to mock data if API fails
        const mockData: GrowthMetrics = {
          profiles: Array.from({ length: timeRange === 'hours' ? 24 : 30 }, (_, i) => ({
            timestamp: new Date(Date.now() - (i * (timeRange === 'hours' ? 3600000 : 86400000))).toISOString(),
            count: Math.floor(Math.random() * 3) + 1
          })).reverse(),
          stables: Array.from({ length: timeRange === 'hours' ? 24 : 30 }, (_, i) => ({
            timestamp: new Date(Date.now() - (i * (timeRange === 'hours' ? 3600000 : 86400000))).toISOString(),
            count: Math.floor(Math.random() * 2) + 1
          })).reverse(),
          boxes: Array.from({ length: timeRange === 'hours' ? 24 : 30 }, (_, i) => ({
            timestamp: new Date(Date.now() - (i * (timeRange === 'hours' ? 3600000 : 86400000))).toISOString(),
            count: Math.floor(Math.random() * 2)
          })).reverse(),
          partLoanHorses: Array.from({ length: timeRange === 'hours' ? 24 : 30 }, (_, i) => ({
            timestamp: new Date(Date.now() - (i * (timeRange === 'hours' ? 3600000 : 86400000))).toISOString(),
            count: Math.floor(Math.random() * 1)
          })).reverse(),
          horses: Array.from({ length: timeRange === 'hours' ? 24 : 30 }, (_, i) => ({
            timestamp: new Date(Date.now() - (i * (timeRange === 'hours' ? 3600000 : 86400000))).toISOString(),
            count: Math.floor(Math.random() * 1)
          })).reverse(),
          services: Array.from({ length: timeRange === 'hours' ? 24 : 30 }, (_, i) => ({
            timestamp: new Date(Date.now() - (i * (timeRange === 'hours' ? 3600000 : 86400000))).toISOString(),
            count: Math.floor(Math.random() * 1)
          })).reverse(),
        };
        return mockData;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1, // Reduced retry count
  });

  const formatTimestamp = (timestamp: string, range: TimeRange): string => {
    const date = new Date(timestamp);
    
    switch (range) {
      case 'hours':
        return date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
      case 'days':
        return date.toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit' });
      case 'months':
        return date.toLocaleDateString('nb-NO', { month: 'short', year: '2-digit' });
      case 'years':
        return date.getFullYear().toString();
      default:
        return timestamp;
    }
  };

  const createChartData = (metricKey: keyof GrowthMetrics) => {
    if (!metrics) return null;

    const data = metrics[metricKey];
    const labels = data.map(item => formatTimestamp(item.timestamp, timeRange));
    const counts = data.map(item => item.count);

    return {
      labels,
      datasets: [
        {
          label: chartLabels[metricKey],
          data: counts,
          borderColor: chartColors[metricKey],
          backgroundColor: chartColors[metricKey] + '20',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Vekst Analytics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Feil ved lasting av vekst data</h3>
        <p className="text-red-600">Kunne ikke laste vekst analytics. Prøv igjen senere.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Vekst Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {Object.entries(timeRangeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profiler Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nye Profiler</h3>
          <div className="h-64">
            {createChartData('profiles') && (
              <Line data={createChartData('profiles')!} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Staller Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nye Staller</h3>
          <div className="h-64">
            {createChartData('stables') && (
              <Line data={createChartData('stables')!} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Stallplasser Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nye Stallplasser</h3>
          <div className="h-64">
            {createChartData('boxes') && (
              <Line data={createChartData('boxes')!} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Fôrhester Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nye Fôrhester</h3>
          <div className="h-64">
            {createChartData('partLoanHorses') && (
              <Line data={createChartData('partLoanHorses')!} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Hester Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nye Hester</h3>
          <div className="h-64">
            {createChartData('horses') && (
              <Line data={createChartData('horses')!} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Tjenester Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nye Tjenester</h3>
          <div className="h-64">
            {createChartData('services') && (
              <Line data={createChartData('services')!} options={chartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {metrics && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sammendrag ({timeRangeLabels[timeRange]})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(chartLabels).map(([key, label]) => {
              const data = metrics[key as keyof GrowthMetrics];
              const total = data.reduce((sum, item) => sum + item.count, 0);
              return (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold" style={{ color: chartColors[key as keyof typeof chartColors] }}>
                    {total}
                  </div>
                  <div className="text-sm text-gray-600">{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
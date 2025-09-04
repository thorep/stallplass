'use client';

import React, { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useQuery } from '@tanstack/react-query'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

type TimeRange = 'hours' | 'days' | 'months' | 'years'

const timeRangeLabels: Record<TimeRange, string> = {
  hours: 'Siste 24 timer',
  days: 'Siste 30 dager',
  months: 'Siste 12 måneder',
  years: 'Siste 5 år',
}

const entityOptions = [
  { id: 'STABLE', label: 'Staller' },
  { id: 'BOX', label: 'Stallplasser' },
  { id: 'SERVICE', label: 'Tjenester' },
  { id: 'HORSE', label: 'Hester' },
  { id: 'PART_LOAN_HORSE', label: 'Fôrhester' },
  { id: 'HORSE_SALE', label: 'Hester til salgs' },
  { id: 'HORSE_BUY', label: 'Hest ønskes kjøpt' },
]

const actionOptions = [
  { id: 'CREATE', label: 'Opprettet' },
  { id: 'UPDATE', label: 'Oppdatert' },
  { id: 'DELETE', label: 'Slettet' },
]

interface SeriesPoint { timestamp: string; count: number }

export function AdminAuditAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('days')
  const [selectedEntities, setSelectedEntities] = useState<string[]>([
    'STABLE',
    'BOX',
    'SERVICE',
    'HORSE',
    'PART_LOAN_HORSE',
    'HORSE_SALE',
    'HORSE_BUY',
  ])
  const [selectedActions, setSelectedActions] = useState<string[]>([
    'CREATE',
    'UPDATE',
    'DELETE',
  ])

  const queryParams = new URLSearchParams({ range: timeRange })
  if (selectedEntities.length) queryParams.set('entities', selectedEntities.join(','))
  if (selectedActions.length) queryParams.set('actions', selectedActions.join(','))

  const { data, isLoading, error } = useQuery<SeriesPoint[]>({
    queryKey: ['admin', 'audit-analytics', timeRange, selectedEntities.sort().join(','), selectedActions.sort().join(',')],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/audit?${queryParams.toString()}`, { credentials: 'include' })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      return json.data as SeriesPoint[]
    },
    staleTime: 60_000,
  })

  const chartData = useMemo(() => {
    if (!data) return null
    const labels = data.map((p) => formatLabel(p.timestamp, timeRange))
    const counts = data.map((p) => p.count)

    // Simple trendline
    const n = counts.length || 1
    const sumX = counts.reduce((s, _y, i) => s + i, 0)
    const sumY = counts.reduce((s, y) => s + y, 0)
    const sumXY = counts.reduce((s, y, i) => s + i * y, 0)
    const sumXX = counts.reduce((s, _y, i) => s + i * i, 0)
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1)
    const intercept = sumY / n - (slope * sumX) / n
    const trend = counts.map((_, i) => intercept + slope * i)

    return {
      labels,
      datasets: [
        {
          label: 'Aktivitet (audit logs)',
          data: counts,
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79,70,229,0.15)',
          pointRadius: 2,
          tension: 0.35,
          fill: true,
        },
        {
          label: 'Trend',
          data: trend,
          borderColor: '#4F46E5',
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
        },
      ],
    }
  }, [data, timeRange])

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  }

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900">Aktivitet (Audit Logs)</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-3 py-2 border border-slate-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {Object.entries(timeRangeLabels).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>

          {/* Entity filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {entityOptions.map((e) => (
              <label key={e.id} className="inline-flex items-center gap-1 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={selectedEntities.includes(e.id)}
                  onChange={(ev) =>
                    setSelectedEntities((prev) =>
                      ev.target.checked ? [...prev, e.id] : prev.filter((x) => x !== e.id)
                    )
                  }
                />
                {e.label}
              </label>
            ))}
          </div>

          {/* Action filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {actionOptions.map((a) => (
              <label key={a.id} className="inline-flex items-center gap-1 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={selectedActions.includes(a.id)}
                  onChange={(ev) =>
                    setSelectedActions((prev) =>
                      ev.target.checked ? [...prev, a.id] : prev.filter((x) => x !== a.id)
                    )
                  }
                />
                {a.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow border border-slate-200 p-4 md:p-6">
        {isLoading ? (
          <div className="h-96 animate-pulse bg-slate-100 rounded" />
        ) : error ? (
          <div className="text-red-600">Kunne ikke laste data</div>
        ) : chartData ? (
          <div className="h-96">
            <Line data={chartData} options={options} />
          </div>
        ) : (
          <div className="text-slate-600">Ingen data å vise</div>
        )}
      </div>
    </div>
  )
}

function formatLabel(timestamp: string, range: TimeRange) {
  const d = new Date(timestamp)
  if (range === 'hours') return d.toLocaleTimeString('nb-NO', { hour: '2-digit' })
  if (range === 'days') return d.toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit' })
  if (range === 'months') return `${d.toLocaleString('nb-NO', { month: 'short' })} ${String(d.getFullYear()).slice(2)}`
  return String(d.getFullYear())
}

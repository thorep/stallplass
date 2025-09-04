import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/services/prisma'
import { EntityType, AuditAction } from '@/generated/prisma'
import { captureApiError } from '@/lib/posthog-capture'

type TimeRange = 'hours' | 'days' | 'months' | 'years'

interface SeriesPoint {
  timestamp: string
  count: number
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const sp = request.nextUrl.searchParams
    const range = (sp.get('range') || 'days') as TimeRange
    const entitiesParam = sp.get('entities') || ''
    const actionsParam = sp.get('actions') || ''

    const entities = entitiesParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const actions = actionsParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const entityFilters: EntityType[] = entities
      .map((e): EntityType | null => {
        switch (e) {
          case 'STABLE':
            return 'STABLE'
          case 'BOX':
            return 'BOX'
          case 'SERVICE':
            return 'SERVICE'
          case 'HORSE':
            return 'HORSE'
          case 'PART_LOAN_HORSE':
            return 'PART_LOAN_HORSE'
          case 'HORSE_SALE':
            return 'HORSE_SALE'
          case 'HORSE_BUY':
            return 'HORSE_BUY'
          default:
            return null
        }
      })
      .filter((v): v is EntityType => v !== null)

    const actionFilters: AuditAction[] = actions
      .map((a): AuditAction | null => {
        switch (a) {
          case 'CREATE':
            return 'CREATE'
          case 'UPDATE':
            return 'UPDATE'
          case 'DELETE':
            return 'DELETE'
          default:
            return null
        }
      })
      .filter((v): v is AuditAction => v !== null)

    const data = await getAuditActivity(range, entityFilters, actionFilters)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Audit analytics error:', error)
    try {
      captureApiError({ error, context: 'admin_analytics_audit_get', route: '/api/admin/analytics/audit', method: 'GET' })
    } catch {}
    return NextResponse.json({ error: 'Failed to fetch audit analytics' }, { status: 500 })
  }
}

function getTimeConfig(timeRange: TimeRange) {
  switch (timeRange) {
    case 'hours':
      return { mode: 'hours' as const, limit: 24 }
    case 'days':
      return { mode: 'days' as const, limit: 30 }
    case 'months':
      return { mode: 'months' as const, limit: 12 }
    case 'years':
      return { mode: 'years' as const, limit: 5 }
    default:
      return { mode: 'days' as const, limit: 30 }
  }
}

async function getAuditActivity(
  timeRange: TimeRange,
  entities: EntityType[],
  actions: AuditAction[]
): Promise<SeriesPoint[]> {
  const { mode, limit } = getTimeConfig(timeRange)
  const now = new Date()
  const series: SeriesPoint[] = []

  for (let i = limit - 1; i >= 0; i--) {
    let start = new Date(now)
    let end = new Date(now)
    let label = ''

    if (mode === 'hours') {
      start.setHours(now.getHours() - i, 0, 0, 0)
      end = new Date(start)
      end.setHours(start.getHours() + 1, 0, 0, 0)
      label = start.toISOString().substring(0, 13) + ':00:00'
    } else if (mode === 'days') {
      start.setDate(now.getDate() - i)
      start.setHours(0, 0, 0, 0)
      end = new Date(start)
      end.setDate(start.getDate() + 1)
      label = start.toISOString().substring(0, 10)
    } else if (mode === 'months') {
      start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
    } else {
      start = new Date(now.getFullYear() - i, 0, 1)
      end = new Date(now.getFullYear() - i + 1, 0, 1)
      label = `${start.getFullYear()}`
    }

    try {
      const count = await prisma.audit_logs.count({
        where: {
          createdAt: { gte: start, lt: end },
          ...(entities.length > 0 ? { entityType: { in: entities } } : {}),
          ...(actions.length > 0 ? { action: { in: actions } } : {}),
        },
      })
      series.push({ timestamp: label, count })
    } catch (e) {
      console.error('Error counting audit_logs', e)
      series.push({ timestamp: label, count: 0 })
    }
  }

  return series
}

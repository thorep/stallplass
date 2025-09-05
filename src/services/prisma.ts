import { PrismaClient, Prisma, EntityType as EntityTypeEnum, AuditAction as AuditActionEnum } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prevent Prisma Client from being instantiated in browser environment
const isBrowser = typeof window !== 'undefined'

export const prisma =
  globalForPrisma.prisma ??
  (isBrowser
    ? ({} as PrismaClient) // Return a dummy object in browser
    : new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['warn', 'error'],
      }))

// Debug-only audit logging based on audit_logs
// Captures JSON-safe before/after snapshots; errors are swallowed
type ModelName = 'boxes' | 'stables' | 'services' | 'horse_sales' | 'horse_buys' | 'horses' | 'part_loan_horses'

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  // Ensure JSON-safe (Date -> ISO, strip functions/undefined)
  return JSON.parse(JSON.stringify(value)) as unknown as Prisma.InputJsonValue
}

async function findById(model: ModelName, id: string) {
  switch (model) {
    case 'boxes':
      return prisma.boxes.findUnique({ where: { id } })
    case 'stables':
      return prisma.stables.findUnique({ where: { id } })
    case 'services':
      return prisma.services.findUnique({ where: { id } })
    case 'horse_sales':
      return prisma.horse_sales.findUnique({ where: { id } })
    case 'horse_buys':
      return prisma.horse_buys.findUnique({ where: { id } })
    case 'horses':
      return prisma.horses.findUnique({ where: { id } })
    case 'part_loan_horses':
      return prisma.part_loan_horses.findUnique({ where: { id } })
  }
}

function getEntityType(model: ModelName): EntityTypeEnum {
  switch (model) {
    case 'boxes':
      return 'BOX'
    case 'stables':
      return 'STABLE'
    case 'services':
      return 'SERVICE'
    case 'horse_sales':
      return 'HORSE_SALE'
    case 'horse_buys':
      return 'HORSE_BUY'
    case 'horses':
      return 'HORSE'
    case 'part_loan_horses':
      return 'PART_LOAN_HORSE'
  }
}

type GlobalAuditMarker = { __PRISMA_AUDIT_MW__?: boolean }
const g = globalThis as unknown as GlobalAuditMarker

if (!isBrowser && !g.__PRISMA_AUDIT_MW__) {
  g.__PRISMA_AUDIT_MW__ = true
  prisma.$use(async (params, next) => {
    const tracked: ReadonlyArray<ModelName> = [
      'boxes',
      'stables',
      'services',
      'horse_sales',
      'horse_buys',
      'horses',
      'part_loan_horses',
    ]

    const model = (params.model || '') as ModelName
    if (!tracked.includes(model)) return next(params)

    const actionable = ['update', 'upsert', 'delete', 'create'] as const
    if (!actionable.includes(params.action as (typeof actionable)[number])) return next(params)

    try {
      const entityType = getEntityType(model)

      // Extract id if present in where
      let entityId: string | undefined
      const maybeWhere = (params.args && (params.args as { where?: { id?: string } }).where) || undefined
      if (maybeWhere && typeof maybeWhere.id === 'string') {
        entityId = maybeWhere.id
      }

      // Load before (only when id known and not create)
      let beforeObj: unknown = null
      if (entityId && params.action !== 'create') {
        try {
          beforeObj = await findById(model, entityId)
        } catch {
          // ignore read failures
        }
      }

      // Skip audit logging for pure viewCount updates to avoid noise and false "updates"
      const isPureViewCountUpdate = (() => {
        if (params.action === 'update' && params.args && typeof params.args === 'object') {
          const data = (params.args as { data?: Record<string, unknown> }).data
          if (data && typeof data === 'object') {
            const keys = Object.keys(data)
            // Allow only viewCount and prisma-injected updatedAt in the update payload
            const allowed = new Set(['viewCount', 'updatedAt'])
            return keys.length > 0 && keys.every((k) => allowed.has(k))
          }
        }
        if (params.action === 'upsert' && params.args && typeof params.args === 'object') {
          const update = (params.args as { update?: Record<string, unknown> }).update
          if (update && typeof update === 'object') {
            const keys = Object.keys(update)
            const allowed = new Set(['viewCount', 'updatedAt'])
            return keys.length > 0 && keys.every((k) => allowed.has(k))
          }
        }
        return false
      })()

      if (isPureViewCountUpdate) {
        return next(params) // do not log
      }

      const result = await next(params)

      // Compute action
      let action: AuditActionEnum
      if (params.action === 'delete') action = 'DELETE'
      else if (params.action === 'create') action = 'CREATE'
      else if (params.action === 'upsert' && !beforeObj) action = 'CREATE'
      else action = 'UPDATE'

      // If id was not known earlier (create), try from result
      if (!entityId && result && typeof result === 'object' && 'id' in result) {
        entityId = String((result as { id: string }).id)
      }

      try {
        await prisma.audit_logs.create({
          data: {
            entityType,
            entityId: entityId ?? '',
            action,
            before: beforeObj != null ? toJsonValue(beforeObj) : undefined,
            after: params.action === 'delete' ? undefined : toJsonValue(result),
          },
        })
      } catch {
        // ignore insert failures
      }

      return result
    } catch {
      return next(params)
    }
  })
}

if (!isBrowser && process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

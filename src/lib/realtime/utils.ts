import { TableName, TableRow, FilterBuilder, SubscriptionOptions } from './types'

/**
 * Create a filter builder for type-safe PostgreSQL filters
 */
export function createFilter<T extends TableName>(): FilterBuilder<T> {
  const filters: string[] = []

  const builder: FilterBuilder<T> = {
    eq: (column, value) => {
      filters.push(`${String(column)}=eq.${value}`)
      return builder
    },
    neq: (column, value) => {
      filters.push(`${String(column)}=neq.${value}`)
      return builder
    },
    gt: (column, value) => {
      filters.push(`${String(column)}=gt.${value}`)
      return builder
    },
    gte: (column, value) => {
      filters.push(`${String(column)}=gte.${value}`)
      return builder
    },
    lt: (column, value) => {
      filters.push(`${String(column)}=lt.${value}`)
      return builder
    },
    lte: (column, value) => {
      filters.push(`${String(column)}=lte.${value}`)
      return builder
    },
    in: (column, values) => {
      const valueList = values.map(v => String(v)).join(',')
      filters.push(`${String(column)}=in.(${valueList})`)
      return builder
    },
    like: (column, pattern) => {
      filters.push(`${String(column)}=like.${pattern}`)
      return builder
    },
    ilike: (column, pattern) => {
      filters.push(`${String(column)}=ilike.${pattern}`)
      return builder
    },
    is: (column, value) => {
      const val = value === null ? 'null' : (value === true ? 'true' : 'false')
      filters.push(`${String(column)}=is.${val}`)
      return builder
    },
    and: (subFilters) => {
      const subFilterStrings = subFilters.map(f => f.build())
      filters.push(`and(${subFilterStrings.join(',')})`)
      return builder
    },
    or: (subFilters) => {
      const subFilterStrings = subFilters.map(f => f.build())
      filters.push(`or(${subFilterStrings.join(',')})`)
      return builder
    },
    build: () => filters.join(',')
  }

  return builder
}

/**
 * Common filter patterns for convenience
 */
// TODO: Implement filter patterns when type system is more stable
export const filterPatterns = {
  // Filter patterns temporarily disabled due to type complexity
}

/**
 * Utility functions for real-time data management
 */
export const realtimeUtils = {
  /**
   * Merge new data with existing data, handling duplicates
   */
  mergeData: <T extends TableRow<TableName>>(
    existing: T[],
    newData: T[],
    keyField: keyof T = 'id' as keyof T
  ): T[] => {
    const existingMap = new Map(existing.map(item => [item[keyField], item]))
    
    newData.forEach(item => {
      existingMap.set(item[keyField], item)
    })
    
    return Array.from(existingMap.values())
  },

  /**
   * Remove items from array by key
   */
  removeData: <T extends TableRow<TableName>>(
    existing: T[],
    keysToRemove: unknown[],
    keyField: keyof T = 'id' as keyof T
  ): T[] => {
    const removeSet = new Set(keysToRemove)
    return existing.filter(item => !removeSet.has(item[keyField]))
  },

  /**
   * Update specific items in array
   */
  updateData: <T extends TableRow<TableName>>(
    existing: T[],
    updates: Partial<T> & { [K in keyof T]: T[K] },
    keyField: keyof T = 'id' as keyof T
  ): T[] => {
    return existing.map(item => 
      item[keyField] === updates[keyField] 
        ? { ...item, ...updates }
        : item
    )
  },

  /**
   * Sort data by timestamp fields
   */
  sortByTimestamp: <T extends TableRow<TableName>>(
    data: T[],
    field: keyof T = 'opprettet_dato' as keyof T,
    ascending = false
  ): T[] => {
    return [...data].sort((a, b) => {
      const aTime = new Date(a[field] as string).getTime()
      const bTime = new Date(b[field] as string).getTime()
      return ascending ? aTime - bTime : bTime - aTime
    })
  },

  /**
   * Filter data by search term
   */
  filterBySearch: <T extends TableRow<TableName>>(
    data: T[],
    searchTerm: string,
    searchFields: (keyof T)[]
  ): T[] => {
    if (!searchTerm.trim()) return data
    
    const term = searchTerm.toLowerCase()
    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field]
        return value && String(value).toLowerCase().includes(term)
      })
    )
  },

  /**
   * Group data by field value
   */
  groupBy: <T extends TableRow<TableName>, K extends keyof T>(
    data: T[],
    field: K
  ): Record<string, T[]> => {
    return data.reduce((groups, item) => {
      const key = String(item[field])
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
      return groups
    }, {} as Record<string, T[]>)
  },

  /**
   * Calculate pagination info
   */
  paginate: <T>(
    data: T[],
    page: number,
    pageSize: number
  ): {
    items: T[]
    currentPage: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrev: boolean
  } => {
    const totalItems = data.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const items = data.slice(startIndex, endIndex)

    return {
      items,
      currentPage: page,
      totalPages,
      totalItems,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0

  return (...args: Parameters<T>) => {
    const currentTime = Date.now()

    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

/**
 * Debounce function for batching updates
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Create a batching utility for real-time updates
 */
export function createBatcher<T>(
  processor: (items: T[]) => void,
  delay: number = 100,
  maxBatchSize: number = 50
) {
  let batch: T[] = []
  let timeoutId: NodeJS.Timeout | null = null

  const flush = () => {
    if (batch.length > 0) {
      processor([...batch])
      batch = []
    }
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const add = (item: T) => {
    batch.push(item)

    // Process immediately if batch is full
    if (batch.length >= maxBatchSize) {
      flush()
      return
    }

    // Schedule delayed processing
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(flush, delay)
  }

  const clear = () => {
    batch = []
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return { add, flush, clear, getBatchSize: () => batch.length }
}

/**
 * Retry utility with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw new Error(`Operation failed after ${maxRetries + 1} attempts: ${lastError.message}`)
      }

      const delay = initialDelay * Math.pow(backoffMultiplier, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * Create a subscription ID for tracking
 */
export function createSubscriptionId(table: string, filter?: string): string {
  const filterHash = filter ? btoa(filter).slice(0, 8) : 'all'
  return `${table}_${filterHash}_${Date.now()}`
}

/**
 * Validate subscription options
 */
export function validateSubscriptionOptions<T extends TableName>(
  options: SubscriptionOptions<T>
): string[] {
  const errors: string[] = []

  if (options.throttle && options.throttle < 0) {
    errors.push('Throttle interval must be non-negative')
  }

  if (options.batchDelay && options.batchDelay < 0) {
    errors.push('Batch delay must be non-negative')
  }

  if (options.maxRetries && options.maxRetries < 0) {
    errors.push('Max retries must be non-negative')
  }

  if (options.retryDelay && options.retryDelay < 0) {
    errors.push('Retry delay must be non-negative')
  }

  return errors
}

/**
 * Deep clone utility for immutable updates
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T
  
  const cloned = {} as T
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/**
 * Calculate metrics for performance monitoring
 */
export function calculateMetrics(
  updates: { timestamp: Date }[],
  timeWindow: number = 60000 // 1 minute
) {
  const now = Date.now()
  const recentUpdates = updates.filter(
    update => now - update.timestamp.getTime() <= timeWindow
  )

  const updatesPerSecond = recentUpdates.length / (timeWindow / 1000)
  
  return {
    totalUpdates: updates.length,
    recentUpdates: recentUpdates.length,
    updatesPerSecond: Math.round(updatesPerSecond * 100) / 100,
    timeWindow
  }
}
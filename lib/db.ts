import crypto from 'crypto'

type LimitOrder = {
  id: string
  userAddress: string
  token: string
  action: string
  threshold: number
  amount: number
  slippage: number
  status: string
  createdAt: Date
  updatedAt: Date
  executedAt?: Date | null
  executionPrice?: number | null
  txSignature?: string | null
  privateTxHash?: string | null
  error?: string | null
}

type Deal = {
  id: string
  askId: string
  seller: string
  buyer?: string | null
  token: string
  amount: number
  pricePerUnit: number
  totalPrice: number
  status: string
  privateHash: string
  createdAt: Date
  updatedAt: Date
  negotiatedPrice?: number | null
  negotiatedAmount?: number | null
}

type Escrow = {
  id: string
  dealId: string
  escrowAddress: string
  sellerTokenAccount: string
  buyerSolAccount: string
  status: string
  createdAt: Date
  releasedAt?: Date | null
  txSignature: string
  releaseSignature?: string | null
}

type TokenPrice = {
  id: string
  token: string
  price: number
  volume24h: number
  timestamp: Date
  source: string
}

type SystemLog = {
  id: string
  type: string
  message: string
  metadata?: string | null
  timestamp: Date
}

const globalForDb = globalThis as unknown as {
  prisma: any | undefined
  __mockDb:
    | {
        limitOrders: LimitOrder[]
        deals: Deal[]
        escrows: Escrow[]
        tokenPrices: TokenPrice[]
        systemLogs: SystemLog[]
        telegramUsers: any[]
      }
    | undefined
}

if (!globalForDb.__mockDb) {
  globalForDb.__mockDb = {
    limitOrders: [],
    deals: [],
    escrows: [],
    tokenPrices: [],
    systemLogs: [],
    telegramUsers: [],
  }
}

const mockDb = globalForDb.__mockDb
const now = () => new Date()
const id = () => crypto.randomUUID()

function matchWhere<T extends Record<string, any>>(row: T, where: Record<string, any> = {}): boolean {
  return Object.entries(where).every(([key, value]) => row[key] === value)
}

function orderRows<T>(rows: T[], orderBy?: Record<string, 'asc' | 'desc'>): T[] {
  if (!orderBy) return rows
  const [field, dir] = Object.entries(orderBy)[0]
  return [...rows].sort((a: any, b: any) => {
    if (a[field] === b[field]) return 0
    return dir === 'desc' ? (a[field] < b[field] ? 1 : -1) : a[field] < b[field] ? -1 : 1
  })
}

function createMockPrisma() {
  return {
    limitOrder: {
      create: async ({ data }: any) => {
        const row: LimitOrder = {
          id: id(),
          slippage: 0.5,
          status: 'ACTIVE',
          createdAt: now(),
          updatedAt: now(),
          ...data,
        }
        mockDb.limitOrders.push(row)
        return row
      },
      findMany: async ({ where, orderBy }: any = {}) => orderRows(mockDb.limitOrders.filter((r) => matchWhere(r, where)), orderBy),
      findFirst: async ({ where }: any = {}) => mockDb.limitOrders.find((r) => matchWhere(r, where)) ?? null,
      update: async ({ where, data }: any) => {
        const row = mockDb.limitOrders.find((r) => r.id === where.id)
        if (!row) throw new Error('LimitOrder not found')
        Object.assign(row, data, { updatedAt: now() })
        return row
      },
    },
    tokenPrice: {
      create: async ({ data }: any) => {
        const row: TokenPrice = { id: id(), timestamp: now(), ...data }
        mockDb.tokenPrices.push(row)
        return row
      },
      findFirst: async ({ where, orderBy }: any = {}) => {
        const rows = orderRows(mockDb.tokenPrices.filter((r) => matchWhere(r, where)), orderBy)
        return rows[0] ?? null
      },
    },
    deal: {
      create: async ({ data }: any) => {
        const row: Deal = { id: id(), createdAt: now(), updatedAt: now(), ...data }
        mockDb.deals.push(row)
        return row
      },
      findMany: async ({ where, include, orderBy }: any = {}) => {
        const deals = orderRows(mockDb.deals.filter((r) => matchWhere(r, where)), orderBy)
        return deals.map((d: Deal) => include?.escrow ? { ...d, escrow: mockDb.escrows.find((e: Escrow) => e.dealId === d.id) } : d)
      },
      findUnique: async ({ where }: any) => mockDb.deals.find((d: Deal) => d.id === where.id) ?? null,
      update: async ({ where, data }: any) => {
        const row = mockDb.deals.find((d: Deal) => d.id === where.id)
        if (!row) throw new Error('Deal not found')
        Object.assign(row, data, { updatedAt: now() })
        return row
      },
    },
    telegramUser: {
      create: async ({ data }: any) => {
        const row = { id: id(), createdAt: now(), updatedAt: now(), ...data }
        mockDb.telegramUsers.push(row)
        return row
      },
      findUnique: async ({ where }: any) => {
        if (where.telegramId) {
          return mockDb.telegramUsers.find((u: any) => u.telegramId === where.telegramId) ?? null
        }
        return mockDb.telegramUsers.find((u: any) => u.id === where.id) ?? null
      },
      upsert: async ({ where, update, create }: any) => {
        const existing = mockDb.telegramUsers.find((u: any) => u.telegramId === where.telegramId)
        if (existing) {
          Object.assign(existing, update, { updatedAt: now() })
          return existing
        }
        const row = { id: id(), createdAt: now(), updatedAt: now(), ...create }
        mockDb.telegramUsers.push(row)
        return row
      },
    },
    escrow: {
      create: async ({ data }: any) => {
        const row: Escrow = { id: id(), createdAt: now(), ...data }
        mockDb.escrows.push(row)
        return row
      },
      update: async ({ where, data }: any) => {
        const row = mockDb.escrows.find((r) => (where.id ? r.id === where.id : r.dealId === where.dealId))
        if (!row) throw new Error('Escrow not found')
        Object.assign(row, data)
        return row
      },
    },
    systemLog: {
      create: async ({ data }: any) => {
        const row: SystemLog = { id: id(), timestamp: now(), ...data }
        mockDb.systemLogs.push(row)
        return row
      },
      createMany: async ({ data }: any) => {
        const created = data.map((entry: any) => ({ id: id(), timestamp: now(), ...entry }))
        mockDb.systemLogs.push(...created)
        return { count: created.length }
      },
    },
  }
}

function createPrisma() {
  try {
    const mod = require('@prisma/client')
    const PrismaClient = mod.PrismaClient
    if (!PrismaClient) throw new Error('PrismaClient missing')
    return new PrismaClient()
  } catch (error) {
    console.warn('Prisma unavailable. Falling back to in-memory mock DB.', error)
    return createMockPrisma()
  }
}

export const prisma = globalForDb.prisma ?? createPrisma()

if (process.env.NODE_ENV !== 'production') globalForDb.prisma = prisma

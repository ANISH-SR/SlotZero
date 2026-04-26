import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createOrderSchema = z.object({
  userAddress: z.string(),
  token: z.string(),
  action: z.enum(['BUY', 'SELL']),
  threshold: z.number().positive(),
  amount: z.number().positive(),
  slippage: z.number().min(0).max(5).optional().default(0.5),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = createOrderSchema.parse(body)
    
    const order = await prisma.limitOrder.create({
      data: {
        userAddress: validated.userAddress,
        token: validated.token,
        action: validated.action,
        threshold: validated.threshold,
        amount: validated.amount,
        slippage: validated.slippage,
        status: 'ACTIVE',
      },
    })
    
    await prisma.systemLog.create({
      data: {
        type: 'AGENT_EXECUTION',
        message: `Created ${validated.action} order for ${validated.amount} ${validated.token} at $${validated.threshold}`,
        metadata: JSON.stringify({ orderId: order.id }),
      },
    })
    
    return NextResponse.json({
      orderId: order.id,
      status: 'ACTIVE',
      message: `Order created. Agent will execute when ${validated.token} ${validated.action === 'BUY' ? 'drops to' : 'reaches'} $${validated.threshold}`,
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 400 }
    )
  }
}

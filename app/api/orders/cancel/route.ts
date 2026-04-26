import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const cancelSchema = z.object({
  orderId: z.string(),
  userAddress: z.string(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { orderId, userAddress } = cancelSchema.parse(body)
    
    const order = await prisma.limitOrder.findFirst({
      where: { id: orderId, userAddress },
    })
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    if (order.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Cannot cancel order with status: ${order.status}` },
        { status: 400 }
      )
    }
    
    await prisma.limitOrder.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    })
    
    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
    })
  } catch (error) {
    console.error('Cancel order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel order' },
      { status: 400 }
    )
  }
}

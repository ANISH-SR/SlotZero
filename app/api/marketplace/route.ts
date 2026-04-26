import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'OPEN'
    const token = searchParams.get('token')
    
    const where: any = { status }
    if (token) where.token = token
    
    const deals = await prisma.deal.findMany({
      where,
      include: { escrow: true },
      orderBy: { createdAt: 'desc' },
    })
    
    // Remove sensitive data
    const sanitizedDeals = deals.map((deal: any) => {
      const exposePricing = deal.status === 'COMPLETED' || deal.status === 'ESCROW_CREATED'
      return {
      id: deal.id,
      askId: deal.askId,
      seller: deal.seller.slice(0, 6) + '...' + deal.seller.slice(-4),
      buyer: deal.buyer ? deal.buyer.slice(0, 6) + '...' + deal.buyer.slice(-4) : null,
      token: deal.token,
      amount: deal.amount,
      pricePerUnit: exposePricing ? deal.pricePerUnit : null,
      totalPrice: exposePricing ? deal.totalPrice : null,
      status: deal.status,
      createdAt: deal.createdAt,
      escrowAddress: deal.escrow?.escrowAddress,
    }})
    
    return NextResponse.json({ deals: sanitizedDeals })
  } catch (error) {
    console.error('Get marketplace error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch marketplace' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userAddress = searchParams.get('userAddress')
    const status = searchParams.get('status')
    
    const where: any = {}
    if (userAddress) where.userAddress = userAddress
    if (status) where.status = status
    
    const orders = await prisma.limitOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const proposeDealSchema = z.object({
  dealId: z.string(),
  buyer: z.string(),
  buyerOfferPricePerUnit: z.number().positive().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = proposeDealSchema.parse(body)

    const deal = await prisma.deal.findUnique({
      where: { id: validated.dealId },
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    if (deal.status !== 'OPEN' && deal.status !== 'NEGOTIATING') {
      return NextResponse.json(
        { error: `Cannot negotiate deal in status ${deal.status}` },
        { status: 400 }
      )
    }

    const nextPricePerUnit = validated.buyerOfferPricePerUnit ?? deal.pricePerUnit
    const nextTotal = nextPricePerUnit * deal.amount

    const updated = await prisma.deal.update({
      where: { id: deal.id },
      data: {
        buyer: validated.buyer,
        status: 'NEGOTIATING',
        negotiatedPrice: nextPricePerUnit,
        negotiatedAmount: deal.amount,
        totalPrice: nextTotal,
      },
    })

    await prisma.systemLog.create({
      data: {
        type: 'ESCROW_EVENT',
        message: `Private proposal created for deal ${deal.id}`,
        metadata: JSON.stringify({
          dealId: deal.id,
          askId: deal.askId,
          buyer: `${validated.buyer.slice(0, 6)}...${validated.buyer.slice(-4)}`,
        }),
      },
    })

    return NextResponse.json({
      dealId: updated.id,
      status: updated.status,
      offerAcceptedPricePerUnit: updated.negotiatedPrice ?? updated.pricePerUnit,
      totalPrice: updated.totalPrice,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to propose deal' },
      { status: 400 }
    )
  }
}

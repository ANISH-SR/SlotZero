import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import crypto from 'crypto'

const askSchema = z.object({
  seller: z.string(),
  token: z.string(),
  amount: z.number().positive(),
  pricePerUnit: z.number().positive(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = askSchema.parse(body)
    
    const totalPrice = validated.amount * validated.pricePerUnit
    const privateHash = crypto.randomBytes(32).toString('hex')
    
    const deal = await prisma.deal.create({
      data: {
        askId: crypto.randomUUID(),
        seller: validated.seller,
        token: validated.token,
        amount: validated.amount,
        pricePerUnit: validated.pricePerUnit,
        totalPrice,
        status: 'OPEN',
        privateHash,
      },
    })
    
    return NextResponse.json({
      dealId: deal.id,
      askId: deal.askId,
      status: 'OPEN',
      privateHash: deal.privateHash,
    })
  } catch (error) {
    console.error('Create ask error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create ask' },
      { status: 400 }
    )
  }
}

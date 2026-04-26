import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { magicBlockER } from '@/lib/magicblock-er'
import { z } from 'zod'

const createEscrowSchema = z.object({
  dealId: z.string(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { dealId } = createEscrowSchema.parse(body)

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { escrow: true },
    })

    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    if (!deal.buyer) return NextResponse.json({ error: 'Buyer not set for deal' }, { status: 400 })
    if (deal.escrow) return NextResponse.json({ error: 'Escrow already exists' }, { status: 400 })

    const agreedPricePerUnit = deal.negotiatedPrice ?? deal.pricePerUnit
    const totalPrice = agreedPricePerUnit * deal.amount

    const { transaction, escrowKeypair } = await magicBlockER.buildEscrowTransaction({
      seller: deal.seller,
      buyer: deal.buyer,
      token: deal.token,
      amount: deal.amount,
      price: totalPrice,
    })

    const txResult = await magicBlockER.submitToPrivateER(transaction, [escrowKeypair])

    const updated = await prisma.deal.update({
      where: { id: deal.id },
      data: {
        status: 'ESCROW_CREATED',
        totalPrice,
      },
    })

    await prisma.escrow.create({
      data: {
        dealId: deal.id,
        escrowAddress: escrowKeypair.publicKey.toBase58(),
        sellerTokenAccount: deal.seller,
        buyerSolAccount: deal.buyer,
        status: 'FUNDS_LOCKED',
        txSignature: txResult.signature,
      },
    })

    await prisma.systemLog.create({
      data: {
        type: 'ESCROW_EVENT',
        message: `Escrow created for deal ${deal.id}`,
        metadata: JSON.stringify({
          dealId: deal.id,
          escrowAddress: escrowKeypair.publicKey.toBase58(),
          simulated: txResult.simulated ?? false,
        }),
      },
    })

    return NextResponse.json({
      dealId: updated.id,
      escrowAddress: escrowKeypair.publicKey.toBase58(),
      signature: txResult.signature,
      simulated: txResult.simulated ?? false,
      status: 'FUNDS_LOCKED',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create escrow' },
      { status: 400 }
    )
  }
}

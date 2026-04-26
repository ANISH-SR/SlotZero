import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { magicBlockER } from '@/lib/magicblock-er'
import { Keypair } from '@solana/web3.js'
import { z } from 'zod'

const releaseSchema = z.object({
  dealId: z.string(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { dealId } = releaseSchema.parse(body)

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { escrow: true },
    })

    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    if (!deal.escrow) return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })
    if (deal.status !== 'ESCROW_CREATED') {
      return NextResponse.json({ error: `Deal not releasable in status ${deal.status}` }, { status: 400 })
    }

    const releaseTx = await magicBlockER.buildReleaseEscrow({
      escrowAddress: deal.escrow.escrowAddress,
      recipient: deal.seller,
      amount: deal.totalPrice,
    })

    const releaseResult = await magicBlockER.submitToPrivateER(releaseTx, [Keypair.generate()])

    await prisma.escrow.update({
      where: { dealId: deal.id },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
        releaseSignature: releaseResult.signature,
      },
    })

    await prisma.deal.update({
      where: { id: deal.id },
      data: { status: 'COMPLETED' },
    })

    await prisma.systemLog.create({
      data: {
        type: 'ESCROW_EVENT',
        message: `Escrow released for deal ${deal.id}`,
        metadata: JSON.stringify({
          dealId: deal.id,
          signature: releaseResult.signature,
          simulated: releaseResult.simulated ?? false,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      dealId: deal.id,
      signature: releaseResult.signature,
      simulated: releaseResult.simulated ?? false,
      status: 'COMPLETED',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to release funds' },
      { status: 400 }
    )
  }
}

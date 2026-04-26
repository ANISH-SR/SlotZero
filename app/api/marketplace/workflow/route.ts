import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { magicBlockER } from '@/lib/magicblock-er'
import { Keypair } from '@solana/web3.js'
import { z } from 'zod'
import crypto from 'crypto'

const workflowSchema = z.object({
  seller: z.string(),
  buyer: z.string(),
  token: z.string(),
  amount: z.number().positive(),
  askPricePerUnit: z.number().positive(),
  buyerOfferPricePerUnit: z.number().positive().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = workflowSchema.parse(body)

    const askPricePerUnit = validated.askPricePerUnit
    const agreedPricePerUnit = validated.buyerOfferPricePerUnit ?? askPricePerUnit
    const totalPrice = agreedPricePerUnit * validated.amount
    const askId = crypto.randomUUID()

    // Step 1: Create ask/deal record.
    const createdAsk = await prisma.deal.create({
      data: {
        askId,
        seller: validated.seller,
        token: validated.token,
        amount: validated.amount,
        pricePerUnit: askPricePerUnit,
        totalPrice: askPricePerUnit * validated.amount,
        status: 'OPEN',
        privateHash: crypto.randomBytes(32).toString('hex'),
      },
    })

    // Step 2: Private negotiation.
    const negotiatedDeal = await prisma.deal.update({
      where: { id: createdAsk.id },
      data: {
        buyer: validated.buyer,
        negotiatedPrice: agreedPricePerUnit,
        negotiatedAmount: validated.amount,
        totalPrice,
        status: 'NEGOTIATING',
      },
    })

    // Step 3: Create escrow in Private ER.
    const { transaction: escrowTx, escrowKeypair } = await magicBlockER.buildEscrowTransaction({
      seller: negotiatedDeal.seller,
      buyer: validated.buyer,
      token: negotiatedDeal.token,
      amount: negotiatedDeal.amount,
      price: totalPrice,
    })
    const escrowResult = await magicBlockER.submitToPrivateER(escrowTx, [escrowKeypair])

    await prisma.deal.update({
      where: { id: negotiatedDeal.id },
      data: { status: 'ESCROW_CREATED' },
    })

    const escrow = await prisma.escrow.create({
      data: {
        dealId: negotiatedDeal.id,
        escrowAddress: escrowKeypair.publicKey.toBase58(),
        sellerTokenAccount: negotiatedDeal.seller,
        buyerSolAccount: validated.buyer,
        status: 'FUNDS_LOCKED',
        txSignature: escrowResult.signature,
      },
    })

    // Step 4: Release escrow.
    const releaseTx = await magicBlockER.buildReleaseEscrow({
      escrowAddress: escrow.escrowAddress,
      recipient: negotiatedDeal.seller,
      amount: totalPrice,
    })
    const releaseResult = await magicBlockER.submitToPrivateER(releaseTx, [Keypair.generate()])

    await prisma.escrow.update({
      where: { id: escrow.id },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
        releaseSignature: releaseResult.signature,
      },
    })

    await prisma.deal.update({
      where: { id: negotiatedDeal.id },
      data: { status: 'COMPLETED' },
    })

    await prisma.systemLog.createMany({
      data: [
        {
          type: 'ESCROW_EVENT',
          message: `Workflow ask created: ${createdAsk.id}`,
          metadata: JSON.stringify({ step: 'ASK_CREATED', dealId: createdAsk.id }),
        },
        {
          type: 'ESCROW_EVENT',
          message: `Workflow negotiated: ${negotiatedDeal.id}`,
          metadata: JSON.stringify({ step: 'NEGOTIATED', dealId: negotiatedDeal.id, agreedPricePerUnit }),
        },
        {
          type: 'ESCROW_EVENT',
          message: `Workflow escrow created: ${negotiatedDeal.id}`,
          metadata: JSON.stringify({
            step: 'ESCROW_CREATED',
            dealId: negotiatedDeal.id,
            escrowAddress: escrow.escrowAddress,
            signature: escrowResult.signature,
            simulated: escrowResult.simulated ?? false,
          }),
        },
        {
          type: 'ESCROW_EVENT',
          message: `Workflow completed: ${negotiatedDeal.id}`,
          metadata: JSON.stringify({
            step: 'COMPLETED',
            dealId: negotiatedDeal.id,
            signature: releaseResult.signature,
            simulated: releaseResult.simulated ?? false,
          }),
        },
      ],
    })

    return NextResponse.json({
      success: true,
      dealId: negotiatedDeal.id,
      steps: [
        { name: 'ASK_CREATED', status: 'done', askId, dealId: createdAsk.id },
        { name: 'NEGOTIATED', status: 'done', buyer: validated.buyer, agreedPricePerUnit },
        {
          name: 'ESCROW_CREATED',
          status: 'done',
          escrowAddress: escrow.escrowAddress,
          signature: escrowResult.signature,
          simulated: escrowResult.simulated ?? false,
        },
        {
          name: 'COMPLETED',
          status: 'done',
          releaseSignature: releaseResult.signature,
          simulated: releaseResult.simulated ?? false,
        },
      ],
      finalState: {
        status: 'COMPLETED',
        totalPrice,
        token: validated.token,
        amount: validated.amount,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Workflow failed' },
      { status: 400 }
    )
  }
}

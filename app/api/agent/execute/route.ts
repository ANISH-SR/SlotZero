import { NextResponse } from 'next/server'
import { agentService } from '@/lib/agent-service'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const expected = process.env.CRON_SECRET
    if (expected && authHeader !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await agentService.executePendingOrders()

    await prisma.systemLog.create({
      data: {
        type: 'AGENT_EXECUTION',
        message: `Order executor completed: ${result.executed} executed, ${result.failed} failed`,
      },
    })

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Execution failed' },
      { status: 500 }
    )
  }
}

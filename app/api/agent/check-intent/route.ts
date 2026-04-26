import { NextResponse } from 'next/server'
import { agentService } from '@/lib/agent-service'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const body = await req.json()
    
    // Helius Webhook Signature validation would go here
    
    console.log('👀 Helius Watchtower Ping:', body.type || 'Price Change')

    // Phase 2: Agent checks for intents
    const result = await agentService.executePendingOrders()

    return NextResponse.json({ 
      success: true, 
      processed: result.executed,
      threatsAvoided: result.executed > 0 ? 'MEV SHIELD ACTIVATED' : 'CLEAR'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Watchtower failure' }, { status: 500 })
  }
}

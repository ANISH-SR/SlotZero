import { NextRequest, NextResponse } from 'next/server';
import { eventHub, EVENTS } from '@/lib/event-hub';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Helius webhooks send an array of transactions
    if (Array.isArray(body)) {
      body.forEach((tx: any) => {
        // Basic extraction of relevant data (adapt based on Helius account watch type)
        // For Example: Watch for swap events or token transfers
        const description = tx.description || 'On-chain Event';
        const signature = tx.signature || 'N/A';
        
        console.log(`[Helius Webhook] Event Received: ${description}`);

        // Broadcast a 'new-data' event to the dashboard
        eventHub.emit(EVENTS.NEW_DATA, {
          token: 'SOL', // Simplified for demo; would parse from tx
          description,
          signature,
          source: 'helius_webhook',
          timestamp: new Date().toISOString(),
        });
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Helius Webhook] Error:', err.message);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

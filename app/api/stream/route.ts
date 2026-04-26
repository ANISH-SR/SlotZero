import { NextResponse, after } from 'next/server';
import { eventHub, EVENTS } from '@/lib/event-hub';
import { pusherServer } from '@/lib/pusher-server';

// Optional: Set region close to Pusher 'ap2' (Mumbai) for even lower latency if needed
// export const preferredRegion = 'bom1'; 

const TARGET_TOKENS: Record<string, string> = {
  'JUPyiwrYJFskUPiHa7hkeR8QSeAsPtQQE2CqkbNpu1g': 'JUP',
  'orcaEKTdK7LKpm7Pf3B9qa9yLw17Kaqy9wAxeP9jMQC': 'ORCA',
  'MNDEF5v1xMTzWiwmA8BxPR9nkyAUdqXZAW6gChSE2FD': 'MNDE',
  'COPE9nME6zvJrVrnHfMRvccy2TNNmT8HJZJQ6oGLnUq': 'COPE',
};

/**
 * Live Data Stream Endpoint
 */
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const body = raw ? JSON.parse(raw) : {};

    // 1. Optional QuickNode Webhook verification handling
    if (body && body.test === 'quicknode') {
      return NextResponse.json({ ok: true, msg: 'QuickNode verification successful' });
    }

    // 2. Broadcast via Pusher in the background using Next.js after()
    after(async () => {
      try {
        const payloads = Array.isArray(body) ? body : [body];
        
        // Parse the raw QuickNode Transactions Dataset
        for (const payload of payloads) {
          // Pass-through manual custom test events from curl
          if (payload.token && payload.volume) {
            eventHub.emit(EVENTS.NEW_DATA, payload);
            continue;
          }

          if (!payload.transaction || !payload.meta || payload.meta.err) continue;

          const meta = payload.meta;
          const movements: Record<string, number> = {};

          // Calculate pre-balances
          if (meta.preTokenBalances) {
            for (const pre of meta.preTokenBalances) {
              if (TARGET_TOKENS[pre.mint]) {
                const amount = pre.uiTokenAmount?.uiAmount || 0;
                movements[pre.mint] = (movements[pre.mint] || 0) - amount;
              }
            }
          }

          // Calculate post-balances
          if (meta.postTokenBalances) {
            for (const post of meta.postTokenBalances) {
              if (TARGET_TOKENS[post.mint]) {
                const amount = post.uiTokenAmount?.uiAmount || 0;
                movements[post.mint] = (movements[post.mint] || 0) + amount;
              }
            }
          }

          // Send simplified events to frontend
          for (const [mint, netChange] of Object.entries(movements)) {
            const absVolume = Math.abs(netChange);
            if (absVolume > 0) {
              const parsedEvent = {
                token: TARGET_TOKENS[mint],
                tokenMint: mint,
                volume: absVolume,
                transfers: 1, 
                uniqueWallets: 2
              };
              eventHub.emit(EVENTS.NEW_DATA, parsedEvent);
              // Also broadcast via Pusher for real-time client updates
              await pusherServer.trigger('slotzero-feed', 'new-event', parsedEvent);
            }
          }
        }
      } catch (pusherError: any) {
        console.warn('[Pusher Error]:', pusherError.message);
      }
    });

    return NextResponse.json({ 
      ok: true, 
      source: 'quicknode-stream',
      received_at: new Date().toISOString() 
    });
  } catch (error: any) {
    console.error('[Stream Error]:', error.message);
    return NextResponse.json({ 
      ok: false, 
      error: 'Invalid JSON payload',
      hint: 'Send valid JSON body from QuickNode webhook or curl.'
    }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Live Stream Ingestion Active',
    endpoint: '/api/stream'
  });
}

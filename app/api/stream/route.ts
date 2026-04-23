import { NextResponse, after } from 'next/server';
import { pusherServer } from '@/lib/pusher-server';

// Optional: Set region close to Pusher 'ap2' (Mumbai) for even lower latency if needed
// export const preferredRegion = 'bom1'; 

/**
 * Live Data Stream Endpoint
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Log the ingestion
    console.log('[Live Stream Ingested]:', typeof body === 'object' ? 'JSON Data' : body);

    // 2. Broadcast via Pusher in the background using Next.js after()
    // This allows us to instantly return a 200 OK to QuickNode before Pusher finishes!
    after(async () => {
      try {
        await pusherServer.trigger('slot-zero-monitor', 'new-data', body);
      } catch (pusherError: any) {
        console.warn('[Pusher Warning]: Could not broadcast', pusherError.message);
      }
    });

    return NextResponse.json({ 
      ok: true, 
      received_at: new Date().toISOString() 
    });
  } catch (error: any) {
    console.error('[Stream Error]:', error.message);
    return NextResponse.json({ 
      ok: false, 
      error: 'Invalid JSON payload' 
    }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Live Stream Ingestion Active',
    endpoint: '/api/stream'
  });
}

import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Log the ingestion
    console.log('[Live Stream Ingested]:', typeof body === 'object' ? 'JSON Data' : body);

    // 2. Broadcast the data to the frontend via Pusher
    // We send it to the 'slot-zero-monitor' channel on the 'new-data' event
    try {
      await pusherServer.trigger('slot-zero-monitor', 'new-data', body);
    } catch (pusherError: any) {
      console.warn('[Pusher Warning]: Could not broadcast (check API keys)', pusherError.message);
    }

    // 3. Return the exact response required for verification
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

/**
 * Health check / Verification endpoint
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'Live Stream Ingestion Active',
    endpoint: '/api/stream',
    instructions: 'Send a POST request with JSON to this URL.'
  });
}

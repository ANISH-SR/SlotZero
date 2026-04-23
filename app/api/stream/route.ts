import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher-server';

/**
 * Live Data Stream Endpoint
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Log the ingestion
    console.log('[Live Stream Ingested]:', typeof body === 'object' ? 'JSON Data' : body);

    // 2. Broadcast via Pusher (Server-side)
    try {
      await pusherServer.trigger('slot-zero-monitor', 'new-data', body);
    } catch (pusherError: any) {
      console.warn('[Pusher Warning]: Could not broadcast', pusherError.message);
    }

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

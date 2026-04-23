import { NextResponse } from 'next/server';

/**
 * Live Data Stream Endpoint
 * 
 * Destination URL: https://<your-project>.vercel.app/api/stream
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Process the incoming data (QuickNode/Manual Curl)
    // In a real production setup, we would broadcast this via Pusher or Ably
    console.log('[Live Stream Ingested]:', typeof body === 'object' ? 'JSON Data' : body);

    // 2. Return the exact response required for verification
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

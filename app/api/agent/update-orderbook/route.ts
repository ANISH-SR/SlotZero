import { NextResponse } from 'next/server';
import { eventHub, EVENTS } from '@/lib/event-hub';

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    
    // Support both direct payload and wrapped command/params format
    const body = rawBody.command === 'modifyOrderbook' ? rawBody.params : rawBody;
    
    const { token, bids, asks, currentPrice, priceHistory } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Emit the update to the global hub
    eventHub.emit(EVENTS.ORDERBOOK_UPDATE, {
      token,
      bids: bids || [],
      asks: asks || [],
      currentPrice,
      priceHistory,
    });

    console.log(`[API] Orderbook updated for ${token} via Agent Command`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] Orderbook Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

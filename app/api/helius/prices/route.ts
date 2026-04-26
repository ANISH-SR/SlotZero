import { NextResponse } from 'next/server';
import { fetchTokenPrices } from '@/lib/helius';

export async function GET() {
  try {
    const prices = await fetchTokenPrices();
    return NextResponse.json({ success: true, prices });
  } catch (error) {
    console.error('[API] Failed to fetch prices:', error);
    return NextResponse.json({ success: false, prices: {} }, { status: 500 });
  }
}

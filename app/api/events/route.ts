import { NextRequest } from 'next/server';
import { eventHub, EVENTS } from '@/lib/event-hub';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Helper to send data in SSE format
  const send = (event: string, data: any) => {
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      writer.write(encoder.encode(payload));
    } catch (e) {
      console.error('[SSE] Write error:', e);
    }
  };

  // Listener functions
  const onOrderbookUpdate = (data: any) => send(EVENTS.ORDERBOOK_UPDATE, data);
  const onNewData = (data: any) => send(EVENTS.NEW_DATA, data);
  const onAgentIntent = (data: any) => send(EVENTS.AGENT_INTENT, data);

  // Subscribe to hub
  eventHub.on(EVENTS.ORDERBOOK_UPDATE, onOrderbookUpdate);
  eventHub.on(EVENTS.NEW_DATA, onNewData);
  eventHub.on(EVENTS.AGENT_INTENT, onAgentIntent);

  // Keep-alive interval
  const keepAlive = setInterval(() => {
    try {
      writer.write(encoder.encode(': keep-alive\n\n'));
    } catch (e) {
      clearInterval(keepAlive);
    }
  }, 30000);

  // Cleanup on close
  req.signal.onabort = () => {
    clearInterval(keepAlive);
    eventHub.off(EVENTS.ORDERBOOK_UPDATE, onOrderbookUpdate);
    eventHub.off(EVENTS.NEW_DATA, onNewData);
    eventHub.off(EVENTS.AGENT_INTENT, onAgentIntent);
    writer.close();
  };

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

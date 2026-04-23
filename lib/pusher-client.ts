'use client';

import type PusherType from 'pusher-js';

// Lazily create one Pusher client instance only in the browser.
// This avoids SSR loading the Node.js build of pusher-js
// which has a different export and causes "not a constructor".
let _client: PusherType | null = null;

export function getPusherClient(): PusherType {
  if (typeof window === 'undefined') {
    throw new Error('getPusherClient() must only be called in the browser');
  }
  if (!_client) {
    // Dynamic require at runtime in the browser - guaranteed to get the browser build
    const PusherJS = require('pusher-js');
    const Ctor = PusherJS.default ?? PusherJS;
    _client = new Ctor(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    }) as PusherType;
  }
  return _client;
}

import { EventEmitter } from 'events';

// In Next.js dev mode, the module might be re-evaluated.
// We use a global variable to ensure the emitter is a singleton.
const globalWithEmitter = global as typeof global & {
  dashboardEmitter?: EventEmitter;
};

if (!globalWithEmitter.dashboardEmitter) {
  globalWithEmitter.dashboardEmitter = new EventEmitter();
  // Increase listener limit for multiple dashboard tabs
  globalWithEmitter.dashboardEmitter.setMaxListeners(100);
}

export const eventHub = globalWithEmitter.dashboardEmitter!;

export const EVENTS = {
  ORDERBOOK_UPDATE: 'orderbook-update',
  NEW_DATA: 'new-data',
  AGENT_INTENT: 'agent-intent',
} as const;

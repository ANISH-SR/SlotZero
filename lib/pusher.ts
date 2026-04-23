import PusherClient from 'pusher-js';

// Server-side (for API routes)
// We use a getter to lazy-load the 'pusher' CommonJS module, 
// preventing build-time 'not a constructor' errors.
let pusherServerInstance: any = null;

export const getPusherServer = () => {
  if (!pusherServerInstance) {
    const Pusher = require('pusher');
    pusherServerInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return pusherServerInstance;
};

// Client-side (for React components)
export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

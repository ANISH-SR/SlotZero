import Pusher from 'pusher-js';

// Fix for "not a constructor" error in Next.js environment (SSR + Client)
const PusherClient = (Pusher as any).default || Pusher;

export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

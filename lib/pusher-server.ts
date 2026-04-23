import Pusher from 'pusher';

// next.config.mjs has 'pusher' in serverExternalPackages,
// so Next.js loads it as a native Node.js module at runtime — no bundling issues.
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

import Pusher from 'pusher';

// next.config.mjs has 'pusher' in serverExternalPackages,
// so Next.js loads it as a native Node.js module at runtime — no bundling issues.
const pusherEnabled = Boolean(
  process.env.PUSHER_APP_ID &&
  process.env.NEXT_PUBLIC_PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER
);

const pusher = pusherEnabled
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

export const pusherServer = {
  async trigger(channel: string, event: string, payload: unknown) {
    if (!pusher) return;
    await pusher.trigger(channel, event, payload);
  },
};

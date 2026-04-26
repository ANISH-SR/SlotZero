import { NextRequest, NextResponse } from 'next/server';
import { getTelegramBot, type TelegramUpdate } from '@/lib/telegram-bot';

// Telegram Bot Webhook Handler
// Receives updates from Telegram and processes them

export async function POST(req: NextRequest) {
  try {
    const bot = getTelegramBot();
    
    if (!bot) {
      console.error('[Telegram Webhook] Bot not initialized - check TELEGRAM_BOT_TOKEN');
      return NextResponse.json({ ok: false, error: 'Bot not initialized' }, { status: 500 });
    }

    const update: TelegramUpdate = await req.json();

    // Handle messages
    if (update.message) {
      await bot.handleMessage(update.message);
    }

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      await bot.handleCallback(update.callback_query);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Telegram Webhook] Error:', error);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

// For setting up the webhook initially
export async function GET(req: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 });
    }

    // Get the webhook URL from query param or construct it
    const url = new URL(req.url);
    const webhookUrl = url.searchParams.get('url') || 
      `${url.origin}/api/telegram/webhook`;

    // Set webhook with Telegram
    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        max_connections: 40,
        allowed_updates: ['message', 'callback_query'],
      }),
    });

    const data = await response.json();

    if (data.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook set successfully',
        webhookUrl,
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: data.description,
        webhookUrl,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('[Telegram Webhook] Setup error:', error);
    return NextResponse.json({ error: 'Failed to setup webhook' }, { status: 500 });
  }
}

import { SolanaAgentKit } from 'solana-agent-kit';
import { prisma } from './db';
import { fetchTokenPrices } from './helius';

// Telegram Bot Service for SlotZero
// Integrates with SendAI SDK for natural language trading

const TELEGRAM_API = 'https://api.telegram.org/bot';

export interface TelegramUser {
  id: number;
  username?: string;
  first_name: string;
  walletAddress?: string;
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: { id: number };
  text?: string;
  date: number;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramUser;
    message?: TelegramMessage;
    data: string;
  };
}

export class SlotZeroTelegramBot {
  private token: string;
  private agent: SolanaAgentKit | null = null;

  constructor(token: string) {
    this.token = token;
    this.initializeAgent();
  }

  private async initializeAgent() {
    try {
      const { solanaAgent } = await import('./solana-agent');
      this.agent = solanaAgent;
    } catch (e) {
      console.warn('[Telegram] SendAI agent not available:', e);
    }
  }

  // Send message to Telegram chat
  async sendMessage(chatId: number, text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown') {
    try {
      const response = await fetch(`${TELEGRAM_API}${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.slice(0, 4096), // Telegram limit
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('[Telegram] Failed to send message:', error);
    }
  }

  // Send typing indicator
  async sendTyping(chatId: number) {
    try {
      await fetch(`${TELEGRAM_API}${this.token}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          action: 'typing',
        }),
      });
    } catch (error) {
      console.error('[Telegram] Failed to send typing:', error);
    }
  }

  // Send inline keyboard
  async sendInlineKeyboard(chatId: number, text: string, buttons: { text: string; callback_data: string }[][]) {
    try {
      const response = await fetch(`${TELEGRAM_API}${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons },
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('[Telegram] Failed to send keyboard:', error);
    }
  }

  // Process incoming message
  async handleMessage(message: TelegramMessage) {
    const { chat, text, from } = message;
    const chatId = chat.id;

    // Send typing indicator
    await this.sendTyping(chatId);

    // Store/update user in database
    await this.saveUser(from);

    if (!text) return;

    const command = text.toLowerCase().trim();

    // Handle commands
    if (command === '/start') {
      return this.sendWelcome(chatId, from);
    }

    if (command === '/help') {
      return this.sendHelp(chatId);
    }

    if (command === '/prices' || command === '/price') {
      return this.sendPrices(chatId);
    }

    if (command === '/orders' || command === '/intents') {
      return this.sendActiveOrders(chatId, from.id);
    }

    if (command.startsWith('/buy') || command.startsWith('/sell')) {
      return this.handleQuickOrder(chatId, from.id, command);
    }

    // Natural language processing with SendAI
    return this.handleNaturalLanguage(chatId, from.id, text);
  }

  // Handle button callbacks
  async handleCallback(query: TelegramUpdate['callback_query']) {
    if (!query?.message) return;

    const { data, message, from } = query;
    const chatId = message.chat.id;

    // Acknowledge callback
    await fetch(`${TELEGRAM_API}${this.token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: query.id }),
    });

    if (data.startsWith('price:')) {
      const token = data.split(':')[1].toUpperCase();
      return this.sendTokenPrice(chatId, token);
    }

    if (data.startsWith('order:')) {
      const [, action, token, amount, price] = data.split(':');
      return this.createOrder(chatId, from.id, action as 'BUY' | 'SELL', token, parseFloat(amount), parseFloat(price));
    }

    if (data === 'connect_wallet') {
      return this.sendConnectInstructions(chatId);
    }
  }

  private async sendWelcome(chatId: number, user: TelegramUser) {
    const welcome = `🛡️ *Welcome to SlotZero, ${user.first_name}!*

I'm your AI trading assistant with *MEV protection*. Here's what I can do:

📊 */prices* - Live token prices
🎯 */buy TOKEN amount price* - Set buy intent
💰 */sell TOKEN amount price* - Set sell intent  
📋 */orders* - View your active intents
❓ */help* - Full command list

Or just ask me naturally: *"Buy 100 ORCA when it hits $1.40"*

⚡ Powered by SendAI + MagicBlock Private ER`;

    await this.sendInlineKeyboard(chatId, welcome, [
      [{ text: '💰 View Prices', callback_data: 'price:JUP' }],
      [{ text: '🎯 Create Order', callback_data: 'order:BUY:ORCA:100:1.40' }],
      [{ text: '🔗 Connect Wallet', callback_data: 'connect_wallet' }],
    ]);
  }

  private async sendHelp(chatId: number) {
    const help = `🛡️ *SlotZero Bot Commands*

*Quick Commands:*
• /prices - All token prices
• /price JUP - Specific token price
• /orders - Your active intents

*Create Orders:*
• /buy ORCA 100 1.40
• /sell JUP 500 0.90

*Natural Language:*
• "What's the price of ORCA?"
• "Buy 100 ORCA at 1.40"
• "Show me my orders"
• "Alert me if JUP drops 5%"

*Supported Tokens:* JUP, ORCA, MNDE, COPE

Your orders execute via *Private ER* - invisible to MEV bots!`;

    await this.sendMessage(chatId, help);
  }

  private async sendPrices(chatId: number) {
    const prices = await fetchTokenPrices();

    let message = '📊 *Live Token Prices*\n\n';
    for (const [token, price] of Object.entries(prices)) {
      if (price > 0) {
        message += `*${token}*: $${price.toFixed(4)}\n`;
      }
    }

    const buttons = Object.keys(prices).map(token => ({
      text: token,
      callback_data: `price:${token}`,
    }));

    // Arrange in rows of 2
    const keyboard: { text: string; callback_data: string }[][] = [];
    for (let i = 0; i < buttons.length; i += 2) {
      keyboard.push(buttons.slice(i, i + 2));
    }
    keyboard.push([{ text: '🎯 Create Order', callback_data: 'order:BUY:ORCA:100:1.40' }]);

    await this.sendInlineKeyboard(chatId, message, keyboard);
  }

  private async sendTokenPrice(chatId: number, token: string) {
    const prices = await fetchTokenPrices();
    const price = prices[token] || 0;

    if (price === 0) {
      return this.sendMessage(chatId, `❌ Price not available for ${token}`);
    }

    const message = `💰 *${token}*\nPrice: $${price.toFixed(4)}\n\nCreate an order?`;

    await this.sendInlineKeyboard(chatId, message, [
      [
        { text: '🟢 Buy', callback_data: `order:BUY:${token}:100:${(price * 0.98).toFixed(2)}` },
        { text: '🔴 Sell', callback_data: `order:SELL:${token}:100:${(price * 1.02).toFixed(2)}` },
      ],
      [{ text: '📊 All Prices', callback_data: 'price:ALL' }],
    ]);
  }

  private async handleQuickOrder(chatId: number, userId: number, command: string) {
    const parts = command.split(' ');
    const action = parts[0].replace('/', '').toUpperCase() as 'BUY' | 'SELL';
    const token = parts[1]?.toUpperCase();
    const amount = parseFloat(parts[2]);
    const price = parseFloat(parts[3]);

    if (!token || isNaN(amount) || isNaN(price)) {
      return this.sendMessage(chatId, `❌ Invalid format. Use: /buy ORCA 100 1.40\nOr ask naturally: "Buy 100 ORCA at 1.40"`);
    }

    return this.createOrder(chatId, userId, action, token, amount, price);
  }

  private async createOrder(chatId: number, userId: number, action: 'BUY' | 'SELL', token: string, amount: number, price: number) {
    // Get user from DB
    const user = await prisma.telegramUser.findUnique({ where: { telegramId: userId } });

    if (!user?.walletAddress) {
      return this.sendMessage(chatId, `🔗 *Connect your wallet first!*\n\nGo to the SlotZero dashboard and click "Connect Telegram" to link your wallet.`);
    }

    try {
      // Create order in database
      const order = await prisma.limitOrder.create({
        data: {
          userAddress: user.walletAddress,
          token,
          action,
          threshold: price,
          amount,
          status: 'ACTIVE',
        },
      });

      const emoji = action === 'BUY' ? '🟢' : '🔴';
      const message = `${emoji} *Order Created!*\n\n*${action}* ${amount} ${token}\n*Target Price:* $${price.toFixed(4)}\n*Status:* Active\n*ID:* \`${order.id.slice(0, 8)}...\`\n\n🔒 Protected by Private ER\n⚡ Auto-executes when price hits target`;

      await this.sendMessage(chatId, message);

      // Trigger agent execution
      fetch('/api/agent/execute', { method: 'POST' }).catch(() => { });
    } catch (error) {
      console.error('[Telegram] Failed to create order:', error);
      await this.sendMessage(chatId, `❌ Failed to create order. Please try again.`);
    }
  }

  private async sendActiveOrders(chatId: number, userId: number) {
    const user = await prisma.telegramUser.findUnique({
      where: { telegramId: userId },
      include: { orders: { where: { status: 'ACTIVE' } } }
    });

    if (!user?.orders || user.orders.length === 0) {
      return this.sendMessage(chatId, `📭 *No active orders*\n\nCreate one with: /buy ORCA 100 1.40`);
    }

    let message = `📋 *Your Active Orders*\n\n`;
    user.orders.forEach((order: any, i: number) => {
      const emoji = order.action === 'BUY' ? '🟢' : '🔴';
      message += `${i + 1}. ${emoji} *${order.action}* ${order.amount} ${order.token}\n   @ $${order.threshold.toFixed(4)}\n`;
    });

    message += `\n🔒 All protected by Private ER`;

    await this.sendMessage(chatId, message);
  }

  private async handleNaturalLanguage(chatId: number, userId: number, text: string) {
    const lower = text.toLowerCase();

    // Simple pattern matching (could use OpenAI for better NLP)
    if (lower.includes('price') || lower.includes('how much')) {
      // Extract token
      const tokens = ['jup', 'orca', 'mnde', 'cope'];
      const found = tokens.find(t => lower.includes(t));
      if (found) return this.sendTokenPrice(chatId, found.toUpperCase());
      return this.sendPrices(chatId);
    }

    if (lower.includes('buy') || lower.includes('sell') || lower.includes('order')) {
      // Extract order details with regex
      const buyMatch = text.match(/buy\s+(\d+)\s+(\w+)(?:\s+(?:at|for|when))?\s*\$?(\d+\.?\d*)/i);
      const sellMatch = text.match(/sell\s+(\d+)\s+(\w+)(?:\s+(?:at|for|when))?\s*\$?(\d+\.?\d*)/i);

      if (buyMatch) {
        const [, amount, token, price] = buyMatch;
        return this.createOrder(chatId, userId, 'BUY', token.toUpperCase(), parseInt(amount), parseFloat(price));
      }

      if (sellMatch) {
        const [, amount, token, price] = sellMatch;
        return this.createOrder(chatId, userId, 'SELL', token.toUpperCase(), parseInt(amount), parseFloat(price));
      }

      return this.sendMessage(chatId, `🎯 *Create an Order*\n\nTry:\n• "Buy 100 ORCA at 1.40"\n• "Sell 500 JUP at 0.90"\n\nOr use: /buy ORCA 100 1.40`);
    }

    if (lower.includes('order') || lower.includes('intent')) {
      return this.sendActiveOrders(chatId, userId);
    }

    // Default response using OpenRouter
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        return this.sendMessage(chatId, `🤔 I didn't understand that.\n\nTry:\n• "What's the price of ORCA?"\n• "Buy 100 ORCA at 1.40"\n• /help for all commands`);
      }
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://slot-zero.vercel.app",
          "X-Title": "SlotZero",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "openai/gpt-4o-mini",
          "messages": [
            {
              "role": "system",
              "content": "You are SlotZero, a helpful AI trading assistant for Solana. You can help users check prices, set orders, and understand the crypto market. Answer concisely and politely. DO NOT output markdown formatting that breaks telegram markdown parser, stick to simple text or simple bolding with *asterisks*."
            },
            {
              "role": "user",
              "content": text
            }
          ]
        })
      });

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content;
      
      if (answer) {
        await this.sendMessage(chatId, answer);
      } else {
        await this.sendMessage(chatId, `🤔 I'm having trouble connecting to my brain right now.`);
      }
    } catch (e) {
      console.error('[OpenRouter] Error:', e);
      await this.sendMessage(chatId, `🤔 I didn't understand that.\n\nTry:\n• "What's the price of ORCA?"\n• /help for all commands`);
    }
  }

  private async sendConnectInstructions(chatId: number) {
    const message = `🔗 *Connect Your Wallet*\n\n1. Visit: https://slot-zero.vercel.app/dashboard\n2. Connect your Solana wallet\n3. Click "Connect Telegram" button\n4. Enter this code: \`${chatId}\`\n\nOnce connected, I can create orders on your behalf!`;

    await this.sendMessage(chatId, message);
  }

  private async saveUser(from: TelegramUser) {
    try {
      await prisma.telegramUser.upsert({
        where: { telegramId: from.id },
        update: { username: from.username, firstName: from.first_name },
        create: {
          telegramId: from.id,
          username: from.username,
          firstName: from.first_name,
        },
      });
    } catch (error) {
      console.error('[Telegram] Failed to save user:', error);
    }
  }
}

// Singleton instance
let botInstance: SlotZeroTelegramBot | null = null;

export function getTelegramBot(): SlotZeroTelegramBot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN not set');
    return null;
  }

  if (!botInstance) {
    botInstance = new SlotZeroTelegramBot(token);
  }
  return botInstance;
}

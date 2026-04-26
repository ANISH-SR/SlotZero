const axios = require('axios');

const UPDATE_URL = 'http://localhost:3000/api/agent/update-orderbook';
const CRON_SECRET = process.env.CRON_SECRET || '';

async function runDemo() {
  console.log('🚀 Starting SendAI Orderbook Update Demo...');

  const token = 'ORCA';
  const basePrice = 417.82;
  
  // Create a realistic shift
  const updates = [
    { name: 'Normal State', price: basePrice, spread: 0.05 },
    { name: 'Buy Pressure Spike', price: basePrice + 0.15, spread: 0.02 },
    { name: 'Sell-off Simulation', price: basePrice - 0.25, spread: 0.10 }
  ];

  for (const step of updates) {
    console.log(`\n➡️ Applying: ${step.name}`);
    
    const payload = {
      token,
      currentPrice: step.price,
      priceHistory: Array.from({ length: 40 }, () => step.price + (Math.random() - 0.5) * 0.1),
      bids: Array.from({ length: 5 }, (_, i) => ({
        price: step.price - (i * step.spread) - 0.01,
        amount: Math.floor(Math.random() * 1000) + 100,
        total: 0 // Will calculate in real app or UI
      })).map((b, idx, arr) => ({ ...b, total: arr.slice(0, idx + 1).reduce((acc, curr) => acc + curr.amount, 0) })),
      asks: Array.from({ length: 5 }, (_, i) => ({
        price: step.price + (i * step.spread) + 0.01,
        amount: Math.floor(Math.random() * 1000) + 100,
        total: 0
      })).map((a, idx, arr) => ({ ...a, total: arr.slice(0, idx + 1).reduce((acc, curr) => acc + curr.amount, 0) }))
    };

    try {
      await axios.post(UPDATE_URL, payload, {
        headers: {
          'Authorization': `Bearer ${CRON_SECRET}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Update broadcasted via Pusher.');
    } catch (err) {
      console.error('❌ Failed to update:', err.response?.data || err.message);
    }

    // Wait 3 seconds between steps
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log('\n🏁 Demo completed.');
}

runDemo();

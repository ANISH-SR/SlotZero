'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle, ShieldCheck, Wand2,
  Settings2, ChevronRight, Zap,
  Play, Pause, Plus, Send
} from 'lucide-react'

const TOKENS = ['JUP', 'ORCA', 'MNDE', 'COPE']

export function AgentTradingPanel() {
  const [activeTab, setActiveTab] = useState<'orders' | 'strategy'>('orders')
  const [isDeploying, setIsDeploying] = useState(false)
  const [orderForm, setOrderForm] = useState({
    token: 'ORCA',
    action: 'BUY' as 'BUY' | 'SELL',
    threshold: '1.40',
    amount: '100',
  })

  // Mock Active Orders for Terminal display
  const [orders, setOrders] = useState([
    { id: '1', token: 'ORCA', action: 'BUY', amount: 500, price: 1.38, status: 'WAITING' },
    { id: '2', token: 'JUP', action: 'SELL', amount: 1200, price: 0.89, status: 'WAITING' }
  ])

  const handleDeploy = async () => {
    setIsDeploying(true)

    try {
      // Call the actual API to create a shielded order
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: 'user', // In real app, get from wallet
          token: orderForm.token,
          action: orderForm.action,
          threshold: Number(orderForm.threshold),
          amount: Number(orderForm.amount),
          slippage: 0.5
        })
      })

      const data = await response.json()

      if (data.success) {
        // Add to local state
        setOrders(prev => [{
          id: data.order.id,
          token: orderForm.token,
          action: orderForm.action,
          amount: Number(orderForm.amount),
          price: Number(orderForm.threshold),
          status: 'SHIELDED'
        }, ...prev])

        // Trigger agent execution via SendAI kit
        await fetch('/api/agent/execute', { method: 'POST' })
      }
    } catch (err) {
      console.error('Failed to deploy intent:', err)
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <div className="flex flex-col bg-[#1A1A1E] border border-white/5 rounded-3xl overflow-hidden font-mono">
      {/* Tabs */}
      <div className="flex bg-black/20 p-1 m-4 rounded-xl border border-white/5">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTab === 'orders' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
            }`}
        >
          Active Intents
        </button>
        <button
          onClick={() => setActiveTab('strategy')}
          className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTab === 'strategy' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
            }`}
        >
          Auto Strategy
        </button>
      </div>

      <div className="px-6 pb-6 space-y-6">
        {activeTab === 'orders' ? (
          <div className="space-y-4">
            {/* Quick Order Form */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white outline-none focus:border-indigo-500/50"
                  value={orderForm.token}
                  onChange={e => setOrderForm(s => ({ ...s, token: e.target.value }))}
                >
                  {TOKENS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="flex bg-black/40 border border-white/10 rounded-xl p-0.5">
                  <button
                    onClick={() => setOrderForm(s => ({ ...s, action: 'BUY' }))}
                    className={`flex-1 rounded-lg text-[10px] font-bold ${orderForm.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40'}`}
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => setOrderForm(s => ({ ...s, action: 'SELL' }))}
                    className={`flex-1 rounded-lg text-[10px] font-bold ${orderForm.action === 'SELL' ? 'bg-rose-500/20 text-rose-400' : 'text-white/40'}`}
                  >
                    SELL
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  placeholder="Price Threshold"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white outline-none focus:border-indigo-500/50"
                  value={orderForm.threshold}
                  onChange={e => setOrderForm(s => ({ ...s, threshold: e.target.value }))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-white/20 uppercase font-bold tracking-tighter">USDC</span>
              </div>

              <button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="w-full bg-white text-black py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isDeploying ? (
                  <>
                    <Zap className="w-3 h-3 animate-pulse" />
                    Deploying Shield...
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    New Private Intent
                  </>
                )}
              </button>
            </div>

            {/* Orders List */}
            <div className="pt-4 border-t border-white/5 space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence initial={false}>
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="group bg-white/2 border border-white/5 rounded-xl p-3 hover:bg-white/4 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${order.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {order.action}
                        </span>
                        <span className="text-white text-[11px] font-bold">{order.token}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1 h-1 rounded-full ${order.status === 'SHIELDED' ? 'bg-indigo-400 animate-pulse' : 'bg-white/20'}`} />
                        <span className="text-[9px] text-white/30 uppercase">{order.status}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-white/40">{order.amount} qty</span>
                      <span className="text-white/60">@ ${order.price}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Global MEV Shield</span>
                <div className="w-8 h-4 rounded-full bg-indigo-500/40 relative">
                  <div className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-white shadow-sm" />
                </div>
              </div>
              <p className="text-[9px] text-white/40 leading-relaxed">
                Agent will automatically route all transactions through Private ER if price impact exceeds 0.2%.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-white/40 uppercase">Agent Mode</span>
                <span className="text-[10px] text-white/60">Aggressive</span>
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-white/40 uppercase">Min Liquidity</span>
                <span className="text-[10px] text-white/60">$25k</span>
              </div>
              <div className="flex items-center justify-between px-1 border-t border-white/5 pt-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-bold">OPTIMIZED</span>
                </div>
                <button className="text-[9px] text-white/20 hover:text-white transition-colors">EDIT ARGS</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 bg-black/40 border-t border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Agent Kit: Active</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-white/20 uppercase tracking-widest">API: Helius</span>
            <ChevronRight className="w-2 h-2 text-white/10" />
          </div>
        </div>

        {/* Telegram Connect */}
        <a
          href="https://t.me/slotzero_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/20 text-[#0088cc] hover:bg-[#0088cc]/20 transition-all group"
        >
          <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Connect Telegram Bot</span>
        </a>
      </div>
    </div>
  )
}

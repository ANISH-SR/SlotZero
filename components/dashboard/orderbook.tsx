'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal, ChevronDown, Activity, Shield } from 'lucide-react'

interface OrderEntry {
  price: number
  amount: number
  total: number
}

interface OrderbookProps {
  token: string
  currentPrice: number
  priceHistory: number[]
  asks: OrderEntry[]
  bids: OrderEntry[]
}

const TICK_SIZES = [0.01, 0.05, 0.1, 0.5, 1]

export function Orderbook({ 
  token, 
  currentPrice, 
  priceHistory = [], 
  asks = [], 
  bids = [] 
}: OrderbookProps) {
  const [grouping, setGrouping] = useState(0.01)
  const [showTickMenu, setShowTickMenu] = useState(false)
  const [viewType, setViewType] = useState<'both' | 'bids' | 'asks'>('both')

  // Group and Sort Data
  const { processedBids, processedAsks, maxTotal, spread, spreadPct } = useMemo(() => {
    const groupLevels = (levels: OrderEntry[], step: number, isBid: boolean) => {
      const groups: Record<number, number> = {}
      levels.forEach(l => {
        const rounded = isBid 
          ? Math.floor(l.price / step) * step 
          : Math.ceil(l.price / step) * step
        groups[rounded] = (groups[rounded] || 0) + l.amount
      })

      const sorted = Object.entries(groups)
        .map(([price, amount]) => ({ 
          price: parseFloat(price), 
          amount 
        }))
        .sort((a, b) => isBid ? b.price - a.price : a.price - b.price)

      let runningTotal = 0
      return sorted.map(s => {
        runningTotal += s.amount
        return { ...s, total: runningTotal }
      })
    }

    const b = groupLevels(bids, grouping, true)
    const a = groupLevels(asks, grouping, false)
    
    const max = Math.max(
      ...(b.length ? [b[b.length - 1].total] : [1]),
      ...(a.length ? [a[a.length - 1].total] : [1])
    )

    const spreadVal = (a[0]?.price - b[0]?.price) || 0
    const spreadPctVal = (spreadVal / a[0]?.price) * 100 || 0

    return { 
      processedBids: b.slice(0, 12), 
      processedAsks: a.slice(0, 12), 
      maxTotal: max,
      spread: spreadVal,
      spreadPct: spreadPctVal
    }
  }, [bids, asks, grouping])

  return (
    <div className="flex flex-col w-full max-w-md bg-[#0A0A0B] border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] font-mono select-none">
      
      {/* Header (Title + Menu) */}
      <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-white/[0.03] to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">Shielded Orderbook</h2>
            <p className="text-[10px] text-white/30 uppercase tracking-tighter mt-0.5">Asset: {token}/USDC</p>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowTickMenu(!showTickMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/60 hover:text-white hover:bg-white/10 transition-all font-bold"
          >
            TICK {grouping}
            <ChevronDown className={`w-3 h-3 transition-transform ${showTickMenu ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showTickMenu && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-24 bg-[#1A1A1E] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
              >
                {TICK_SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => { setGrouping(size); setShowTickMenu(false); }}
                    className="w-full px-4 py-2 text-left text-[10px] text-white/40 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    {size}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Center (Bicolor Line Chart) */}
      <div className="h-40 w-full relative bg-gradient-to-b from-[#1A1A1E] to-[#0A0A0B] border-b border-white/5 overflow-hidden">
        <BicolorSparkline data={priceHistory} currentPrice={currentPrice} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.1),transparent)] pointer-events-none" />
        
        <div className="absolute inset-x-6 top-4 flex justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Spread</span>
            <span className="text-xs font-bold text-white">{spread.toFixed(4)} <span className="text-white/20 font-normal">({spreadPct.toFixed(2)}%)</span></span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Mid Price</span>
            <span className="text-xs font-bold text-indigo-400">{currentPrice.toFixed(4)}</span>
          </div>
        </div>

        <div className="absolute bottom-4 left-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            <span className="text-[9px] text-emerald-400/60 font-bold uppercase tracking-widest">Live Agent Feed</span>
        </div>
      </div>

      {/* Mode Selectors */}
      <div className="flex border-b border-white/5 h-10">
        {(['both', 'bids', 'asks'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setViewType(m)}
            className={`flex-1 text-[9px] font-bold uppercase tracking-widest transition-all ${
              viewType === m ? 'text-white bg-white/5 shadow-[inset_0_-2px_0_rgba(99,102,241,1)]' : 'text-white/20 hover:text-white/40'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Table Content */}
      <div className="flex flex-col flex-1 min-h-[300px] overflow-y-auto scrollbar-hide py-2">
        {/* Labels */}
        <div className="grid grid-cols-3 px-6 py-2 text-[9px] font-bold text-white/40 uppercase tracking-widest sticky top-0 bg-[#0A0A0B] z-20">
          <span>Price</span>
          <span className="text-right">Size</span>
          <span className="text-right">Total</span>
        </div>

        {/* Empty State */}
        {processedAsks.length === 0 && processedBids.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <Activity className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-[11px] text-white/40">Waiting for agent orders...</p>
            </div>
          </div>
        )}

        {/* ASKS (Sells) */}
        {(viewType === 'both' || viewType === 'asks') && processedAsks.length > 0 && (
          <div className="flex flex-col-reverse">
            <AnimatePresence initial={false}>
              {processedAsks.map((ask, i) => (
                <motion.div 
                  key={`ask-${ask.price}-${ask.amount}`} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.03 }}
                  className="grid grid-cols-3 px-6 h-6 items-center relative group hover:bg-white/5 transition-colors"
                >
                  <motion.div 
                    className="absolute inset-y-0 right-0 bg-red-500/10 pointer-events-none"
                    initial={{ width: 0 }}
                    animate={{ width: `${(ask.total / maxTotal) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.03 }}
                  />
                  <span className="text-[11px] font-bold text-[#ef4444] z-10">{ask.price.toFixed(4)}</span>
                  <span className="text-[11px] text-right text-white/60 z-10 tabular-nums">{ask.amount.toLocaleString()}</span>
                  <span className="text-[11px] text-right text-white/40 z-10 tabular-nums">{ask.total.toLocaleString()}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Spread Row (Only in 'both' view) */}
        {viewType === 'both' && (
          <div className="px-6 py-2 bg-indigo-500/[0.03] border-y border-white/5 flex items-center justify-center gap-4">
            <Activity className="w-3 h-3 text-indigo-400 opacity-50" />
            <span className="text-[10px] text-indigo-400/60 font-bold uppercase tracking-widest">Spread: {spreadPct.toFixed(3)}%</span>
            <Activity className="w-3 h-3 text-indigo-400 opacity-50" />
          </div>
        )}

        {/* BIDS (Buys) */}
        {(viewType === 'both' || viewType === 'bids') && processedBids.length > 0 && (
          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {processedBids.map((bid, i) => (
                <motion.div 
                  key={`bid-${bid.price}-${bid.amount}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.03 }}
                  className="grid grid-cols-3 px-6 h-6 items-center relative group hover:bg-white/5 transition-colors"
                >
                  <motion.div 
                    className="absolute inset-y-0 right-0 bg-cyan-400/10 pointer-events-none"
                    initial={{ width: 0 }}
                    animate={{ width: `${(bid.total / maxTotal) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.03 }}
                  />
                  <span className="text-[11px] font-bold text-[#22d3ee] z-10">{bid.price.toFixed(4)}</span>
                  <span className="text-[11px] text-right text-white/60 z-10 tabular-nums">{bid.amount.toLocaleString()}</span>
                  <span className="text-[11px] text-right text-white/40 z-10 tabular-nums">{bid.total.toLocaleString()}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer / Meta */}
      <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className={`w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_4px_rgba(99,102,241,1)]`} />
            <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">SendAI v4.1 Node-Verified</span>
         </div>
         <span className="text-[8px] text-white/10 font-bold uppercase tracking-widest">Protocol Version 0.9.1-Beta</span>
      </div>
    </div>
  )
}

function BicolorSparkline({ data, currentPrice }: { data: number[], currentPrice: number }) {
  const points = useMemo(() => {
    if (data.length < 2) return null
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const width = 400
    const height = 100

    const mapped = data.map((val, i) => ({
      x: (i / (data.length - 1)) * width,
      y: height - ((val - min) / range) * height,
    }))

    const d = mapped.reduce((acc, point, i) => {
      return acc + (i === 0 ? `M ${point.x},${point.y}` : ` L ${point.x},${point.y}`)
    }, '')

    return { d, mapped, height, width }
  }, [data])

  if (!points) return null
  
  return (
    <svg 
      viewBox="0 0 400 100" 
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#ef4444" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      <motion.path 
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        d={points.d} 
        fill="none" 
        stroke="url(#chartGrad)" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Current Price Indicator Dot */}
      <motion.circle
          cx={points.mapped[points.mapped.length - 1].x}
          cy={points.mapped[points.mapped.length - 1].y}
          r="2.5"
          fill="#fff"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
      />
    </svg>
  )
}

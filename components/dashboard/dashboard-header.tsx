"use client";

import Link from "next/link";

export function DashboardHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-display text-xl text-white tracking-tight">SLOTZERO</span>
          <span className="font-mono text-[10px] mt-0.5 text-white/40">TM</span>
        </Link>
        <div className="flex items-center gap-3 py-1 px-3 rounded-full bg-white/5 border border-white/10">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-tighter">Powered by</span>
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/magicblock.png"
              alt="Magicblock"
              className="w-5 h-5 object-contain"
            />
            <span className="text-xs font-bold text-white">magicblock</span>
          </div>
        </div>
      </div>
    </header>
  );
}

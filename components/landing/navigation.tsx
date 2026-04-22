"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSolanaClerk } from '@/hooks/use-solana-clerk';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomIcon } from "@/components/icons/phantom-icon";
import { Loader2 } from "lucide-react";

const navLinks = [
  { name: "Capabilities",  href: "#features"      },
  { name: "Process",       href: "#how-it-works"  },
  { name: "Infra",         href: "#infra"          },
  { name: "Integrations",  href: "#integrations"  },
  { name: "Security",      href: "#security"      },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { publicKey } = useWallet();
  const { authenticate, loading: authLoading } = useSolanaClerk();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? "bg-background/80 backdrop-blur-xl border-b border-white/10" 
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div 
          className={`flex items-center justify-between transition-all duration-500 ${
            isScrolled ? "h-16" : "h-20"
          }`}
        >
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <span className="font-display text-2xl text-green-400 tracking-tight">SLOTZERO</span>
            <span className="font-mono text-xs mt-1 text-white/60 uppercase">TM</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-white/70 hover:text-white transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-green-500 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="rounded-full bg-green-500 hover:bg-green-600 text-white px-6 shadow-lg shadow-green-500/20"
                >
                  Dashboard
                </Button>
              </Link>
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8"
                  }
                }}
              />
            </Show>
            <Show when="signed-out">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => authenticate('Phantom')}
                  disabled={authLoading}
                  size="sm"
                  className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 gap-2 border-none shadow-lg shadow-indigo-500/20"
                >
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhantomIcon className="w-4 h-4" />}
                  Login with Phantom
                </Button>
                
                <div className="flex items-center gap-1.5 ml-1 mr-1">
                  <div className="w-px h-6 bg-white/10" />
                </div>

                <SignInButton mode="modal">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-white/70 hover:text-white hover:bg-white/5 cursor-pointer px-4"
                  >
                    Legacy
                  </Button>
                </SignInButton>
              </div>
            </Show>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>
      
      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-background z-40 transition-all duration-500 ${
          isMobileMenuOpen 
            ? "opacity-100 pointer-events-auto" 
            : "opacity-0 pointer-events-none"
        }`}
        style={{ top: 0 }}
      >
        <div className="flex flex-col h-full px-8 pt-28 pb-8">
          <div className="flex-1 flex flex-col justify-center gap-8">
            {navLinks.map((link, i) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-5xl font-display text-white hover:text-green-400 transition-all duration-500 ${
                  isMobileMenuOpen 
                    ? "opacity-100 translate-y-0" 
                    : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: isMobileMenuOpen ? `${i * 75}ms` : "0ms" }}
              >
                {link.name}
              </a>
            ))}
          </div>
          
          <div className="flex flex-col gap-4 pt-8 border-t border-white/5">
            <Show when="signed-out">
              <div className="flex flex-col gap-4">
                <Button
                  onClick={() => {
                    authenticate('Phantom');
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={authLoading}
                  className="w-full h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg gap-3 border-none shadow-lg shadow-indigo-500/20"
                >
                  {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PhantomIcon className="w-5 h-5" />}
                  Login with Phantom
                </Button>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-mono text-white/30 uppercase">or</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <SignInButton mode="modal">
                  <Button 
                    variant="outline" 
                    className="w-full rounded-full h-14 text-lg border-white/20 text-white hover:bg-white/5"
                  >
                    Legacy Sign in
                  </Button>
                </SignInButton>
              </div>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="w-full">
                <Button 
                  className="w-full bg-green-500 text-white rounded-full h-14 text-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Go to Dashboard
                </Button>
              </Link>
            </Show>
          </div>
        </div>
      </div>
    </header>
  );
}

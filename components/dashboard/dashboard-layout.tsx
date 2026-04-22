"use client";

import { DashboardHeader } from "./dashboard-header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background">
      <DashboardHeader />
      
      {/* Spacer for fixed header */}
      <div className="h-16" />
      
      {/* Main dashboard content */}
      <main className="relative">
        {children}
      </main>
    </div>
  );
}

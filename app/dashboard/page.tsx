'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import SlotZeroMonitor from '@/components/dashboard/slot-zero-monitor';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <SlotZeroMonitor />
    </DashboardLayout>
  );
}

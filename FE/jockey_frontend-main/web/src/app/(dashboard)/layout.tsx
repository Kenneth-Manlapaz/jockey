import type { ReactNode } from 'react';
import { SiteNav } from '@web/components/common/site-nav';
import { MobileTabBar } from '@web/components/common/mobile-tab-bar';
import { AccountBoundary } from '@web/features/auth/components/account-boundary';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className="web-shell"><SiteNav /><AccountBoundary>{children}</AccountBoundary><MobileTabBar /></div>;
}
export const dynamic = 'force-dynamic';


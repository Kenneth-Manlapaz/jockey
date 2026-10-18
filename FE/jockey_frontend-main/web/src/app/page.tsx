import { SiteNav } from '@web/components/common/site-nav';
import { MobileTabBar } from '@web/components/common/mobile-tab-bar';
import { RacingCalendar } from '@web/features/racing/components/racing-calendar';
export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <div className="web-shell"><SiteNav /><RacingCalendar query={await searchParams} /><MobileTabBar /></div>;
}
export const dynamic = 'force-dynamic';

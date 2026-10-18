import { RacingCalendar } from '@web/features/racing/components/racing-calendar';
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { return <RacingCalendar query={await searchParams} />; }

import Link from 'next/link';
import { racing, type RacingEvent } from '@web/lib/racing';
import { EventCard } from '@web/features/racing/components/information';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const e = await racing<RacingEvent>(`events/${encodeURIComponent((await params).id)}/`);
  return <main className="web-main racing-page"><Link className="app-back-link" href={`/meeting/${e.meeting_id}`}>← Back to meeting</Link><EventCard event={e} /></main>;
}

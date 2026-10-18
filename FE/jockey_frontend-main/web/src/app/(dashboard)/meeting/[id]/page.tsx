import { racing, dateLabel, type MeetingDetail } from '@web/lib/racing';
import { CalendarBack, RaceRows, EventCard } from '@web/features/racing/components/information';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const m = await racing<MeetingDetail>(`meetings/${encodeURIComponent((await params).id)}/`);
  return <main className="web-main racing-page"><CalendarBack date={m.date} /><section className="dashboard-hero"><span className="eyebrow">RACE MEETING · {m.status}</span><h1>{m.name}</h1><p>{dateLabel(m.date)} · {m.timezone}</p></section><section className="web-card"><h2>Scheduled races</h2><RaceRows races={m.races} /><p className="racing-muted">Source: {m.source || 'Unavailable'}</p></section>{m.announcements.map((a, i) => <article className="web-card" key={i}><h2>{a.title}</h2><p>{a.content}</p><p className="racing-muted">{a.source || 'Source unavailable'}{a.race_id && ` · Race record ${a.race_id}`}</p></article>)}{m.events.map(e => <EventCard key={e.id} event={e} />)}</main>;
}

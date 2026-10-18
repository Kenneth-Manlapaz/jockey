import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api/client';

export default async function GameGuidePage({ params, searchParams }: PageProps<'/games/[id]'>) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const guide = await api.getGameGuide(id);
  if (!guide) notFound();
  const market = guide.title.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  const raceId = String(query.race ?? '');
  const race = raceId ? await api.getRace(raceId) : null;
  if (raceId && !race) notFound();
  const steps = raceId
    ? [`Race ${race?.number} · ${race?.name} is selected.`, `${guide.selectionHint} on the selection screen.`, 'Review your wager before adding it to your bet cart.']
    : ['Choose a race from the schedule.', `${guide.selectionHint} on the selection screen.`, 'Review your wager before confirming your demo ticket.'];
  const proceedHref = raceId ? `/selection/${encodeURIComponent(raceId)}?market=${encodeURIComponent(market)}` : `/races?market=${encodeURIComponent(market)}`;
  return <main className="app-page"><header className="app-page-heading dark"><span>HOW THIS BET WORKS · {guide.number}</span><h1>{guide.title}</h1><p>{guide.description}</p></header><section className="app-section"><h2>How to play</h2>{steps.map((step, index) => <div className="app-guide-step" key={`${index}-${step}`}><span>{index + 1}</span><p>{step}</p></div>)}</section><Link className="button button-accent" href={proceedHref}>Proceed <span aria-hidden="true">→</span></Link></main>;
}

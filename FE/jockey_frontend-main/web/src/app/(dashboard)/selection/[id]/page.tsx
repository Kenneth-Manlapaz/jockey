import { notFound } from 'next/navigation';
import { api } from '@/lib/api/client';
import { RunnerSelector } from '@web/features/bets/components/runner-selector';
import { BetProgress } from '@web/features/bets/components/bet-flow';

export default async function SelectionPage({ params, searchParams }: PageProps<'/selection/[id]'>) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [race, games] = await Promise.all([api.getRace(id), api.getRaceGames(id)]);
  if (!race) notFound();
  const market = String(query.market ?? 'WIN').toUpperCase();
  const game = games.find((item) => item.code === market);
  if (!game) notFound();

  return <main className="app-page bet-flow-page"><BetProgress step={2} /><header className="app-page-heading selection-heading"><span>MAKE SELECTION · {market.replaceAll('_', ' ')}</span><h1>{race.name}</h1><p>Race {race.number} · Select {game.selections_required} {game.selections_required === 1 ? 'runner' : 'runners'}.</p></header><RunnerSelector race={race} market={market} required={game.selections_required} initialRunner={String(query.runner ?? '')} editKey={String(query.edit ?? '')} /></main>;
}

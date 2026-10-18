import Link from 'next/link';
import { ArrowRight, Trophy, WalletCards } from 'lucide-react';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api/client';

const gameHelp: Record<string, string> = {
  WIN: 'Choose the horse you think will finish first.',
  PLACE: 'Choose a horse to finish first or second.',
  FORECAST: 'Pick the first two finishers in the correct order.',
  REVERSE_FORECAST: 'Pick the top two finishers in either order.',
  TRIFECTA: 'Pick the first three finishers in the correct order.',
};

export default async function RaceBetGamePage({ params }: PageProps<'/race/[id]/bet'>) {
  const { id } = await params;
  const [race, games, guides] = await Promise.all([api.getRace(id), api.getRaceGames(id), api.getGameGuides()]);
  if (!race) notFound();

  return <main className="app-page games-page race-game-picker">
    <section className="games-hero">
      <nav className="games-topbar" aria-label="Games header">
        <Link className="games-mark" href={`/race/${race.id}`} aria-label="Back to race"><Trophy size={15} /></Link>
        <strong>Choose a bet</strong>
        <Link className="games-wallet" href="/profile" aria-label="Open profile"><WalletCards size={15} /><i /></Link>
      </nav>
      <div className="games-intro"><span>BETTING · RACE {race.number}</span><h1>Choose your game.</h1><p>{race.name} · Select a bet type to choose your horse.</p></div>
    </section>
    <section className="games-guide-list" aria-label="Choose a betting game">
      {games.map((game, index) => {
        const code = game.code.toUpperCase();
        const guideId = guides.find((guide) => guide.title.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') === code)?.id ?? String(game.id);
        return <Link className="games-guide-card" href={`/games/${encodeURIComponent(guideId)}?race=${encodeURIComponent(race.id)}`} key={game.id}>
          <span className="games-guide-number">{index + 1}</span><span className="games-guide-copy"><strong>{game.name}</strong><small>{gameHelp[code] ?? game.short_description}</small><em>Select {game.selections_required} {game.selections_required === 1 ? 'horse' : 'horses'}{game.is_ordered && game.selections_required > 1 ? ' in order' : ''}</em><b>Bet on {game.name} <i><ArrowRight size={12} /></i></b></span>
        </Link>;
      })}
      {!games.length && <p className="app-empty">No games are available for this race yet.</p>}
    </section>
  </main>;
}

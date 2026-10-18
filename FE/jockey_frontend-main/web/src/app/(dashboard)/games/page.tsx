import Link from 'next/link';
import { ArrowRight, Trophy, WalletCards } from 'lucide-react';
import { api } from '@/lib/api/client';

function gameInstruction(title: string) {
  const code = title.toUpperCase().replaceAll(' ', '_');
  const copy: Record<string, string> = {
    WIN: 'Choose the horse that finishes first.',
    PLACE: 'Choose a horse to finish first or second.',
    FORECAST: 'Pick the first two finishers in order.',
    REVERSE_FORECAST: 'Pick the top two in any order.',
    TRIFECTA: 'Pick the top three finishers in exact order.',
  };
  return copy[code] ?? 'Choose the runners that match the result.';
}

export default async function GamesPage() {
  const guides = await api.getGameGuides();
  return <main className="app-page games-page">
    <section className="games-hero">
      <nav className="games-topbar" aria-label="Games header">
        <Link className="games-mark" href="/dashboard" aria-label="Home"><Trophy size={15} /></Link>
        <strong>Betting games</strong>
        <Link className="games-wallet" href="/profile" aria-label="Open profile and wallet"><WalletCards size={15} /><i /></Link>
      </nav>
      <div className="games-intro"><span>BETTING GAMES</span><h1>Choose how to bet.</h1><p>Pick a bet type to learn how it works, then select a race.</p></div>
    </section>
    <div className="games-guide-list">{guides.map((guide) => <Link className="games-guide-card" href={`/games/${guide.id}`} key={guide.id}>
      <span className="games-guide-number">{guide.number}</span>
      <span className="games-guide-copy"><strong>{guide.title}</strong><small>{gameInstruction(guide.title)}</small><em><span>{guide.selectionHint}</span></em><b>View bet type <i><ArrowRight size={12} /></i></b></span>
    </Link>)}</div>
  </main>;
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '@/lib/api/client';
import { USE_MOCK_API } from '@/lib/config';
import type { MarketType, Race, Runner } from '@/types';

export function BetConfirmation({ race, runners, market }: { race: Race | null; runners: Runner[]; market: string }) {
  const [stake, setStake] = useState(20);
  const [presets, setPresets] = useState([20, 50, 100, 200]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState('');

  useEffect(() => {
    void api.getWagerPresets().then((values) => {
      const amounts = values.map((value) => typeof value === 'object' ? Number(value.amount) : Number(value)).filter((value) => Number.isFinite(value) && value > 0);
      if (amounts.length) setPresets(amounts);
    }).catch(() => undefined);
  }, []);

  async function place() {
    if (!race || !runners.length) return;
    setLoading(true);
    setError('');
    try {
      const placed = await api.placeBets([{
        raceId: race.id,
        raceNumber: race.number,
        raceName: race.name,
        market: market as MarketType,
        stake,
        runners: runners.map((runner) => ({
          raceId: race.id,
          raceLabel: `Race ${race.number} · ${race.name}`,
          runnerNumber: runner.number,
          horse: runner.horse,
          jockey: runner.jockey,
          odds: runner.odds,
          entryId: runner.id,
        })),
      }]);
      setTicket(placed[0]?.ticketNumber ?? '');
      if (USE_MOCK_API) {
        const bets = JSON.parse(localStorage.getItem('pj-web-bets') ?? '[]') as Array<{ id: string }>;
        const id = `${race.id}-${runners.map((runner) => runner.id).join('-')}-${market}`;
        if (!bets.some((bet) => bet.id === id)) {
          localStorage.setItem('pj-web-bets', JSON.stringify([{ id, raceId: race.id, race: String(race.number), runner: runners.map((runner) => `${runner.number} ${runner.horse}`).join(' · '), market, status: 'Pending', placedAt: new Date().toISOString() }, ...bets]));
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not place this bet.');
    } finally {
      setLoading(false);
    }
  }

  if (!race || !runners.length) return <section className="app-empty-card"><strong>No runner selected</strong><small>Choose a runner before placing a play-money bet.</small><Link href="/races">Browse races</Link></section>;
  if (ticket) return <section className="app-empty-card bet-complete-card"><span className="bet-complete-check"><Check size={25} /></span><span>BET PLACED</span><h1>Good luck!</h1><p>Your play-money bet has been sent to the API.</p><small>Ticket {ticket}</small><Link href="/betting-history">View betting history</Link></section>;

  return <section className="app-empty-card bet-complete-card bet-review-card"><span>BET REVIEW · {market}</span><h1>{runners.map((runner) => runner.horse).join(' · ')}</h1><p>Race {race.number} · {runners.map((runner) => `${runner.number} ${runner.jockey} (${runner.odds.toFixed(2)})`).join(' · ')}</p><label>Wager amount (₱)<input aria-label="Wager amount in Philippine pesos" type="number" min={20} max={10000} step={10} value={stake} onChange={(event) => setStake(Number(event.target.value))} /></label><div className="app-chip-row">{presets.map((amount) => <button className={`app-filter${stake === amount ? ' selected' : ''}`} type="button" key={amount} onClick={() => setStake(amount)}>₱{amount}</button>)}</div>{error ? <small className="auth-error" role="alert">{error}</small> : null}<button className="button button-accent" type="button" onClick={() => void place()} disabled={loading || stake < 20 || stake > 10000}>{loading ? 'Placing…' : `Place bet · ₱${stake.toLocaleString()}`}</button><Link href="/betting-history">Betting history</Link></section>;
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Ticket } from 'lucide-react';
import { api } from '@/lib/api/client';
import { USE_MOCK_API } from '@/lib/config';

type DemoBet = { id: string; race: string; runner: string; market: string; status: string; placedAt: string };

export function BetHistoryList() {
  const [bets, setBets] = useState<DemoBet[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (USE_MOCK_API) {
      setBets(JSON.parse(localStorage.getItem('pj-web-bets') ?? '[]') as DemoBet[]);
      return;
    }
    void api.getBets().then((tickets) => setBets(tickets.map((ticket) => ({
      id: ticket.ticketNumber,
      race: String(ticket.raceNumber),
      runner: ticket.selection,
      market: ticket.market,
      status: ticket.status,
      placedAt: ticket.placedAt,
    })))).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load betting history.'));
  }, []);
  if (error) return <section className="app-empty-card"><Ticket size={23} /><strong>Sign in to view tickets</strong><small>{error}</small><Link href="/login">Sign in</Link></section>;
  if (!bets.length) return <section className="app-empty-card"><Ticket size={23} /><strong>No tickets yet</strong><small>Your placed play-money bets will show here.</small><Link href="/races">Explore today’s races</Link></section>;
  return <div className="app-card-list">{bets.map((bet) => <article className="app-bet-ticket" key={bet.id}><div><Ticket size={17} /><span>RACE {bet.race}</span><span className="app-status">{bet.status}</span></div><strong>Runner {bet.runner} · {bet.market}</strong><small>{new Date(bet.placedAt).toLocaleString()}</small></article>)}</div>;
}

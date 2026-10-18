'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { BetProgress } from './bet-flow';

type PlacedTicket = {
  key: string;
  raceId: string;
  raceNumber: number;
  raceName: string;
  market: string;
  runners: Array<{ id: string; number: number; horse: string; jockey: string; odds: number }>;
  stake: number;
  ticketNumber?: string;
};

export function BetCompleteSummary({ count, total }: { count: number; total: number }) {
  const [tickets, setTickets] = useState<PlacedTicket[]>([]);
  useEffect(() => {
    try { setTickets(JSON.parse(localStorage.getItem('pj-web-last-placed') ?? '[]') as PlacedTicket[]); }
    catch { setTickets([]); }
  }, []);

  return <main className="app-page bet-flow-page">
    <div className="bet-flow-shell"><BetProgress step={4} />
      <section className="bet-completion-hero">
        <span className="bet-completion-check"><Check size={28} strokeWidth={2.5} /></span>
        <span className="bet-completion-eyebrow">DEMO BET CONFIRMED</span>
        <h1>Your bets are placed</h1>
        <p>{count} {count === 1 ? 'ticket' : 'tickets'} Â· ₱{total.toFixed(2)} total wager</p>
      </section>
      {tickets.length > 0 && <section className="bet-completion-tickets" aria-label="Placed tickets">
        {tickets.map((ticket, index) => <article className="bet-completion-ticket" key={ticket.key}>
          <div><span>BET {index + 1}{ticket.ticketNumber ? ` · ${ticket.ticketNumber}` : ''}</span><strong>₱{ticket.stake.toFixed(2)}</strong></div>
          <h2>Race {ticket.raceNumber} · {ticket.raceName}</h2>
          <p>{ticket.market.replaceAll('_', ' ')} · {ticket.runners.map((runner) => `${runner.number} ${runner.horse}`).join(' · ')}</p>
        </article>)}
      </section>}
      <div className="bet-flow-actions"><Link className="flow-primary" href="/betting-history">View bet history <ArrowRight size={16} /></Link><Link className="flow-secondary" href="/dashboard">Return to dashboard</Link></div>
    </div>
  </main>;
}

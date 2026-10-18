'use client';

import { useEffect, useState } from 'react';
import { getBetResultMessages, getBetWinNotifications, type FinishedRaceForBet, type ResultBet } from '@/lib/bet-result';
import { api } from '@/lib/api/client';
import { USE_MOCK_API } from '@/lib/config';

type StoredBet = { id?: string; raceId?: string; race?: string; runner?: string; market?: string; selection?: string; status?: string; payoutAmount?: number };

export function ResultBetNote({ race }: { race: FinishedRaceForBet & { resultId?: string } }) {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        let tickets: ResultBet[];
        if (USE_MOCK_API) {
          const stored = JSON.parse(localStorage.getItem('pj-web-bets') ?? '[]') as StoredBet[];
          tickets = stored.map((ticket) => ({
            id: ticket.id,
            raceId: ticket.raceId,
            raceNumber: Number(ticket.race ?? 0),
            market: ticket.market ?? 'WIN',
            selection: ticket.selection ?? ticket.runner ?? '',
            status: ticket.status,
            payoutAmount: ticket.payoutAmount,
          }));
        } else {
          const remote = await api.getBets();
          tickets = remote;
        }
        const fullRace = race.resultId && race.status === 'official'
          ? await api.getResultDetail(race.resultId)
          : null;
        const raceWithPlacings = fullRace ? {
          ...race,
          raceId: fullRace.raceId ?? race.raceId,
          podium: fullRace.podium,
          dividends: fullRace.dividends,
        } : race;
        const result = getBetResultMessages(tickets, raceWithPlacings);
        const wins = getBetWinNotifications(tickets, raceWithPlacings);
        if (wins.length) {
          const prior = JSON.parse(localStorage.getItem('pj-web-notifications') ?? '[]') as Array<{ id?: string }>;
          const known = new Set(prior.map((notification) => notification.id));
          const fresh = wins.filter((notification) => !known.has(notification.id));
          if (fresh.length) localStorage.setItem('pj-web-notifications', JSON.stringify([...fresh, ...prior]));
        }
        if (active) setMessages(result);
      } catch {
        if (active) setMessages([]);
      }
    };
    void load();
    return () => { active = false; };
  }, [race]);

  if (!messages.length) return null;
  return <div className="app-result-bet-notes" role="status">{messages.map((message, index) => <p key={`${index}-${message}`}>{message}</p>)}</div>;
}

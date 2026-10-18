'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import { USE_MOCK_API } from '@/lib/config';

type TicketDraft = {
  key: string;
  raceId: string;
  raceNumber: number;
  raceName: string;
  raceDate?: string;
  postTime?: string;
  market: string;
  runners: Array<{ id: string; number: number; horse: string; jockey: string; odds: number }>;
  stake: number;
};

const STORAGE_KEY = 'pj-web-bet-cart';
const presets = [20, 50, 100, 200];

function readCart(): TicketDraft[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as TicketDraft[]; }
  catch { return []; }
}

export function BetProgress({ step }: { step: 1 | 2 | 3 | 4 }) {
  const labels = ['Games & Guide', 'Selection of Horses & Jockey', 'Bet Cart', 'Review'];
  return <nav className="bet-progress" aria-label="Betting steps">{labels.map((label, index) => <span className={step === index + 1 ? 'current' : step > index + 1 ? 'done' : ''} key={label}><i>{step > index + 1 ? <Check size={12} /> : index + 1}</i><span>{label}</span></span>)}</nav>;
}

export function BetCartFlow() {
  const [items, setItems] = useState<TicketDraft[]>([]);
  useEffect(() => setItems(readCart()), []);
  function remove(key: string) {
    const next = items.filter((item) => item.key !== key);
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return <div className="bet-flow-shell"><BetProgress step={3} />
    <header className="bet-flow-title"><span>{items.length} {items.length === 1 ? 'BET' : 'BETS'} · REVIEW BEFORE CONFIRMING</span><h1>Bet Cart</h1><p>Check each selection before setting your wager.</p></header>
    {items.length ? <div className="bet-ticket-list">{items.map((item, index) => <article className="bet-ticket-card" key={item.key}>
      <div className="bet-ticket-top"><span>BET {index + 1}</span><span className="cart-pill">IN CART</span></div>
      <p className="bet-ticket-race">RACE {item.raceNumber} · {item.raceName.toUpperCase()}</p>
      <div className="bet-ticket-game"><b>{item.market.replaceAll('_', ' ')}</b><span>{item.runners.map((runner) => runner.horse).join(' · ')}</span></div>
      {item.runners.map((runner) => <div className="bet-ticket-runner" key={runner.id}><span className="app-race-number">{runner.number}</span><span><strong>{runner.horse}</strong><small>{runner.jockey}</small></span></div>)}
      <div className="bet-ticket-actions"><Link href={`/selection/${item.raceId}?market=${encodeURIComponent(item.market)}&runner=${encodeURIComponent(item.runners.map((runner) => runner.id).join(','))}&edit=${encodeURIComponent(item.key)}`}><Pencil size={13} /> Edit bet</Link><button type="button" onClick={() => remove(item.key)}><Trash2 size={13} /> Delete</button></div>
    </article>)}</div> : <section className="bet-empty"><strong>Your cart is empty</strong><span>Choose a game and runners to start a bet.</span></section>}
    {items.length > 0 && <div className="bet-cart-total"><span>{items.length} separate tickets</span><strong>Set wager on next step</strong></div>}
    <div className="bet-flow-actions"><Link className="flow-primary" href={items.length ? '/review' : '/games'}>Continue to wager <ArrowRight size={16} /></Link><Link className="flow-secondary" href={items[0] ? `/race/${encodeURIComponent(items[0].raceId)}/bet` : '/games'}>Add another bet</Link></div>
  </div>;
}

export function BetReviewFlow() {
  const router = useRouter();
  const [items, setItems] = useState<TicketDraft[]>([]);
  const [wager, setWager] = useState(50);
  const [wagerByKey, setWagerByKey] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const cart = readCart();
    setItems(cart);
    setWagerByKey(Object.fromEntries(cart.map((ticket) => [ticket.key, ticket.stake || 50])));
    void api.getWagerPresets().then((values) => {
      const amounts = values.map((value) => typeof value === 'object' ? Number(value.amount) : Number(value)).filter((value) => Number.isFinite(value) && value > 0);
      if (amounts.length) setWager(amounts[0]);
    }).catch(() => undefined);
  }, []);
  const total = items.reduce((sum, ticket) => sum + (wagerByKey[ticket.key] ?? wager), 0);
  function changeWager(key: string, amount: number) {
    setWagerByKey((current) => ({ ...current, [key]: amount }));
  }
  async function confirm() {
    if (!items.length) return;
    setBusy(true); setError('');
    const submitted: string[] = [];
    const placedTickets: Array<TicketDraft & { ticketNumber?: string }> = [];
    try {
      for (const item of items) {
        const [placed] = await api.placeBets([{
          raceId: item.raceId, raceNumber: item.raceNumber, raceName: item.raceName,
          market: item.market as import('@/types').MarketType,
          stake: wagerByKey[item.key] ?? wager,
          runners: item.runners.map((runner) => ({ raceId: item.raceId, raceLabel: `Race ${item.raceNumber} · ${item.raceName}`, runnerNumber: runner.number, horse: runner.horse, jockey: runner.jockey, odds: runner.odds, entryId: runner.id })),
        }]);
        submitted.push(item.key);
        placedTickets.push({ ...item, stake: wagerByKey[item.key] ?? wager, ticketNumber: placed?.ticketNumber });
      }
      if (USE_MOCK_API) {
        const prior = JSON.parse(localStorage.getItem('pj-web-bets') ?? '[]') as Array<{ id: string }>;
        const created = items.map((item) => ({ id: item.key, raceId: item.raceId, race: String(item.raceNumber), runner: item.runners.map((runner) => `${runner.number} ${runner.horse}`).join(' · '), market: item.market, status: 'Pending', placedAt: new Date().toISOString() }));
        localStorage.setItem('pj-web-bets', JSON.stringify([...created, ...prior.filter((bet) => !created.some((ticket) => ticket.id === bet.id))]));
      }
      localStorage.setItem('pj-web-last-placed', JSON.stringify(placedTickets));
      localStorage.removeItem(STORAGE_KEY);
      router.replace(`/bet-complete?count=${items.length}&total=${total.toFixed(2)}`);
    } catch (cause) {
      const remaining = items.filter((item) => !submitted.includes(item.key));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      setItems(remaining);
      setError(submitted.length ? 'Some tickets were accepted. The remaining tickets are still in your cart; check bet history before retrying.' : cause instanceof Error ? cause.message : 'Could not place these bets.');
    }
    finally { setBusy(false); }
  }
  return <div className="bet-flow-shell"><BetProgress step={4} /><header className="bet-flow-title"><span>REVIEW BEFORE CONFIRMING</span><h1>Review</h1><p>{items.length} {items.length === 1 ? 'ticket' : 'tickets'} · ₱{total.toFixed(2)} total wager</p></header>
    {!items.length ? <section className="bet-empty"><strong>No bets to review</strong><span>Add a selection from Games &amp; Guide.</span><Link href="/games">Choose a game</Link></section> : <>
      <div className="bet-ticket-list review-list">{items.map((item, index) => <article className="review-ticket" key={item.key}><div className="review-ticket-head"><span>BET {index + 1} OF {items.length}</span><span>{item.postTime ?? 'RACE DAY'}</span></div><small>RACE {item.raceNumber} · {item.raceDate ?? ''}</small><h2>{item.raceName}</h2><div className="review-market"><span>{item.market.replaceAll('_', ' ')}</span><strong>{item.runners.map((runner) => runner.horse).join(' · ')}</strong></div>{item.runners.map((runner) => <div className="bet-ticket-runner" key={runner.id}><span className="app-race-number">{runner.number}</span><span><strong>{runner.horse}</strong><small>{runner.jockey}</small></span><b>{runner.odds.toFixed(2)}</b></div>)}<label className="ticket-wager">Wager per ticket<div className="wager-input"><span>₱</span><input aria-label={`Wager amount for bet ${index + 1}`} type="number" min={20} max={10000} step={10} value={wagerByKey[item.key] ?? wager} onChange={(event) => changeWager(item.key, Number(event.target.value) || 0)} /><small>PHP</small></div><div className="wager-presets">{presets.map((amount) => <button type="button" className={(wagerByKey[item.key] ?? wager) === amount ? 'active' : ''} onClick={() => changeWager(item.key, amount)} key={amount}>₱{amount}</button>)}</div></label></article>)}</div>
      <div className="bet-review-total"><span>Total wager · {items.length} tickets</span><strong>₱{total.toFixed(2)}</strong></div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="bet-flow-actions"><button type="button" className="flow-primary" onClick={() => void confirm()} disabled={busy || items.some((item) => !Number.isFinite(wagerByKey[item.key] ?? wager) || (wagerByKey[item.key] ?? wager) < 20 || (wagerByKey[item.key] ?? wager) > 10000)}>{busy ? 'Confirming…' : 'Confirm'} <Check size={16} /></button><Link className="flow-secondary" href="/bet-cart"><ArrowLeft size={15} /> Back to cart</Link></div>
    </>}
  </div>;
}

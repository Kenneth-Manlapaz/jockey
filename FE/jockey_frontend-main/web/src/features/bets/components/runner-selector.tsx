'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Race } from '@/types';

export function RunnerSelector({ race, market, required, initialRunner, editKey }: { race: Race; market: string; required: number; initialRunner?: string; editKey?: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initialRunner ? initialRunner.split(',').slice(0, required) : []);
  const [added, setAdded] = useState(false);
  const runners = race.runners ?? [];
  const toggle = (id: string) => setSelected((current) => current.includes(id)
    ? current.filter((item) => item !== id)
    : current.length < required ? [...current, id] : current);
  function addToCart() {
    const STORAGE_KEY = 'pj-web-bet-cart';
    let cart: Array<{ key: string }> = [];
    try { cart = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Array<{ key: string }>; } catch { cart = []; }
    const key = editKey || `${race.id}:${market}:${selected.join(',')}`;
    let existingStake = 50;
    if (editKey) {
      const existing = (cart as Array<{ key: string; stake?: number }>).find((item) => item.key === editKey);
      existingStake = existing?.stake ?? 50;
    }
    const ticket = {
      key, raceId: race.id, raceNumber: race.number, raceName: race.name,
      raceDate: race.raceDate, postTime: race.postTime, market,
      runners: runners.filter((runner) => selected.includes(runner.id)).map((runner) => ({ id: runner.id, number: runner.number, horse: runner.horse, jockey: runner.jockey, odds: runner.odds })),
      stake: existingStake,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...cart.filter((item) => item.key !== key && item.key !== editKey), ticket]));
    setAdded(true);
    router.push('/bet-cart');
  }

  return <>
    <p className="runner-selector-hint">Choose {required} runner{required === 1 ? '' : 's'} for {market.replaceAll('_', ' ')}.</p>
    <div className="app-card-list">{runners.map((runner) => {
      const active = selected.includes(runner.id);
      return <button type="button" className={`app-runner-row runner-choice${active ? ' selected' : ''}`} key={runner.id} onClick={() => toggle(runner.id)} aria-pressed={active}>
        <span className="app-race-number">{runner.number}</span><span className="app-row-main"><strong>{runner.horse}</strong><small>{runner.jockey}{runner.trainer ? ` · ${runner.trainer}` : ''}</small></span><span className="app-runner-odds">{runner.odds.toFixed(2)}</span>
      </button>;
    })}</div>
    <div className="runner-selector-footer"><span>{selected.length} bet {selected.length === 1 ? 'selection' : 'selections'} ready</span><button className="flow-primary" type="button" disabled={selected.length !== required || added} onClick={addToCart}>{added ? (editKey ? 'Bet updated' : 'Added to cart') : (editKey ? 'Update bet' : 'Add bet to cart')} <span aria-hidden="true">→</span></button></div>
  </>;
}

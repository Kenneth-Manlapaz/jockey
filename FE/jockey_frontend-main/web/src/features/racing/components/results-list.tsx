'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronRight, Trophy } from 'lucide-react';
import type { ResultSummary } from '@/types';
import { ResultBetNote } from './result-bet-note';

const filters = ['All', 'Official', 'Provisional', 'Cancelled'] as const;

export function ResultsList({ results }: { results: ResultSummary[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const visible = useMemo(() => results.filter((result) => filter === 'All' || result.status === filter.toLowerCase()), [filter, results]);
  return <main className="app-page">
    <header className="app-page-heading"><span>RACE DAY</span><h1>Race Results</h1><p>Thursday, 24 October Â· Official race results</p></header>
    <div className="app-filter-row" aria-label="Filter results">{filters.map((item) => <button type="button" className={`app-filter${filter === item ? ' selected' : ''}`} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
    <div className="app-card-list">{visible.map((result) => <Link className="app-result-card" href={`/result/${result.id}`} key={result.id}>
      <div className="app-result-card-head"><span>RACE {result.raceNumber}</span><span className="app-status">{result.status}</span></div>
      <div className="app-result-winner"><span className="app-winner-medal"><Trophy size={18} /></span><span className="app-row-main"><small>WINNER</small><strong>{result.winner.horse}</strong><small>{result.winner.jockey}</small></span><ChevronRight size={20} /></div>
      <ResultBetNote race={{ resultId: result.id, raceId: result.raceId, raceNumber: result.raceNumber, status: result.status, winner: result.winner.horse }} />
      <div className="app-result-foot"><span>{result.venue}</span><span>{result.postTime} Â· {result.distanceM}m</span></div>
    </Link>)}</div>
  </main>;
}


import Link from 'next/link';
import { api } from '@/lib/api/client';

export default async function TotalizerPage() {
  const pool = await api.getPoolDividend();
  return <main className="app-page"><header className="app-page-heading dark"><span>TOTALIZER · {pool.market}</span><h1>{pool.raceLabel}</h1><p>Demo pool and dividend information.</p></header><section className="app-pool-summary"><small>ESTIMATED DIVIDEND</small><strong>₱{pool.perUnit.toFixed(2)}</strong><span>Per ₱1 winning unit</span></section><div className="app-section-title"><h2>Pool distribution</h2><span>₱{pool.totalPool.toLocaleString()}</span></div><div className="app-card-list">{pool.distribution.map((item, index) => <div className="app-market-row" key={`${item.label}-${index}`}><span>{item.label}</span><strong>{item.percent}%</strong></div>)}</div><Link className="button button-accent" href="/races">Browse races</Link></main>;
}

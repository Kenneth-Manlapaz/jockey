import { Gift } from 'lucide-react';
import { api } from '@/lib/api/client';

export default async function RewardsPage() {
  const rewards = await api.getRewards();
  return <main className="app-page"><header className="app-page-heading"><span>MEMBER PERKS</span><h1>Rewards</h1><p>{rewards.points.toLocaleString()} demo points</p></header><div className="app-card-list">{rewards.rewards.map((reward) => <article className="app-guide-card" key={reward.id}><span className="app-guide-icon"><Gift size={18} /></span><span><strong>{reward.title}</strong><small>{reward.description} · {reward.pointsCost} points</small></span></article>)}</div></main>;
}

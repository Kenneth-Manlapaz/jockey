import { BetCompleteSummary } from '@web/features/bets/components/bet-complete-summary';

export default async function BetCompletePage({ searchParams }: PageProps<'/bet-complete'>) {
  const query = await searchParams;
  const count = Math.max(0, Number(query.count ?? 0) || 0);
  const total = Math.max(0, Number(query.total ?? 0) || 0);
  return <BetCompleteSummary count={count} total={total} />;
}

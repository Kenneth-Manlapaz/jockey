import { BetHistoryList } from '@web/features/bets/components/bet-history-list';

export default function BettingHistoryPage() {
  return <main className="app-page"><header className="app-page-heading"><span>YOUR ACCOUNT</span><h1>My Bets</h1><p>Review your tickets and check each bet’s status.</p></header><BetHistoryList /></main>;
}

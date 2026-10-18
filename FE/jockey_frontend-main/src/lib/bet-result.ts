import type { ResultStatus } from '@/types';

export interface ResultBet {
  id?: string;
  raceId?: string;
  raceNumber: number;
  market: string;
  selection: string;
  status?: string;
  payoutAmount?: number;
  stake?: number;
}

export interface FinishedRaceForBet {
  raceId?: string;
  raceNumber: number;
  status: ResultStatus;
  winner: string;
  podium?: { horse: string; place: number; number?: number }[];
  dividends?: { market: string; selection: string; amount: number; unitStake?: number }[];
}

function normalizeHorse(name: string) {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase();
}

function selectedHorses(selection: string) {
  return selection
    .split(/\s*(?:\u00b7|\u00c2\u00b7|,|\|)\s*/u)
    .map((item) => item.replace(/^\s*\d+[A-Z]?\s+/i, '').trim())
    .filter(Boolean);
}

function selectedNumbers(selection: string) {
  return [...selection.matchAll(/(?:^|\s*[·,|]\s*)(\d+)[A-Z]?\s+/gu)].map((match) => Number(match[1]));
}

function normalizedMarket(market: string) {
  return market.toUpperCase().replaceAll(' ', '_');
}

export function getBetResultMessages(tickets: ResultBet[], race: FinishedRaceForBet) {
  const matching = tickets.filter((ticket) => ticket.raceId && race.raceId
    ? ticket.raceId === race.raceId
    : ticket.raceNumber === race.raceNumber);
  if (!matching.length) return [];
  if (race.status === 'cancelled') return matching.map((ticket) =>
    `Your ${ticket.market.replaceAll('_', ' ')} bet was voided because the race was cancelled.`);

  if (race.status !== 'official') return matching.map((ticket) => {
    if (ticket.status?.toLowerCase() === 'won') return `Your ${ticket.market.replaceAll('_', ' ')} bet won${ticket.payoutAmount == null ? '' : ` · payout PHP ${ticket.payoutAmount.toFixed(2)}`}.`;
    if (ticket.status?.toLowerCase() === 'lost') return `Your ${ticket.market.replaceAll('_', ' ')} bet did not win.`;
    if (ticket.status?.toLowerCase() === 'void') return `Your ${ticket.market.replaceAll('_', ' ')} bet was voided.`;
    return `Race ${race.raceNumber} result is provisional. Your bet is waiting for the official result.`;
  });

  const podium = [...(race.podium ?? [])].sort((a, b) => a.place - b.place);
  const firstTwo = podium.slice(0, 2).map((entry) => normalizeHorse(entry.horse));
  const firstThree = podium.slice(0, 3).map((entry) => normalizeHorse(entry.horse));
  const winner = normalizeHorse(race.winner);

  return matching.map((ticket) => {
    const market = normalizedMarket(ticket.market);
    const picks = selectedHorses(ticket.selection).map(normalizeHorse);
    const selectionLabel = selectedHorses(ticket.selection).join(', ') || 'your selection';
    const pickNumbers = selectedNumbers(ticket.selection);
    const marketDividends = race.dividends?.filter((dividend) => normalizedMarket(dividend.market) === market) ?? [];
    const combinationNumbers = ['REVERSE_FORECAST', 'BOX_TRIFECTA'].includes(market)
      ? [...pickNumbers].sort((a, b) => a - b)
      : pickNumbers;
    const combination = combinationNumbers.join('-');
    const matchedDividend = marketDividends.find((dividend) => dividend.selection === combination);
    let hit: boolean | undefined;

    if (ticket.status?.toLowerCase() === 'won') hit = true;
    else if (ticket.status?.toLowerCase() === 'lost' || ticket.status?.toLowerCase() === 'void') hit = false;
    else if (marketDividends.length && pickNumbers.length) {
      hit = Boolean(matchedDividend);
    } else if (market === 'WIN') hit = picks.includes(winner);
    else if (market === 'PLACE' && podium.length) hit = picks.some((pick) => firstTwo.includes(pick));
    else if (market === 'FORECAST' && firstTwo.length === 2) hit = firstTwo.every((horse, index) => picks[index] === horse);
    else if (market === 'REVERSE_FORECAST' && firstTwo.length === 2) hit = firstTwo.every((horse) => picks.includes(horse)) && picks.length === 2;
    else if (market === 'TRIFECTA' && firstThree.length === 3) hit = firstThree.every((horse, index) => picks[index] === horse);
    else if (market === 'BOX_TRIFECTA' && firstThree.length === 3) hit = firstThree.every((horse) => picks.includes(horse)) && picks.length === 3;

    if (hit === true) {
      const marketName = ticket.market.replaceAll('_', ' ');
      if (ticket.payoutAmount != null) {
        return `Your ${marketName} bet won. Your selection: ${selectionLabel}. Payout: PHP ${ticket.payoutAmount.toFixed(2)}.`;
      }
      const unitStake = matchedDividend?.unitStake ?? 10;
      return `Your ${marketName} bet won. Your selection: ${selectionLabel}.${matchedDividend ? ` Winning dividend: PHP ${matchedDividend.amount.toFixed(2)} per PHP ${unitStake.toFixed(2)} stake.` : ''}`;
    }
    if (hit === false) return `Your ${ticket.market.replaceAll('_', ' ')} bet did not win. You selected ${selectionLabel}; the winner was ${race.winner}.`;
    return `You placed a ${ticket.market.replaceAll('_', ' ')} bet on ${selectionLabel}. The winner was ${race.winner}; check the official dividends for this bet.`;
  });
}

export interface BetWinNotification {
  [key: string]: unknown;
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  href: string;
}

/** Creates stable, in-app alerts for winning tickets after an official result is published. */
export function getBetWinNotifications(
  tickets: ResultBet[],
  race: FinishedRaceForBet & { resultId?: string },
): BetWinNotification[] {
  if (race.status !== 'official') return [];

  return tickets.flatMap((ticket) => {
    const result = getBetResultMessages([ticket], race)[0];
    if (!result?.includes(' bet won.')) return [];

    const id = `bet-win:${race.resultId ?? race.raceId ?? race.raceNumber}:${ticket.id ?? `${ticket.market}:${ticket.selection}`}`;
    const payout = ticket.payoutAmount;
    const payoutText = payout == null
      ? ' Your winning payout will be added to your JockeyPH demo wallet after the ticket is settled.'
      : ` ₱${payout.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been credited to your JockeyPH demo wallet.`;
    return [{
      id,
      title: `You won your ${ticket.market.replaceAll('_', ' ')} bet!`,
      message: `Race ${race.raceNumber}: your selection ${ticket.selection} matched the official result.${payoutText}`,
      created_at: new Date().toISOString(),
      is_read: false,
      href: race.resultId ? `/result/${race.resultId}` : '/results',
    }];
  });
}

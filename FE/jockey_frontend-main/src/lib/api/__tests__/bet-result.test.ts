import { getBetResultMessages } from '@/lib/bet-result';

const officialRace = {
  raceId: '12',
  raceNumber: 1,
  status: 'official' as const,
  winner: 'Golden Victory',
  podium: [
    { place: 1, number: 1, horse: 'Golden Victory' },
    { place: 2, number: 2, horse: 'Midnight Thunder' },
    { place: 3, number: 3, horse: 'Royal Champion' },
  ],
  dividends: [
    { market: 'WIN', selection: '1', amount: 31, unitStake: 10 },
    { market: 'PLACE', selection: '1', amount: 14, unitStake: 10 },
    { market: 'FORECAST', selection: '1-2', amount: 142, unitStake: 10 },
  ],
};

describe('getBetResultMessages', () => {
  it('does not show a bet message when the user has no bet on this race', () => {
    expect(getBetResultMessages([], officialRace)).toEqual([]);
  });

  it('matches tickets by race ID instead of a reused race number', () => {
    const tickets = [
      { raceId: '99', raceNumber: 1, market: 'WIN', selection: '1 Golden Victory' },
    ];
    expect(getBetResultMessages(tickets, officialRace)).toEqual([]);
  });

  it('uses official dividends to evaluate a pending ticket', () => {
    const tickets = [
      { raceId: '12', raceNumber: 1, market: 'WIN', selection: '1 Golden Victory', status: 'Pending' },
    ];
    expect(getBetResultMessages(tickets, officialRace)).toEqual([
      'Your WIN bet won. Your selection: Golden Victory. Winning dividend: PHP 31.00 per PHP 10.00 stake.',
    ]);
  });

  it('shows the ticket payout when the backend has settled a winning bet', () => {
    const tickets = [
      { raceId: '12', raceNumber: 1, market: 'WIN', selection: '1 Golden Victory', status: 'Won', payoutAmount: 155 },
    ];
    expect(getBetResultMessages(tickets, officialRace)[0]).toContain('Payout: PHP 155.00.');
  });

  it('does not mark a third-place runner as a place winner when it is not in the dividend', () => {
    const tickets = [
      { raceId: '12', raceNumber: 1, market: 'PLACE', selection: '3 Royal Champion', status: 'Pending' },
    ];
    expect(getBetResultMessages(tickets, officialRace)[0]).toContain('bet did not win');
  });

  it('keeps a pending ticket unresolved while a result is provisional', () => {
    const tickets = [
      { raceId: '12', raceNumber: 1, market: 'WIN', selection: '1 Golden Victory', status: 'Pending' },
    ];
    expect(getBetResultMessages(tickets, { ...officialRace, status: 'provisional' })[0]).toContain('waiting for the official result');
  });
});

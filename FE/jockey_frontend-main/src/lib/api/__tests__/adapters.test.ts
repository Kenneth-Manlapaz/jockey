import {
  toAuthUser,
  toBetTicket,
  toGameGuide,
  toRace,
  toResultDetail,
  toResultSummary,
  toRunner,
} from '@/lib/api/adapters';
import type {
  DTOAuthUser,
  DTOBet,
  DTOEntry,
  DTOGame,
  DTORaceSummary,
  DTOResult,
} from '@/lib/api/types';

const raceSummary: DTORaceSummary = {
  id: 1,
  race_number: 1,
  name: 'Maiden Sprint',
  race_date: '2026-10-13',
  post_time: '2026-10-13T13:30:00+08:00',
  distance_m: 1200,
  surface: 'turf',
  track_condition: 'good',
  status: 'upcoming',
  entries_count: 6,
  purse_amount: '1200000.00',
  purse_currency: 'PHP',
  is_featured: false,
  is_live: false,
  hero_image_url: null,
  venue_name: 'Sample Racing Venue',
  club_name: 'Philippine Racing Club',
  is_demo: true,
};

const entry: DTOEntry = {
  id: 1,
  race_id: 1,
  horse_id: 1,
  horse_number: 1,
  badge_color: '#C9A24D',
  horse_name: 'Golden Victory',
  horse_photo: null,
  jockey_name: 'Marco de León',
  trainer_name: 'E. Villanueva',
  owner_name: 'Crown Estate Stable',
  weight_kg: '58.0',
  current_odds: '3.10',
  status: 'confirmed',
};

const result: DTOResult = {
  id: 1,
  status: 'official',
  race: { ...raceSummary, status: 'completed' },
  winning_time: '1:12.84',
  winning_time_ms: 72840,
  track_condition: 'good',
  posted_at: '2026-10-13T17:00:00+08:00',
  made_official_at: '2026-10-13T17:05:00+08:00',
  placements: [
    {
      finish_position: 1,
      horse_number: 1,
      horse_name: 'Golden Victory',
      jockey_name: 'Marco de León',
      final_odds: '3.10',
    },
    {
      finish_position: 2,
      horse_number: 2,
      horse_name: 'Midnight Thunder',
      jockey_name: 'Luis Mercado',
      final_odds: '3.80',
    },
  ],
  dividends: [{ game: 'WIN', combination: '1', dividend_amount: '31.00', unit_stake: '10.00' }],
};

const authUser: DTOAuthUser = {
  id: 42,
  first_name: 'Isabella',
  last_name: 'Santos',
  email: 'isabella@example.com',
  mobile_number: '+639171234567',
  avatar_url: null,
  initials: 'IS',
  role: 'bettor',
};

describe('adapters', () => {
  it('maps an auth user, defaulting wallet fields', () => {
    expect(toAuthUser(authUser)).toEqual({
      id: '42',
      firstName: 'Isabella',
      lastName: 'Santos',
      email: 'isabella@example.com',
      mobile: '+639171234567',
      initials: 'IS',
      memberSince: '',
      balance: 0,
      currency: '₱',
    });
  });

  it('maps an entry to a runner, coercing decimals', () => {
    expect(toRunner(entry)).toEqual({
      id: '1',
      horseId: '1',
      number: 1,
      horse: 'Golden Victory',
      jockey: 'Marco de León',
      trainer: 'E. Villanueva',
      odds: 3.1,
      weightKg: 58,
      silkColor: '#C9A24D',
      photoUrl: undefined,
      owner: 'Crown Estate Stable',
      status: 'confirmed',
    });
  });

  it('maps a race summary and formats the post time', () => {
    const race = toRace(raceSummary);
    expect(race).toMatchObject({
      id: '1',
      number: 1,
      name: 'Maiden Sprint',
      venue: 'Sample Racing Venue',
      distanceM: 1200,
      entries: 6,
      status: 'upcoming',
    });
    expect(race.postTime).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    expect(race.runners).toBeUndefined();
  });

  it('maps nested entries when present on the detail payload', () => {
    const race = toRace({
      ...raceSummary,
      description: null,
      age_restriction: null,
      entries: [entry],
    });
    expect(race.runners).toHaveLength(1);
    expect(race.runners?.[0]?.horse).toBe('Golden Victory');
  });

  it('derives the winner and status for a result summary', () => {
    const summary = toResultSummary(result);
    expect(summary).toMatchObject({
      id: '1',
      raceId: '1',
      raceNumber: 1,
      status: 'official',
      winner: { horse: 'Golden Victory', jockey: 'Marco de León' },
      venue: 'Sample Racing Venue',
      distanceM: 1200,
      time: '1:12.84',
    });
  });

  it('builds a result detail with podium and dividends', () => {
    const detail = toResultDetail(result);
    expect(detail.raceName).toBe('Maiden Sprint');
    expect(detail.trackCondition).toBe('Good');
    expect(detail.podium).toHaveLength(2);
    expect(detail.podium[0]).toMatchObject({ place: 1, number: 1, horse: 'Golden Victory' });
    expect(detail.dividends).toEqual([{ market: 'WIN', selection: '1', amount: 31, unitStake: 10 }]);
  });

  it('maps a bet to a ticket, labelling selections', () => {
    const bet: DTOBet = {
      ticket_number: 'PJA-DEMO-251024-0042',
      status: 'pending',
      is_simulated: true,
      race: { id: 7, race_number: 3, name: "Champions' Mile", race_date: '2026-10-13' },
      game: 'WIN',
      game_name: 'Win',
      wager_amount: '50.00',
      odds_snapshot: '3.10',
      estimated_return: '155.00',
      payout_amount: null,
      placed_at: '2025-10-24T06:48:00.000Z',
      settled_at: null,
      selections: [
        { leg_position: 1, horse_number: 1, horse_name: 'Golden Victory', odds_snapshot: '3.10' },
      ],
    };

    expect(toBetTicket(bet)).toEqual({
      id: 'PJA-DEMO-251024-0042',
      raceId: '7',
      ticketNumber: 'PJA-DEMO-251024-0042',
      raceLabel: "Race 3 · Champions' Mile",
      raceName: "Champions' Mile",
      raceNumber: 3,
      market: 'WIN',
      selection: '1 Golden Victory',
      runnerNumber: 1,
      stake: 50,
      odds: 3.1,
      placedAt: '2025-10-24T06:48:00.000Z',
      status: 'Pending',
      payoutAmount: undefined,
    });
  });

  it('preserves unknown game codes and maps unknown bet statuses safely', () => {
    const bet: DTOBet = {
      ticket_number: 'PJA-DEMO-251024-0043',
      status: 'ghosted',
      is_simulated: true,
      race: { id: 7, race_number: 4, name: 'Heritage Cup', race_date: '2026-10-13' },
      game: 'SUPER_YANKEE',
      game_name: 'Unknown',
      wager_amount: '0.00',
      odds_snapshot: '1.00',
      estimated_return: null,
      payout_amount: null,
      placed_at: '2025-10-24T07:00:00.000Z',
      settled_at: null,
      selections: [],
    };

    const ticket = toBetTicket(bet);
    expect(ticket.market).toBe('SUPER_YANKEE');
    expect(ticket.status).toBe('Pending');
    expect(ticket.runnerNumber).toBeUndefined();
    expect(ticket.selection).toBe('');
  });

  it('maps a game to a guide, expanding the code and pick count', () => {
    const game: DTOGame = {
      id: 4,
      code: 'REVERSE_FORECAST',
      name: 'Reverse Forecast',
      short_description: 'Pick the first two in either order.',
      selections_required: 2,
      is_ordered: false,
      min_wager: '20.00',
      max_wager: '10000.00',
    };
    expect(toGameGuide(game, 3)).toEqual({
      id: '4',
      number: 4,
      title: 'REVERSE FORECAST',
      description: 'Pick the first two in either order.',
      selectionHint: 'Select 2 horses',
    });
  });
});

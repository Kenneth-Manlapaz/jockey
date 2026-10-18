import {
  getBet,
  getRace,
  getRaceResult,
  listBets,
  listGames,
  listRaceEntries,
  listRaces,
  placeBet,
} from '@/lib/api/endpoints';
import { API_BASE_URL } from '@/lib/config';

const fetchMock = jest.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

beforeAll(() => {
  global.fetch = fetchMock as unknown as typeof fetch;
});

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(jsonResponse({ count: 0, next: null, previous: null, results: [] }));
});

function lastUrl() {
  return fetchMock.mock.calls[0][0] as string;
}

describe('endpoints', () => {
  it('lists races without a query string when there are no params', async () => {
    await listRaces();
    expect(lastUrl()).toBe(`${API_BASE_URL}/races/`);
  });

  it('serialises race filters and drops undefined values', async () => {
    await listRaces({ date: '2026-10-13', status: 'upcoming', featured: true });
    expect(lastUrl()).toBe(`${API_BASE_URL}/races/?date=2026-10-13&status=upcoming&featured=true`);
  });

  it('hits the race detail route', async () => {
    await getRace(7);
    expect(lastUrl()).toBe(`${API_BASE_URL}/races/7/`);
  });

  it('hits the race entries route', async () => {
    await listRaceEntries(7);
    expect(lastUrl()).toBe(`${API_BASE_URL}/races/7/entries/`);
  });

  it('hits the race result route', async () => {
    await getRaceResult(7);
    expect(lastUrl()).toBe(`${API_BASE_URL}/races/7/results/`);
  });

  it('lists games', async () => {
    await listGames();
    expect(lastUrl()).toBe(`${API_BASE_URL}/games/`);
  });

  it('lists bets with a status filter', async () => {
    await listBets({ status: 'pending' });
    expect(lastUrl()).toBe(`${API_BASE_URL}/bets/?status=pending`);
  });

  it('hits the bet detail route', async () => {
    await getBet(11);
    expect(lastUrl()).toBe(`${API_BASE_URL}/bets/11/`);
  });

  it('posts a bet with an idempotency key', async () => {
    await placeBet({ race: 7, game: 'WIN', entries: [1], wager_amount: '50.00' }, 'key-123');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/bets/`);
    expect(init.method).toBe('POST');
    expect(init.headers['Idempotency-Key']).toBe('key-123');
    expect(JSON.parse(init.body)).toEqual({
      race: 7,
      game: 'WIN',
      entries: [1],
      wager_amount: '50.00',
    });
  });
});

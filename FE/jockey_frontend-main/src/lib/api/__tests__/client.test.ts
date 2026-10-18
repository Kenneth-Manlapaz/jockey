import { api } from '@/lib/api';

describe('mock api', () => {
  it('returns home data with races', async () => {
    const home = await api.getHome();
    expect(home.todayRaces.length).toBeGreaterThan(0);
    expect(home.liveRace.status).toBe('ongoing');
  });

  it('builds an account from sign-up details', async () => {
    const user = await api.signUp({
      firstName: 'Maria',
      lastName: 'Cruz',
      email: 'maria@example.com',
      mobile: '+639170000000',
      password: 'demo-password',
    });
    expect(user.firstName).toBe('Maria');
    expect(user.lastName).toBe('Cruz');
    expect(user.initials).toBe('MC');
    expect(user.email).toBe('maria@example.com');
    expect(user.balance).toBe(5000);
    expect(user.memberSince).toMatch(/^MEMBER SINCE [A-Z]{3} \d{4}$/);
  });

  it('signs in with the demo account but keeps the entered email', async () => {
    const user = await api.signIn({ email: 'hello@example.com', password: 'whatever' });
    expect(user.email).toBe('hello@example.com');
    expect(user.firstName).toBe('Isabella');
  });

  it('exposes a totalizer overview across pools', async () => {
    const overview = await api.getPoolOverview();
    expect(overview.pools.length).toBeGreaterThan(1);
    const sum = overview.pools.reduce((total, pool) => total + pool.totalPool, 0);
    expect(sum).toBe(overview.poolSales);
  });

  it('looks up an individual pool by id, falling back to the first', async () => {
    const place = await api.getPool('pool-place-r3');
    expect(place.market).toBe('PLACE');
    const fallback = await api.getPool('missing');
    expect(fallback.market).toBe('WIN');
  });

  it('returns games guide entries', async () => {
    const guides = await api.getGameGuides();
    expect(guides.length).toBe(7);
    expect(guides[0]?.title).toBe('WIN');
  });

  it('looks up a single game guide by id', async () => {
    const guide = await api.getGameGuide('guide-trifecta');
    expect(guide?.title).toBe('TRIFECTA');
    expect(await api.getGameGuide('missing')).toBeNull();
  });

  it('returns the demo rewards programme', async () => {
    const rewards = await api.getRewards();
    expect(rewards.points).toBeGreaterThan(0);
    expect(rewards.rewards.length).toBeGreaterThan(0);
  });

  it('returns an official result detail with a podium', async () => {
    const detail = await api.getResultDetail('res-1');
    expect(detail.status).toBe('official');
    expect(detail.podium).toHaveLength(3);
    expect(detail.dividends.length).toBeGreaterThan(0);
  });

  it('returns a sample pool dividend snapshot', async () => {
    const dividend = await api.getPoolDividend('pool-place-r3');
    expect(dividend.market).toBe('PLACE');
    expect(dividend.distribution.length).toBeGreaterThan(0);
  });
});

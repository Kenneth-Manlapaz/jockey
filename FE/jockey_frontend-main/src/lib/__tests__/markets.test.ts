import { marketRequirements, requirementFor } from '@/lib/markets';
import type { MarketType } from '@/types';

describe('market requirements', () => {
  it('requires one pick for WIN and PLACE', () => {
    expect(requirementFor('WIN').min).toBe(1);
    expect(requirementFor('PLACE').min).toBe(1);
  });

  it('requires ordered pairs and triples', () => {
    expect(requirementFor('FORECAST').min).toBe(2);
    expect(requirementFor('TRIFECTA').min).toBe(3);
  });

  it('defines a requirement for every market type', () => {
    const markets = Object.keys(marketRequirements) as MarketType[];
    expect(markets).toContain('WIN');
    expect(markets).toContain('BOX_TRIFECTA');
    expect(markets).toContain('MULTI_RACE');
    markets.forEach((market) => expect(marketRequirements[market].hint.length).toBeGreaterThan(0));
  });
});

import type { MarketRequirement, MarketType } from '@/types';

/**
 * Selection requirements per market. `min` drives the "N/M" progress counter
 * on the Make Selection screen and the "Select N horses" hints in the guide.
 * A `min` of 0 means the market spans a variable number of picks (multi-race).
 */
export const marketRequirements: Record<MarketType, MarketRequirement> = {
  WIN: { min: 1, hint: 'Select 1 horse' },
  PLACE: { min: 1, hint: 'Select 1 horse' },
  FORECAST: { min: 2, hint: 'Select 2 horses in order' },
  REVERSE_FORECAST: { min: 2, hint: 'Select 2 horses in any order' },
  TRIFECTA: { min: 3, hint: 'Select 3 horses in order' },
  BOX_TRIFECTA: { min: 3, hint: 'Select 3 or more horses' },
  MULTI_RACE: { min: 0, hint: 'Select horses across races' },
};

export function requirementFor(market: MarketType): MarketRequirement {
  return marketRequirements[market];
}

import { formatPeso, formatTicketNumber } from '@/lib/format';

describe('formatPeso', () => {
  it('groups thousands and pads to two decimals', () => {
    expect(formatPeso(5000)).toBe('₱5,000.00');
  });

  it('rounds/keeps two decimals for fractional amounts', () => {
    expect(formatPeso(1234.5)).toBe('₱1,234.50');
  });

  it('handles zero', () => {
    expect(formatPeso(0)).toBe('₱0.00');
  });
});

describe('formatTicketNumber', () => {
  it('builds a PJA-DEMO number from a date and sequence', () => {
    expect(formatTicketNumber(new Date(2025, 9, 24), 837)).toBe('PJA-DEMO-251024-0837');
  });

  it('pads the sequence to four digits', () => {
    expect(formatTicketNumber(new Date(2025, 0, 3), 1)).toBe('PJA-DEMO-250103-0001');
  });
});

import { api } from '@/lib/api';
import { DEMO_USER, useSessionStore } from '@/lib/auth/session';
import { DEFAULT_STAKE, useBetsStore } from '@/lib/bets/store';
import type { BetSelection, CartItem } from '@/types';

const selection: BetSelection = {
  raceId: 'race-3',
  raceLabel: "Race 3 · Champions' Mile",
  runnerNumber: 1,
  horse: 'Golden Victory',
  jockey: 'Marco de León',
  odds: 2.4,
  entryId: 'e1',
};

const cartItem: Omit<CartItem, 'id'> = {
  raceId: 'race-3',
  raceNumber: 3,
  raceName: "Champions' Mile",
  market: 'WIN',
  runners: [selection],
};

beforeEach(() => {
  useBetsStore.setState({ tickets: [], cart: [], stakePerTicket: DEFAULT_STAKE, placing: false });
  useSessionStore.setState({ user: { ...DEMO_USER, balance: 1000 }, loading: false });
});

describe('bets store', () => {
  it('records a ticket and deducts the stake from the session balance', async () => {
    const ticket = await useBetsStore.getState().placeBet({ selection, market: 'WIN', stake: 100 });

    expect(ticket.selection).toBe('1 Golden Victory');
    expect(ticket.status).toBe('Pending');
    expect(ticket.ticketNumber).toMatch(/^PJA-DEMO-\d{6}-\d{4}$/);
    expect(useBetsStore.getState().tickets[0]?.id).toBe(ticket.id);
    expect(useSessionStore.getState().user?.balance).toBe(900);
  });

  it('prepends newer tickets', async () => {
    await useBetsStore.getState().placeBet({ selection, market: 'WIN', stake: 100 });
    await useBetsStore.getState().placeBet({
      selection: { ...selection, horse: 'Midnight Thunder' },
      market: 'PLACE',
      stake: 50,
    });

    const tickets = useBetsStore.getState().tickets;
    expect(tickets).toHaveLength(2);
    expect(tickets[0]?.selection).toBe('1 Midnight Thunder');
  });

  it('does not touch the balance when signed out', async () => {
    useSessionStore.setState({ user: null });
    await useBetsStore.getState().placeBet({ selection, market: 'WIN', stake: 100 });
    expect(useSessionStore.getState().user).toBeNull();
  });
});

describe('cart', () => {
  it('adds and removes cart items', () => {
    const entry = useBetsStore.getState().addToCart(cartItem);
    expect(useBetsStore.getState().cart).toHaveLength(1);

    useBetsStore.getState().removeFromCart(entry.id);
    expect(useBetsStore.getState().cart).toHaveLength(0);
  });

  it('places every cart item as a ticket and charges the per-ticket stake', async () => {
    useBetsStore.getState().addToCart(cartItem);
    useBetsStore.getState().addToCart({ ...cartItem, market: 'PLACE' });

    const tickets = await useBetsStore.getState().placeCart(50);

    expect(tickets).toHaveLength(2);
    expect(useBetsStore.getState().tickets).toHaveLength(2);
    expect(useBetsStore.getState().cart).toHaveLength(0);
    expect(useSessionStore.getState().user?.balance).toBe(900);
    expect(useBetsStore.getState().placing).toBe(false);
  });

  it('is a no-op when the cart is empty', async () => {
    expect(await useBetsStore.getState().placeCart(50)).toHaveLength(0);
    expect(useSessionStore.getState().user?.balance).toBe(1000);
  });

  it('updates an existing cart item in place', () => {
    const entry = useBetsStore.getState().addToCart(cartItem);
    useBetsStore.getState().updateCart(entry.id, { ...cartItem, market: 'PLACE' });

    const cart = useBetsStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0]?.id).toBe(entry.id);
    expect(cart[0]?.market).toBe('PLACE');
  });

  it('charges the stored per-ticket stake when none is passed', async () => {
    useBetsStore.getState().addToCart(cartItem);
    useBetsStore.getState().addToCart({ ...cartItem, market: 'PLACE' });
    useBetsStore.getState().setStakePerTicket(75);

    await useBetsStore.getState().placeCart();

    expect(useSessionStore.getState().user?.balance).toBe(850);
    expect(useBetsStore.getState().tickets[0]?.stake).toBe(75);
  });

  it('rolls back cleanly when placement fails', async () => {
    const spy = jest.spyOn(api, 'placeBets').mockRejectedValueOnce(new Error('boom'));
    useBetsStore.getState().addToCart(cartItem);

    await expect(useBetsStore.getState().placeCart(50)).rejects.toThrow('boom');

    expect(useBetsStore.getState().tickets).toHaveLength(0);
    expect(useBetsStore.getState().cart).toHaveLength(1);
    expect(useBetsStore.getState().placing).toBe(false);
    expect(useSessionStore.getState().user?.balance).toBe(1000);
    spy.mockRestore();
  });
});

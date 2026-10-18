import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { api, type PlaceBetInput } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api/errors';
import { useSessionStore } from '@/lib/auth/session';
import { USE_MOCK_API } from '@/lib/config';
import type { BetSelection, BetTicket, CartItem, MarketType } from '@/types';

/** Default per-ticket wager, shared by the Bet Cart estimate and Review screen. */
export const DEFAULT_STAKE = 50;

export class PartialBetPlacementError extends Error {
  constructor() {
    super('Some tickets were accepted. The remaining tickets are still in your cart; check bet history before retrying.');
    this.name = 'PartialBetPlacementError';
  }
}

export interface SingleBetInput {
  selection: BetSelection;
  market: MarketType;
  stake: number;
}

interface BetsState {
  tickets: BetTicket[];
  /** Selections staged before they are confirmed into tickets. */
  cart: CartItem[];
  /** Per-ticket wager, shared by Bet Cart and Review. */
  stakePerTicket: number;
  /** True while a bet submission is in flight. */
  placing: boolean;
  loadingBets: boolean;
  betsError: string | null;
  setStakePerTicket: (value: number) => void;
  setCartStake: (id: string, value: number) => void;
  addToCart: (item: Omit<CartItem, 'id'>) => CartItem;
  updateCart: (id: string, item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  /** Confirms every cart item into a ticket at a shared per-ticket stake. */
  placeCart: (stakePerTicket?: number) => Promise<BetTicket[]>;
  /** Records a single bet and deducts the stake from the session balance. */
  placeBet: (input: SingleBetInput) => Promise<BetTicket>;
  /** Replaces the local tickets with the account's bets from the API. */
  loadBets: () => Promise<void>;
  clearTickets: () => void;
}

function toRaceNumber(raceId: string): number {
  return Number(raceId.replace(/\D/g, '')) || 0;
}

/** Builds the seam payload for a single cart line. */
function toPlaceBetInput(item: Omit<CartItem, 'id'>, stake: number): PlaceBetInput {
  return {
    raceId: item.raceId,
    raceNumber: item.raceNumber,
    raceName: item.raceName,
    market: item.market,
    stake,
    runners: item.runners,
  };
}

export const useBetsStore = create<BetsState>()(
  persist(
    (set, get) => {
      /**
       * Submits one or more bets through the API seam, prepending the returned
       * tickets and charging the demo balance. State is only mutated on success.
       */
      const submit = async (inputs: PlaceBetInput[]): Promise<BetTicket[]> => {
        if (inputs.length === 0) return [];
        set({ placing: true });
        try {
          const created = await api.placeBets(inputs);
          set((state) => ({ tickets: [...created, ...state.tickets], placing: false }));

          const session = useSessionStore.getState();
          if (session.user) {
            const total = inputs.reduce((sum, input) => sum + input.stake, 0);
            session.updateUser({ balance: session.user.balance - total });
          }

          return created;
        } catch (error) {
          set({ placing: false });
          throw error;
        }
      };

      return {
        tickets: [],
        cart: [],
        stakePerTicket: DEFAULT_STAKE,
        placing: false,
        loadingBets: false,
        betsError: null,

        setStakePerTicket: (value) => set({ stakePerTicket: Math.max(0, value) }),

        setCartStake: (id, value) => set((state) => ({
          cart: state.cart.map((item) => item.id === id ? { ...item, stake: Math.max(0, value) } : item),
        })),

        addToCart: (item) => {
          const entry: CartItem = {
            ...item,
            id: `cart-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
          };
          set((state) => ({ cart: [...state.cart, entry] }));
          return entry;
        },

        updateCart: (id, item) =>
          set((state) => ({
            cart: state.cart.map((entry) => (entry.id === id ? { ...item, id } : entry)),
          })),

        removeFromCart: (id) =>
          set((state) => ({ cart: state.cart.filter((item) => item.id !== id) })),

        clearCart: () => set({ cart: [] }),

        placeCart: async (stakePerTicket) => {
          const cart = get().cart;
          if (cart.length === 0) return [];

          const fallbackStake = stakePerTicket ?? get().stakePerTicket;
          const created: BetTicket[] = [];
          const submitted: CartItem[] = [];
          const deductSubmitted = () => {
            const session = useSessionStore.getState();
            if (session.user && submitted.length > 0) {
              const total = submitted.reduce((sum, item) => sum + (stakePerTicket ?? item.stake ?? fallbackStake), 0);
              session.updateUser({ balance: session.user.balance - total });
            }
          };
          set({ placing: true });
          try {
            for (const item of cart) {
              const [ticket] = await api.placeBets([
                toPlaceBetInput(item, stakePerTicket ?? item.stake ?? fallbackStake),
              ]);
              if (ticket) {
                created.push(ticket);
                set((state) => ({ tickets: [ticket, ...state.tickets] }));
              }
              submitted.push(item);
            }
            set({ cart: [], placing: false });
          } catch (error) {
            set((state) => ({
              cart: state.cart.filter((item) => !submitted.some((done) => done.id === item.id)),
              placing: false,
            }));
            deductSubmitted();
            if (submitted.length > 0) throw new PartialBetPlacementError();
            throw error;
          }

          deductSubmitted();
          return created;
        },

        placeBet: async ({ selection, market, stake }) => {
          const [ticket] = await submit([
            {
              raceId: selection.raceId,
              raceNumber: toRaceNumber(selection.raceId),
              raceName: selection.raceLabel.split('·')[1]?.trim() ?? selection.raceLabel,
              market,
              stake,
              runners: [selection],
            },
          ]);
          return ticket;
        },

        loadBets: async () => {
          if (USE_MOCK_API) return;
          set({ loadingBets: true, betsError: null });
          try {
            const remote = await api.getBets();
            set({ tickets: remote, loadingBets: false });
          } catch (error) {
            set({ tickets: [], loadingBets: false, betsError: getApiErrorMessage(error, 'Could not load betting history.') });
            throw error;
          }
        },

        clearTickets: () => set({ tickets: [] }),
      };
    },
    { name: 'pj-bets', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

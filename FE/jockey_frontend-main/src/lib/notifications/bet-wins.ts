import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { BetWinNotification } from '@/lib/bet-result';

interface BetWinNotificationsState {
  notifications: BetWinNotification[];
  add: (notifications: BetWinNotification[]) => void;
  markAllRead: () => void;
}

export const useBetWinNotificationsStore = create<BetWinNotificationsState>()(
  persist(
    (set) => ({
      notifications: [],
      add: (incoming) => set((state) => {
        const known = new Set(state.notifications.map((notification) => notification.id));
        const fresh = incoming.filter((notification) => !known.has(notification.id));
        return fresh.length ? { notifications: [...fresh, ...state.notifications] } : state;
      }),
      markAllRead: () => set((state) => ({
        notifications: state.notifications.map((notification) => ({ ...notification, is_read: true })),
      })),
    }),
    { name: 'pj-bet-win-notifications', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  api,
  getMe,
  login,
  logout,
  register,
  refreshAccessToken,
  toAuthUser,
  configureHttpAuth,
} from '@/lib/api';
import { USE_MOCK_API } from '@/lib/config';
import { demoUser } from '@/mocks/data';
import type { AuthUser } from '@/types';

import { clearAuthTokens, getAccessToken, setAccessToken } from './tokens';

configureHttpAuth({
  onUnauthorized: async () => {
    try {
      const response = await refreshAccessToken();
      if (!response?.access) return null;
      setAccessToken(response.access);
      return response.access;
    } catch {
      return null;
    }
  },
});

/** Fallback account shown when no one has signed in yet (demo build). */
export const DEMO_USER = demoUser;

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
}

interface SessionState {
  user: AuthUser | null;
  loading: boolean;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  /** Skips the auth flow and enters as the mock account (demo builds). */
  signInDemo: () => void;
  /** Validates the short-lived bearer token if the current runtime has one. */
  restore: () => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
  signOut: () => void;
}

function initialsOf(user: Pick<AuthUser, 'firstName' | 'lastName'>) {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

/**
 * Auth session.
 *
 * The signed-in account is persisted to AsyncStorage so it survives reloads.
 * When `EXPO_PUBLIC_USE_MOCK_API` is off, sign-in/up talks to the Django API and
 * the access token is refreshed with the HttpOnly cookie when cookie refresh is enabled.
 * Screens only depend on this store.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,

      signIn: async (input) => {
        set({ loading: true });
        try {
          let user: AuthUser;
          if (USE_MOCK_API) {
            user = await api.signIn(input);
          } else {
            const response = await login({ email: input.email, password: input.password });
            setAccessToken(response.access);
            user = toAuthUser(response.user ?? (await getMe()));
          }
          set({ user, loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      signUp: async (input) => {
        set({ loading: true });
        try {
          let user: AuthUser;
          if (USE_MOCK_API) {
            user = await api.signUp(input);
          } else {
            const response = await register({
              first_name: input.firstName,
              last_name: input.lastName,
              email: input.email,
              mobile_number: input.mobile || undefined,
              password: input.password,
              accept_terms: true,
            });
            setAccessToken(response.access);
            user = toAuthUser(response.user ?? (await getMe()));
          }
          set({ user, loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      signInDemo: () => set({ user: { ...DEMO_USER } }),

      restore: async () => {
        if (USE_MOCK_API) return;
        try {
          if (!getAccessToken()) {
            const refreshed = await refreshAccessToken();
            if (!refreshed?.access) throw new Error('Session expired.');
            setAccessToken(refreshed.access);
          }
          set({ user: toAuthUser(await getMe()) });
        } catch {
          clearAuthTokens();
          set({ user: null });
        }
      },

      updateUser: (patch) =>
        set((state) => {
          if (!state.user) return state;
          const next = { ...state.user, ...patch };
          return { user: { ...next, initials: initialsOf(next) } };
        }),

      signOut: () => {
        if (!USE_MOCK_API) void logout().catch(() => undefined);
        clearAuthTokens();
        set({ user: null });
      },
    }),
    {
      name: 'pj-session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

export function useAuthUser() {
  return useSessionStore((state) => state.user);
}

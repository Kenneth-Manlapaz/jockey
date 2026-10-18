import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  type ColorScheme,
  fonts,
  gradients,
  palette,
  radius,
  semanticColors,
  spacing,
  statusTones,
  type ThemeMode,
} from './tokens';

/**
 * Dark mode is deferred. The app renders the light palette everywhere regardless
 * of the system setting or any persisted mode. Flip this to `true` (and re-enable
 * the Appearance control in Settings) when dark mode ships.
 */
export const DARK_MODE_ENABLED = false;

interface ThemeStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'light',
      setMode: (mode) => set({ mode }),
      toggle: () => set({ mode: get().mode === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: 'pj-theme-mode',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export interface Theme {
  scheme: ColorScheme;
  colors: (typeof semanticColors)['light'];
  status: typeof statusTones;
  spacing: typeof spacing;
  radius: typeof radius;
  fonts: typeof fonts;
  gradients: typeof gradients;
  palette: typeof palette;
}

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);

  const scheme: ColorScheme = DARK_MODE_ENABLED
    ? mode === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : mode
    : 'light';

  return {
    scheme,
    colors: semanticColors[scheme],
    status: statusTones,
    spacing,
    radius,
    fonts,
    gradients,
    palette,
  };
}

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Project stack

This is a **UI/frontend-only demo** ("Philippine Jockey", play-money horse-racing). No backend yet — the future API is Django. Currency is **₱ (PHP)**.

- Expo SDK ~57 + React Native + **Expo Router** + TypeScript (strict).
- **NativeWind** (Tailwind v3) for styling; tokens/`useTheme()` in `src/theme`.
- **Zustand** for client state (`src/lib/bets`, `src/lib/auth`, theme mode).
- **TanStack Query** for data, all funneled through the single mock seam `src/lib/api`.
- Package manager is **npm** (no `bun.lock`); there is no `dev` script — use `npm start`.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor              # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
npm test                    # jest-expo + React Native Testing Library
```

Run lint, typecheck, and tests before declaring any task done.

## Data layer

- All data access goes through `src/lib/api` (`client.ts` + `hooks.ts`); screens never import `src/mocks` directly. Swapping to the real Django API should be a single-file change.
- Environment flags live in `src/lib/config.ts` (see `.env.example`). `EXPO_PUBLIC_BYPASS_AUTH=false` restores the real auth flow; restart with `npx expo start -c` after changing.
- Domain copy/labels use the shared types in `src/types/index.ts` and formatters in `src/lib/format.ts`.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Theming

- **Light mode only for now — dark mode is deferred.** `useTheme()` in `src/theme` always resolves to the light palette regardless of the system setting or persisted mode. Set `DARK_MODE_ENABLED = true` in `src/theme/use-theme.ts` (and restore the Appearance control in `src/app/settings.tsx`) when dark mode ships. `app.json` sets `userInterfaceStyle` to `light`.
- Only the **splash** and **onboarding** screens are intentionally fixed-dark brand surfaces (`bg-teal-950` / `colors.brand`) — they are not "dark mode" and must stay dark even in light mode. Auth screens (welcome/login/signup) render the normal light surface.
- The `_layout.tsx` files pin the navigator to light (`ThemeProvider value={DefaultTheme}` + light `contentStyle`) and `expo-system-ui` sets the Android window background to `stone100`, so no native dark surface leaks through.

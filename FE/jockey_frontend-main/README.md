# Philippine Jockey (`jockeyph-frontend`)

A **play-money horse-racing demo** for the Philippine market. Expo / React Native app (iOS + Android) covering the full punter journey — browse races, study the totalizer, learn the markets, place a bet, and review results.

> **This is a UI/frontend-only demo.** There is no backend yet, no real money, and no KYC/payments. All data is mocked and every balance is simulated. The future API is a Django backend; swapping to it should be a single-file change (see [Data layer](#data-layer)).

Currency is **₱ (PHP)**.

## Stack

- [Expo](https://docs.expo.dev/) SDK 57 + React Native + **Expo Router** (file-based routing)
- **TypeScript** (strict)
- **NativeWind** (Tailwind v3) for styling; design tokens in `src/theme`
- **Zustand** for client state (`src/lib/bets`, `src/lib/auth`, theme mode)
- **TanStack Query** for server state, all funneled through one mock seam
- **React Hook Form** + **Zod** for forms
- **Jest** (`jest-expo`) + **React Native Testing Library**

## Prerequisites

- Node 20+ and npm
- The [Expo Go](https://expo.dev/go) app on your phone — it must match **SDK 57**

## Getting started

```bash
npm install
npm start          # then scan the QR code with Expo Go
```

If your phone cannot reach the dev server (e.g. you're on WSL or a segmented network), use a tunnel:

```bash
npx expo start --tunnel
```

On Android, scan inside Expo Go's in-app scanner. On iOS, use the Camera and tap the Expo Go banner.

## Environment

Copy `.env.example` to `.env` and adjust as needed:

| Variable                  | Default | Description                                                                                                                                                     |
| ------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_BYPASS_AUTH` | on      | When not `false`, the splash screen skips auth and signs in the demo user automatically. Set to `false` to exercise the real onboarding → sign-up → login flow. |

After changing env values, restart with a cleared cache: `npx expo start -c`.

## Scripts

| Script                                            | Description                  |
| ------------------------------------------------- | ---------------------------- |
| `npm start`                                       | Start the Expo dev server    |
| `npm run android` / `npm run ios` / `npm run web` | Start on a specific platform |
| `npm run lint` / `npm run lint:fix`               | ESLint (via `expo lint`)     |
| `npm run typecheck`                               | `tsc --noEmit`               |
| `npm test` / `npm run test:watch`                 | Jest suites                  |
| `npm run format` / `npm run format:check`         | Prettier                     |

Run `npm run lint`, `npm run typecheck`, and `npm test` before declaring any change done.

## Project structure

```
src/
  app/            Expo Router routes — every file is a screen, _layout.tsx files define navigators
  components/
    ui/           Design-system primitives (Button, Card, Text, Chip, AppBar, ...)
    domain/       Feature components (RaceCard, TicketCard, Podium, GameGuideCard, ...)
  lib/
    api/          Mock API client + TanStack Query hooks (the single data seam)
    auth/         Session store + demo sign-in
    bets/         Bets/cart Zustand store
    format.ts     Currency and date/ticket formatters
  mocks/          Fixture data used by the mock API (never imported by screens)
  theme/          Design tokens, useTheme(), light-only theming
  types/          Shared domain types
```

## Data layer

All data access goes through `src/lib/api` (`client.ts` + `hooks.ts`). Screens never import `src/mocks` directly, so replacing the mock client with real HTTP calls is a single-file change.

## Theming

Light mode only for now; dark mode is deferred (`DARK_MODE_ENABLED` in `src/theme/use-theme.ts`). Only the splash and onboarding screens are intentionally fixed-dark brand surfaces.

## Building & shipping

Builds and submissions use [EAS](https://docs.expo.dev/eas/) — no local Xcode or Android Studio required:

```bash
npx eas-cli@latest build --profile development   # development build
npx eas-cli@latest build                         # production build
npx eas-cli@latest submit                        # submit to the stores
npx eas-cli@latest update                        # ship an over-the-air update
```

## Versioning

This project follows [Semantic Versioning](https://semver.org/). While pre-1.0 (`0.y.z`) the public surface may change; `feat` bumps the minor, `fix` bumps the patch. See [`CHANGELOG.md`](./CHANGELOG.md).

## License

See [LICENSE](./LICENSE).

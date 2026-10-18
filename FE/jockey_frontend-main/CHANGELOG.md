# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Real HTTP data layer behind `EXPO_PUBLIC_USE_MOCK_API`: typed request client with
  bearer auth, single 401 refresh-and-retry, CSRF support, and error-envelope mapping.
- Read endpoints and adapters for races, entries, results, and games.
- Auth endpoints (`csrf`, `login`, `register`, `token/refresh`, `logout`, `me`) wired into
  the session store with cold-start restore and in-memory access/CSRF tokens.
- Betting through the API seam: `placeBets`/`getBets` (mock + real), `toBetTicket` adapter,
  async cart placement with optimistic rollback, and a provisional betting contract doc
  (`src/lib/api/CONTRACT.md`).

## [0.1.0] - 2026-10-14

First public drop of the **Philippine Jockey** play-money demo (frontend-only).

### Added

- Design system: NativeWind tokens, `useTheme()` (light-only), and UI primitives
  (`Screen`, `AppBar`, `Button`, `Card`, `Text`, `Chip`, `Checkbox`, `StatusChip`,
  `ConfirmDialog`).
- Expo Router shell with a custom tab bar: Home, Races, Live, Results, Profile.
- Auth screens (welcome/login/signup), onboarding, splash, and a demo auth bypass.
- Mock API seam (`src/lib/api`) with TanStack Query hooks over `src/mocks`, plus shared
  domain types and currency/date/ticket formatters.
- Betting flow: race detail → market selection → bet cart → review → confirmation.
- Betting history with status filters and a per-ticket detail screen.
- Official results with podium, dividends, and contender profiles.
- Totalizer overview, pool details, and pool dividend screens.
- Games & Guide learn hub with per-market detail, and a demo rewards screen.
- Zustand stores for session and bets (shared per-ticket stake, cart editing).
- Test suite (jest-expo + React Native Testing Library) covering stores, formatters,
  markets, the mock API, and auth.

### Changed

- Renamed the project to `jockeyph-frontend` (slug) with display name
  "Philippine Jockey"; deep-link scheme set to `jockeyph`.

[Unreleased]: https://example.com/compare/v0.1.0...HEAD
[0.1.0]: https://example.com/releases/tag/v0.1.0

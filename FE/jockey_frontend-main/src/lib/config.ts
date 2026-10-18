/**
 * Runtime configuration flags.
 *
 * `EXPO_PUBLIC_BYPASS_AUTH` skips sign-in only in mock builds. Real API mode
 * always uses the account flow.
 *
 * `EXPO_PUBLIC_USE_MOCK_API=true` opts into the in-repo mock data. Real API
 * mode is the default so preview builds do not silently use mocks.
 *
 * `EXPO_PUBLIC_API_BASE_URL` targets the Django API when the mock is disabled.
 * Use the same host for the app, API and cookies — `localhost` and `127.0.0.1`
 * are different hosts. On a physical device use your machine's LAN IP (or a
 * tunnel); on the Android emulator use `10.0.2.2`.
 */
const apiMode = process.env.NEXT_PUBLIC_USE_MOCK_API ?? process.env.EXPO_PUBLIC_USE_MOCK_API;
export const USE_MOCK_API = apiMode === 'true';

export const BYPASS_AUTH = USE_MOCK_API && process.env.EXPO_PUBLIC_BYPASS_AUTH !== 'false';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ?? process.env.EXPO_PUBLIC_API_BASE_URL
  ?? 'http://127.0.0.1:8000/api/v1';

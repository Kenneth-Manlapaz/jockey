import { configureHttpAuth } from '@/lib/api/http';

/** Session token state for the API's short-lived bearer-only auth. */

let accessToken: string | null = null;
let csrfToken: string | null = null;

export function getAccessToken() {
  if (!accessToken && typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
    try {
      accessToken = window.sessionStorage.getItem('pj-access-token');
    } catch {
      accessToken = null;
    }
  }
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
    try {
      if (token) window.sessionStorage.setItem('pj-access-token', token);
      else window.sessionStorage.removeItem('pj-access-token');
    } catch {
      // Storage may be disabled; the in-memory token remains usable this session.
    }
  }
}

export function getCsrfToken() {
  return csrfToken;
}

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export function clearAuthTokens() {
  setAccessToken(null);
  csrfToken = null;
}
configureHttpAuth({ getAccessToken, getCsrfToken });

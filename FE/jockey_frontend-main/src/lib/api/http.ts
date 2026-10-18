import { API_BASE_URL } from '@/lib/config';

import { ApiError } from './errors';

/** Page-number pagination envelope used by every list endpoint. */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Returns the current in-memory access token, or null when signed out. */
export type TokenProvider = () => string | null | undefined;
/** Returns the CSRF token for browser-style unsafe requests. */
export type CsrfProvider = () => string | null | undefined;
/** Refreshes the access token; resolves to the new token or null on failure. */
export type RefreshHandler = () => Promise<string | null>;

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  signal?: AbortSignal;
  /** Attaches the bearer token and enables the 401 refresh-and-retry flow. */
  auth?: boolean;
  /** Adds the `X-CSRFToken` header for CSRF-protected endpoints. */
  csrf?: boolean;
  headers?: Record<string, string>;
  /** `'none'` skips response parsing (e.g. HTTP 204). */
  parse?: 'json' | 'none';
}

let getAccessToken: TokenProvider = () => null;
let getCsrfToken: CsrfProvider = () => null;
let refreshAccessToken: RefreshHandler = async () => null;

/**
 * Wires the auth layer into the HTTP client. Call once at app start so `request`
 * can attach tokens and recover from a single 401.
 */
export function configureHttpAuth(options: {
  getAccessToken?: TokenProvider;
  getCsrfToken?: CsrfProvider;
  onUnauthorized?: RefreshHandler;
}) {
  if (options.getAccessToken) getAccessToken = options.getAccessToken;
  if (options.getCsrfToken) getCsrfToken = options.getCsrfToken;
  if (options.onUnauthorized) refreshAccessToken = options.onUnauthorized;
}

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_PROXY === 'true') {
    return `/api/backend${normalizedPath}`;
  }
  const base = API_BASE_URL.replace(/\/+$/, '');
  return `${base}${normalizedPath}`;
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Typed `fetch` wrapper: resolves the base URL, serialises JSON, attaches the
 * bearer token, maps the backend error envelope to `ApiError`, and recovers from
 * a single expired-access-token 401 by refreshing and retrying once.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    signal,
    auth = false,
    csrf = false,
    headers = {},
    parse = 'json',
  } = options;

  const send = async (token: string | null | undefined): Promise<Response> => {
    const finalHeaders: Record<string, string> = { Accept: 'application/json', ...headers };
    if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
    if (auth && token) finalHeaders.Authorization = `Bearer ${token}`;
    const csrfToken = csrf ? getCsrfToken() : null;
    if (csrfToken) finalHeaders['X-CSRFToken'] = csrfToken;

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: finalHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: 'include',
        signal,
      };
      if (typeof window === 'undefined' && process.env.NEXT_RUNTIME === 'nodejs') {
        fetchOptions.cache = 'no-store';
      }
      return await fetch(buildUrl(path), {
        ...fetchOptions,
      });
    } catch {
      throw ApiError.network();
    }
  };

  let response = await send(auth ? getAccessToken() : null);

  if (response.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) response = await send(refreshed);
  }

  if (!response.ok) {
    throw ApiError.fromResponse(response.status, await readBody(response));
  }

  return parse === 'none' ? (undefined as T) : ((await readBody(response)) as T);
}

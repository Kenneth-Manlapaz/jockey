import { setCsrfToken, setAccessToken } from '@/lib/auth/tokens';

import { request, configureHttpAuth } from './http';
import type {
  DTOAuthResponse,
  DTOAuthUser,
  DTOCredentials,
  DTOCsrf,
  DTORegisterInput,
} from './types';
import { ApiError } from './errors';

export async function bootstrapCsrf() {
  const { csrfToken } = await request<DTOCsrf>('/auth/csrf/');
  setCsrfToken(csrfToken);
  return csrfToken;
}

export async function login(credentials: DTOCredentials) {
  await bootstrapCsrf();
  return request<DTOAuthResponse>('/auth/login/', {
    method: 'POST',
    body: credentials,
    csrf: true,
  });
}

export async function register(input: DTORegisterInput) {
  await bootstrapCsrf();
  return request<DTOAuthResponse>('/auth/register/', {
    method: 'POST',
    body: input,
    csrf: true,
  });
}

export async function refreshAccessToken() {
  try {
    await bootstrapCsrf();
    return await request<DTOAuthResponse>('/auth/token/refresh/', { method: 'POST', csrf: true });
  } catch (error) {
    if (error instanceof ApiError && [401, 403, 410].includes(error.status)) return null;
    throw error;
  }
}

export async function logout() {
  await bootstrapCsrf();
  return request<void>('/auth/logout/', { method: 'POST', parse: 'none', csrf: true });
}

export function getMe() {
  return request<DTOAuthUser>('/me/', { auth: true });
}

let refreshing: Promise<string | null> | null = null;
configureHttpAuth({ onUnauthorized: () => {
  if (!refreshing) refreshing = refreshAccessToken().then(response => {
    const token = response?.access ?? null;
    setAccessToken(token);
    return token;
  }).finally(() => { refreshing = null; });
  return refreshing;
} });

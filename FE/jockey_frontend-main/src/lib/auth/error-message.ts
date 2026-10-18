import { ApiError } from '@/lib/api/errors';

function collectMessages(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectMessages);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectMessages);
  return [];
}

/** Short, actionable copy for errors shown by the mobile auth forms. */
export function getAuthErrorMessage(cause: unknown, mode: 'login' | 'register'): string {
  if (!(cause instanceof ApiError)) {
    return cause instanceof TypeError
      ? 'Could not connect to the server. Check your connection and try again.'
      : 'Something went wrong. Please try again.';
  }

  const details = collectMessages(cause.details).join(' ');
  const combined = `${details} ${cause.message}`.toLowerCase();
  if (mode === 'login' && cause.status === 401) {
    return 'Email or password is incorrect. Check your details and try again.';
  }
  if (mode === 'register' && /already exists|already registered|unique|duplicate|taken/.test(combined)) {
    return 'An account with this email already exists. Try signing in or use a different email.';
  }
  if (cause.status === 0 || cause.code === 'network_error') {
    return 'Could not connect to the server. Check your connection and try again.';
  }
  if (cause.status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (cause.status >= 500) return 'The service is having trouble right now. Please try again shortly.';
  if (cause.status === 400 && details) return details.length <= 180 ? details : 'Please review your details and try again.';
  return mode === 'register'
    ? 'We could not create your account. Check your details and try again.'
    : 'We could not sign you in. Check your details and try again.';
}

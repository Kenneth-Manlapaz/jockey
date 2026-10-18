import { ApiError } from '@/lib/api/errors';

function collectMessages(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectMessages);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectMessages);
  return [];
}

export function getAuthErrorMessage(cause: unknown, mode: 'login' | 'register'): string {
  if (!(cause instanceof ApiError)) {
    return cause instanceof TypeError
      ? 'Could not connect to the server. Check your connection and try again.'
      : 'Something went wrong. Please try again.';
  }

  const details = collectMessages(cause.details).join(' ').toLowerCase();
  const backendMessage = cause.message.toLowerCase();
  const combined = `${details} ${backendMessage}`;

  if (mode === 'register' && /already exists|already registered|unique|duplicate|taken/.test(combined)) {
    if (/username/.test(combined)) return 'That username is already taken. Please choose another.';
    return 'An account with this email already exists. Try signing in or use a different email.';
  }

  if (mode === 'login' && cause.status === 401) {
    return 'Email or password is incorrect. Check your details and try again.';
  }
  if (cause.status === 0 || cause.code === 'network_error') {
    return 'Could not connect to the server. Check your connection and try again.';
  }
  if (cause.status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (cause.status >= 500) return 'The service is having trouble right now. Please try again shortly.';
  if (cause.status === 403) {
    return 'This request was blocked. Refresh the page and try again.';
  }
  if (mode === 'register' && /password/.test(combined)) {
    return details ? `Please check your password: ${collectMessages(cause.details).join(' ')}` : 'Please choose a stronger password and try again.';
  }
  if (mode === 'register' && /terms|accept_terms/.test(combined)) {
    return 'Please accept the account terms to create your account.';
  }
  if (cause.status === 400 && details) {
    const readable = collectMessages(cause.details).join(' ');
    return readable.length <= 180 ? readable : 'Please review your details and try again.';
  }
  if (cause.status === 401) return 'Your session is no longer valid. Please sign in again.';
  if (cause.status === 404) return 'The sign-in service could not be found. Please contact support.';
  return mode === 'register'
    ? 'We could not create your account. Check your details and try again.'
    : 'We could not sign you in. Check your details and try again.';
}

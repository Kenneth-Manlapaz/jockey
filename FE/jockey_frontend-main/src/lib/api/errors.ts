/**
 * Typed client error mirroring the backend envelope:
 * `{ "error": { "code", "message", "details" } }`.
 */

export type ApiErrorCode =
  | 'validation_error'
  | 'not_authenticated'
  | 'permission_denied'
  | 'not_found'
  | 'method_not_allowed'
  | 'betting_error'
  | 'throttled'
  | 'network_error'
  | 'server_error'
  | 'unknown_error';

export type ApiErrorDetails = Record<string, string[]>;

interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetails;
  };
}

function responseMessage(body: unknown): string | undefined {
  if (typeof body === 'string' && body.trim()) return body.trim();
  const value = body as { detail?: unknown; message?: unknown; error?: unknown } | null;
  if (typeof value?.detail === 'string') return value.detail;
  if (typeof value?.message === 'string') return value.message;
  if (typeof value?.error === 'string') return value.error;
  if (value?.detail && typeof value.detail === 'object') return formatDetails(value.detail as Record<string, unknown>);
  return undefined;
}

function normalizeDetails(value: unknown): ApiErrorDetails | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const entries: [string, string[]][] = [];
  const visit = (field: string, messages: unknown) => {
    if (Array.isArray(messages)) {
      const strings = messages.filter((message) => typeof message === 'string').map(String);
      if (strings.length) entries.push([field, strings]);
      else messages.forEach((message, index) => visit(`${field}.${index}`, message));
      return;
    }
    if (messages && typeof messages === 'object') {
      Object.entries(messages as Record<string, unknown>).forEach(([key, value]) =>
        visit(field ? `${field}.${key}` : key, value),
      );
      return;
    }
    if (typeof messages === 'string' && messages) entries.push([field, [messages]]);
  };
  Object.entries(value as Record<string, unknown>).forEach(([field, messages]) => visit(field, messages));
  const details = Object.fromEntries(entries);
  return Object.keys(details).length ? details : undefined;
}

function formatDetails(details: Record<string, unknown>): string {
  return Object.entries(details)
    .map(([field, messages]) => {
      const label = field === 'non_field_errors' || field === 'detail'
        ? ''
        : `${field.replaceAll('_', ' ').replaceAll('.', ' › ')}: `;
      const text = Array.isArray(messages) ? messages.join(' ') : String(messages);
      return `${label}${text}`;
    })
    .filter(Boolean)
    .join('\n');
}

/** Thrown by `request()` for every non-2xx and network failure. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: ApiErrorDetails;

  constructor(status: number, code: ApiErrorCode, message: string, details?: ApiErrorDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static fromResponse(status: number, body: unknown): ApiError {
    const envelope = (body as ApiErrorEnvelope | null)?.error;
    const code = (envelope?.code as ApiErrorCode | undefined) ?? statusToCode(status);
    const bodyRecord = body && typeof body === 'object' ? (body as Record<string, unknown>) : undefined;
    const directFieldErrors = bodyRecord && !('error' in bodyRecord) && !('message' in bodyRecord)
      ? bodyRecord
      : undefined;
    const details = normalizeDetails(envelope?.details ?? directFieldErrors);
    return new ApiError(
      status,
      code,
      envelope?.message ?? responseMessage(body) ?? (details ? formatDetails(details) : undefined) ?? defaultMessage(code),
      details,
    );
  }

  static network(message = 'Network request failed. Check your connection and try again.') {
    return new ApiError(0, 'network_error', message);
  }
}

function statusToCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return 'validation_error';
    case 401:
      return 'not_authenticated';
    case 403:
      return 'permission_denied';
    case 404:
      return 'not_found';
    case 405:
      return 'method_not_allowed';
    case 429:
      return 'throttled';
    default:
      return status >= 500 ? 'server_error' : 'unknown_error';
  }
}

function defaultMessage(code: ApiErrorCode): string {
  switch (code) {
    case 'not_authenticated':
      return 'You need to sign in to continue.';
    case 'permission_denied':
      return 'You do not have permission to do that.';
    case 'not_found':
      return 'The requested resource was not found.';
    case 'server_error':
      return 'The service is temporarily unavailable. Please try again shortly.';
    case 'method_not_allowed':
      return 'This action is not available right now.';
    case 'throttled':
      return 'You’re doing that a little too quickly. Please wait a moment and try again.';
    case 'network_error':
      return 'Unable to connect. Check your internet connection and try again.';
    case 'validation_error':
      return 'Please check the information and try again.';
    default:
      return 'Request failed.';
  }
}

/** Converts API and unexpected errors into copy suitable for a visible UI message. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof ApiError) {
    if (error.status >= 500) return 'The service is temporarily unavailable. Please try again shortly.';
    if (error.status === 405) return 'This action is not available right now.';
    if (error.status === 429) return 'You’re doing that a little too quickly. Please wait a moment and try again.';
    if (error.status === 401) return 'Your session may have expired. Please sign in again.';
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

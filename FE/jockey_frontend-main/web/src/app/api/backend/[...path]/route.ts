import { API_BASE_URL } from '@/lib/config';

const forwardedHeaders = ['accept', 'authorization', 'content-type', 'idempotency-key', 'x-csrftoken', 'cookie'];

async function forward(request: Request) {
  const incoming = new URL(request.url);
  const rawSuffix = incoming.pathname.replace(/^\/api\/backend/, '');
  // Next canonicalizes browser paths without a trailing slash, while the API
  // guide's Django routes require one.
  const suffix = rawSuffix.endsWith('/') ? rawSuffix : `${rawSuffix}/`;
  const upstream = (process.env.JOCKEY_API_BASE_URL ?? API_BASE_URL).replace(/\/+$/, '');
  const headers = new Headers();

  for (const name of forwardedHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const cookieToken = request.headers.get('cookie')?.split(';').map(c => c.trim()).find(c => c.startsWith('jockey_access='))?.slice('jockey_access='.length);
  if (['GET', 'HEAD'].includes(request.method) && !headers.has('authorization') && cookieToken && !suffix.startsWith('/auth/') && !suffix.startsWith('/racing/calendar/') && !suffix.startsWith('/subscriptions/plans/')) {
    // The backend validates the JWT; the cookie grants no access by itself.
    try {
      const payload = JSON.parse(Buffer.from(cookieToken.split('.')[1], 'base64url').toString());
      if (payload.exp > Date.now() / 1000) headers.set('authorization', `Bearer ${cookieToken}`);
    } catch { /* Malformed cookies are never used as authorization. */ }
  }

  try {
    const response = await fetch(`${upstream}${suffix}${incoming.search}`, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
      redirect: 'manual',
    });
    const responseHeaders = new Headers();
    const contentType = response.headers.get('content-type');
    if (contentType) responseHeaders.set('content-type', contentType);
    // Keep refresh cookies on the browser-facing proxy path. Never expose them to JS.
    for (const cookie of response.headers.getSetCookie()) {
      responseHeaders.append('set-cookie', cookie.replace(/Path=\/api\/v1\/auth\//gi, 'Path=/api/backend/auth/'));
    }
    let access: string | undefined;
    if (response.ok && /^\/auth\/(login|register|token\/refresh)\/$/.test(suffix)) {
      const body = await response.clone().json() as { access?: string };
      access = body.access;
    } else if (response.ok && headers.get('authorization')?.startsWith('Bearer ')) {
      access = headers.get('authorization')!.slice(7);
    }
    if (access) {
      try {
        const { exp } = JSON.parse(Buffer.from(access.split('.')[1], 'base64url').toString());
        const maxAge = Math.max(0, Math.floor(exp - Date.now() / 1000));
        responseHeaders.append('set-cookie', `jockey_access=${access}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${incoming.protocol === 'https:' ? '; Secure' : ''}`);
      } catch { /* Only a valid upstream token is persisted. */ }
    }
    if (suffix === '/auth/logout/' && response.ok) responseHeaders.append('set-cookie', 'jockey_access=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    responseHeaders.set('cache-control', 'no-store');
    const noBody = request.method === 'HEAD' || [204, 205, 304].includes(response.status);
    return new Response(noBody ? null : await response.arrayBuffer(), {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { error: { code: 'network_error', message: 'The racing API is unavailable right now.' } },
      { status: 502 },
    );
  }
}

export const dynamic = 'force-dynamic';

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const OPTIONS = forward;
export const HEAD = forward;

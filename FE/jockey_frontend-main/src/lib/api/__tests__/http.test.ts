import { API_BASE_URL } from '@/lib/config';
import { configureHttpAuth, request } from '@/lib/api/http';

const fetchMock = jest.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === null ? '' : JSON.stringify(body)),
  } as unknown as Response;
}

beforeAll(() => {
  global.fetch = fetchMock as unknown as typeof fetch;
});

beforeEach(() => {
  fetchMock.mockReset();
  configureHttpAuth({
    getAccessToken: () => null,
    getCsrfToken: () => null,
    onUnauthorized: async () => null,
  });
});

describe('request', () => {
  it('resolves the base URL and parses JSON', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 7 }));

    const data = await request<{ id: number }>('/races/7/');

    expect(data).toEqual({ id: 7 });
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/races/7/`, expect.any(Object));
  });

  it('serialises a JSON body with the right content type', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }, 201));

    await request('/bets/', { method: 'POST', body: { race: 1, game: 'WIN' } });

    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ race: 1, game: 'WIN' }));
  });

  it('attaches the bearer token for authenticated requests', async () => {
    configureHttpAuth({ getAccessToken: () => 'tok-123' });
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 1 }));

    await request('/me/', { auth: true });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok-123');
  });

  it('adds the X-CSRFToken header for unsafe requests', async () => {
    configureHttpAuth({ getCsrfToken: () => 'csrf-abc' });
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await request('/auth/login/', { method: 'POST', csrf: true, body: { username: 'a' } });

    expect(fetchMock.mock.calls[0][1].headers['X-CSRFToken']).toBe('csrf-abc');
  });

  it('omits the X-CSRFToken header when no token is available', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await request('/auth/login/', { method: 'POST', csrf: true, body: { username: 'a' } });

    expect(fetchMock.mock.calls[0][1].headers['X-CSRFToken']).toBeUndefined();
  });

  it('sends credentials so refresh cookies round-trip', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await request('/health/');

    expect(fetchMock.mock.calls[0][1].credentials).toBe('include');
  });

  it('maps the backend error envelope to ApiError', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            code: 'validation_error',
            message: 'Validation failed.',
            details: { email: ['Already exists.'] },
          },
        },
        400,
      ),
    );

    await expect(request('/auth/register/')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      code: 'validation_error',
      message: 'Validation failed.',
      details: { email: ['Already exists.'] },
    });
  });

  it('refreshes and retries once on a 401', async () => {
    configureHttpAuth({
      getAccessToken: () => 'old',
      onUnauthorized: async () => 'new',
    });
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { code: 'not_authenticated' } }, 401))
      .mockResolvedValueOnce(jsonResponse({ id: 1 }));

    const data = await request<{ id: number }>('/me/', { auth: true });

    expect(data).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer new');
  });

  it('throws not_authenticated when the refresh fails', async () => {
    configureHttpAuth({ getAccessToken: () => 'old', onUnauthorized: async () => null });
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: { code: 'not_authenticated' } }, 401));

    await expect(request('/me/', { auth: true })).rejects.toMatchObject({
      status: 401,
      code: 'not_authenticated',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('wraps transport failures as network_error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));

    await expect(request('/health/')).rejects.toMatchObject({
      status: 0,
      code: 'network_error',
    });
  });

  it('skips parsing when parse is "none"', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(null, 204));

    await expect(
      request('/auth/logout/', { method: 'POST', parse: 'none' }),
    ).resolves.toBeUndefined();
  });
});

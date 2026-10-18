import { bootstrapCsrf, getMe, login, logout, register } from '@/lib/api/auth';
import { configureHttpAuth } from '@/lib/api/http';
import { getCsrfToken } from '@/lib/auth/tokens';
import { API_BASE_URL } from '@/lib/config';

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
  configureHttpAuth({ getAccessToken: () => 'tok-123', getCsrfToken });
});

describe('auth endpoints', () => {
  it('bootstraps CSRF and stores the fetched token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ csrfToken: 'csrf-xyz' }));

    const token = await bootstrapCsrf();

    expect(token).toBe('csrf-xyz');
    expect(getCsrfToken()).toBe('csrf-xyz');
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/auth/csrf/`);
  });

  it('posts credentials to the login route', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ csrfToken: 'csrf-login' }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ access: 'acc-new', token_type: 'Bearer' }));

    const response = await login({ username: 'a@b.ph', password: 'secret' });

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(`${API_BASE_URL}/auth/login/`);
    expect(init.method).toBe('POST');
    expect(init.headers['X-CSRFToken']).toBe('csrf-login');
    expect(init.body).toBe(JSON.stringify({ username: 'a@b.ph', password: 'secret' }));
    expect(response.access).toBe('acc-new');
  });

  it('maps register input to the backend field names', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ csrfToken: 'csrf-register' }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ access: 'acc-1', token_type: 'Bearer' }));

    await register({
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      email: 'juan@example.com',
      mobile_number: '+639171111111',
      password: 'Strong-pass-123',
      accept_terms: true,
    });

    const [, init] = fetchMock.mock.calls[1];
    expect(JSON.parse(init.body).accept_terms).toBe(true);
    expect(JSON.parse(init.body).first_name).toBe('Juan');
  });

  it('fetches the current user with the bearer token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 1, first_name: 'Isabella' }));

    await getMe();

    const [, init] = fetchMock.mock.calls[0];
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/me/`);
    expect(init.headers.Authorization).toBe('Bearer tok-123');
  });

  it('logs out and tolerates an empty body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ csrfToken: 'csrf-logout' }));
    fetchMock.mockResolvedValueOnce(jsonResponse(null, 204));

    await expect(logout()).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[1][1].method).toBe('POST');
  });
});

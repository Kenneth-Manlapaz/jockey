import { ApiError } from '@/lib/api/errors';

describe('ApiError', () => {
  it('reads code, message and details from the envelope', () => {
    const error = ApiError.fromResponse(400, {
      error: {
        code: 'betting_error',
        message: 'Betting is closed.',
        details: { race: ['Closed.'] },
      },
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.code).toBe('betting_error');
    expect(error.message).toBe('Betting is closed.');
    expect(error.details).toEqual({ race: ['Closed.'] });
  });

  it('falls back to a status-derived code when the body has no envelope', () => {
    expect(ApiError.fromResponse(403, {}).code).toBe('permission_denied');
    expect(ApiError.fromResponse(404, null).code).toBe('not_found');
    expect(ApiError.fromResponse(500, {}).code).toBe('server_error');
    expect(ApiError.fromResponse(418, {}).code).toBe('unknown_error');
  });

  it('exposes a network factory', () => {
    const error = ApiError.network();
    expect(error.status).toBe(0);
    expect(error.code).toBe('network_error');
  });
});

import { loginPlayer, startPlayerRegistration } from '../src/services/api';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('explains an unreachable API', async () => {
  globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed')) as typeof fetch;
  await expect(loginPlayer('9876543210', 'password-123')).rejects.toThrow(
    'Cannot reach the Royal Club server. Check your connection and try again.',
  );
});

test('shows a server error when the API is reachable', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    status: 503,
    ok: false,
    json: async () => ({ error: 'SMS verification is not configured.' }),
  }) as typeof fetch;
  await expect(startPlayerRegistration({
    name: 'Test Player', phone: '9876543210', dob: '1995-04-12',
    password: 'password-123', confirmPassword: 'password-123',
  })).rejects.toThrow('SMS verification is not configured.');
});

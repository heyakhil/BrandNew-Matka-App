import { loginPlayer, startPlayerRegistration } from '../src/services/api';
import { resolveApiUrl } from '../src/services/apiConfig';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('uses the Metro host for development instead of the device localhost', () => {
  expect(resolveApiUrl('', true, 'http://192.168.1.20:8081/index.bundle', 'android'))
    .toBe('http://192.168.1.20:4000/api');
});

test('requires an HTTPS API URL for release builds', () => {
  expect(resolveApiUrl('https://api.royalclub.example/api/', false))
    .toBe('https://api.royalclub.example/api');
  expect(() => resolveApiUrl('', false)).toThrow(
    'Royal Club server URL is not configured for this app build.',
  );
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

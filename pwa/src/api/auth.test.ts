import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw-server';
import { bootstrapAuth, checkToken } from './auth';
import { FIXTURES } from '@/test/fixtures';

describe('bootstrapAuth', () => {
  it('returns an AuthState with token and user on success', async () => {
    const auth = await bootstrapAuth('test@example.com', 'password');
    expect(auth.token).toBe(FIXTURES.token);
    expect(auth.user.username).toBe(FIXTURES.user.username);
  });

  it('throws if login POST fails', async () => {
    server.use(
      http.post('https://tasks.rblake.net/=/BTDT.Action.Login', () =>
        new HttpResponse(null, { status: 401 })
      )
    );
    await expect(bootstrapAuth('bad@example.com', 'wrong')).rejects.toThrow();
  });

  it('throws if getFrob fails', async () => {
    server.use(
      http.get('https://tasks.rblake.net/services/rest/', ({ request }) => {
        const method = new URL(request.url).searchParams.get('method');
        if (method === 'rtm.auth.getFrob') {
          return HttpResponse.json({ stat: 'fail', code: 100, message: 'Not authorized' });
        }
        return HttpResponse.json({ stat: 'ok' });
      })
    );
    await expect(bootstrapAuth('test@example.com', 'password')).rejects.toThrow();
  });

  it('throws if getToken fails', async () => {
    server.use(
      http.get('https://tasks.rblake.net/services/rest/', ({ request }) => {
        const method = new URL(request.url).searchParams.get('method');
        if (method === 'rtm.auth.getFrob') {
          return HttpResponse.json({ stat: 'ok', frob: 'good-frob' });
        }
        if (method === 'rtm.auth.getToken') {
          return HttpResponse.json({ stat: 'fail', code: 101, message: 'Invalid frob' });
        }
        return HttpResponse.json({ stat: 'ok' });
      })
    );
    await expect(bootstrapAuth('test@example.com', 'password')).rejects.toThrow();
  });
});

describe('checkToken', () => {
  it('returns AuthState for a valid token', async () => {
    const auth = await checkToken(FIXTURES.token);
    expect(auth).not.toBeNull();
    expect(auth!.token).toBe(FIXTURES.token);
  });

  it('returns null for an invalid token', async () => {
    const auth = await checkToken('bad-token-xyz');
    expect(auth).toBeNull();
  });
});

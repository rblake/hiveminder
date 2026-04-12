import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw-server';
import { rtmCall, RtmError } from './client';
import { FIXTURES } from '@/test/fixtures';

const TOKEN = FIXTURES.token;

describe('rtmCall', () => {
  it('returns parsed JSON on stat:ok', async () => {
    const result = await rtmCall('rtm.auth.checkToken', {}, TOKEN) as { auth: { token: string } };
    expect(result.auth.token).toBe(TOKEN);
  });

  it('throws RtmError on stat:fail', async () => {
    server.use(
      http.get('https://tasks.rblake.net/services/rest/', () =>
        HttpResponse.json({ stat: 'fail', code: 98, message: 'Invalid auth token' })
      )
    );
    await expect(rtmCall('rtm.auth.checkToken', {}, 'bad-token')).rejects.toThrow(RtmError);
  });

  it('includes method and auth_token in the request URL', async () => {
    let capturedUrl: string | undefined;
    server.use(
      http.get('https://tasks.rblake.net/services/rest/', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ stat: 'ok' });
      })
    );
    await rtmCall('rtm.tasks.getList', { list_id: '1' }, TOKEN);
    const url = new URL(capturedUrl!);
    expect(url.searchParams.get('method')).toBe('rtm.tasks.getList');
    expect(url.searchParams.get('auth_token')).toBe(TOKEN);
    expect(url.searchParams.get('list_id')).toBe('1');
  });

  it('throws RtmError with code and message on API failure', async () => {
    server.use(
      http.get('https://tasks.rblake.net/services/rest/', () =>
        HttpResponse.json({ stat: 'fail', code: 112, message: 'Method not found' })
      )
    );
    const err = await rtmCall('rtm.bad.method', {}, TOKEN).catch(e => e);
    expect(err).toBeInstanceOf(RtmError);
    expect(err.code).toBe(112);
    expect(err.message).toContain('Method not found');
  });
});

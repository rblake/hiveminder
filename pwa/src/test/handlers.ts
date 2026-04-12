import { http, HttpResponse } from 'msw';
import { FIXTURES } from './fixtures';

// Default MSW handlers — mock the Hiveminder RTM API and Jifty login.
// Tests can override specific handlers with server.use(...).

const BASE = 'https://tasks.rblake.net';

export const handlers = [
  // --- Jifty session login ---
  http.post(`${BASE}/=/BTDT.Action.Login`, () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'Set-Cookie': 'JIFTY_SID_HIVEMINDER=testsession; Path=/; HttpOnly',
      },
    });
  }),

  // --- RTM auth ---
  http.get(`${BASE}/services/rest/`, ({ request }) => {
    const url = new URL(request.url);
    const method = url.searchParams.get('method');

    if (method === 'rtm.auth.getFrob') {
      return HttpResponse.json({ stat: 'ok', frob: FIXTURES.frob });
    }

    if (method === 'rtm.auth.getToken') {
      const frob = url.searchParams.get('frob');
      if (frob === FIXTURES.frob) {
        return HttpResponse.json({
          stat: 'ok',
          auth: { token: FIXTURES.token, user: FIXTURES.user },
        });
      }
      return HttpResponse.json({ stat: 'fail', code: 101, message: 'Invalid frob' });
    }

    if (method === 'rtm.auth.checkToken') {
      const token = url.searchParams.get('auth_token');
      if (token === FIXTURES.token) {
        return HttpResponse.json({
          stat: 'ok',
          auth: { token: FIXTURES.token, user: FIXTURES.user },
        });
      }
      return HttpResponse.json({ stat: 'fail', code: 98, message: 'Login failed / Invalid auth token' });
    }

    // --- Task methods ---
    if (method === 'rtm.tasks.getList') {
      return HttpResponse.json({ stat: 'ok', tasks: FIXTURES.tasks });
    }

    if (method === 'rtm.tasks.add') {
      const name = url.searchParams.get('name') ?? 'New task';
      return HttpResponse.json({
        stat: 'ok',
        task: { ...FIXTURES.tasks[0], id: 'new1', summary: name },
      });
    }

    if (method === 'rtm.tasks.complete') {
      return HttpResponse.json({ stat: 'ok' });
    }

    if (method === 'rtm.tasks.delete') {
      return HttpResponse.json({ stat: 'ok' });
    }

    if (method === 'rtm.tasks.setName') {
      return HttpResponse.json({ stat: 'ok' });
    }

    if (method === 'rtm.tasks.setDueDate') {
      return HttpResponse.json({ stat: 'ok' });
    }

    if (method === 'rtm.tasks.setTags') {
      return HttpResponse.json({ stat: 'ok' });
    }

    if (method === 'rtm.lists.getList') {
      return HttpResponse.json({ stat: 'ok', lists: FIXTURES.lists });
    }

    // Unhandled RTM method — fail loudly so tests catch missing handlers
    return HttpResponse.json({
      stat: 'fail',
      code: 112,
      message: `Method not found: ${method}`,
    });
  }),
];

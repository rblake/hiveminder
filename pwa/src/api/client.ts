// Base URL for the Hiveminder RTM API.
// VITE_API_BASE is empty in production (PWA is same-origin with Hiveminder,
// so relative paths work and Vite's proxy handles dev). In tests, vitest.config.ts
// sets it to https://tasks.rblake.net so MSW can intercept the requests.
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';
const RTM_BASE = `${API_BASE}/services/rest/`;
const LOGIN_URL = `${API_BASE}/=/BTDT.Action.Login`;

export class RtmError extends Error {
  constructor(
    message: string,
    public readonly code: number
  ) {
    super(`RTM ${code}: ${message}`);
    this.name = 'RtmError';
  }
}

// Make an RTM API call. Returns the parsed response body (minus stat/code/message).
// Throws RtmError if the API returns stat:fail or the network fails.
export async function rtmCall(
  method: string,
  params: Record<string, string>,
  token: string
): Promise<unknown> {
  const url = new URL(RTM_BASE, API_BASE || window.location.origin);
  url.searchParams.set('method', method);
  url.searchParams.set('auth_token', token);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { credentials: 'same-origin' });
  if (!res.ok) {
    throw new RtmError(`HTTP ${res.status}`, res.status);
  }

  const json = (await res.json()) as { stat: string; code?: number; message?: string };
  if (json.stat !== 'ok') {
    throw new RtmError(json.message ?? 'Unknown error', json.code ?? 0);
  }

  return json;
}

// POST a Jifty action login. Used once during the auth bootstrap to get a session
// cookie, which the browser then sends automatically on subsequent requests.
// Returns true on success, throws on failure.
export async function jiftyLogin(email: string, password: string): Promise<void> {
  const body = new URLSearchParams({
    'J:A:F-email-Login': email,
    'J:A:F-password-Login': password,
  });

  const res = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    credentials: 'same-origin',
  });

  if (!res.ok) {
    throw new RtmError(`Login failed: HTTP ${res.status}`, res.status);
  }
  // The session cookie is set by the browser's cookie jar automatically.
  // We don't read or store it — we use it immediately to get a permanent token.
}

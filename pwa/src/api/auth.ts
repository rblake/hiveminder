import { jiftyLogin, rtmCall, RtmError } from './client';
import type { AuthState, AuthUser } from '@/types';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

// Authorize a frob against the current session using the SessionAuth action.
// This is required by Hiveminder's RTM implementation before a frob can be
// exchanged for a permanent token.
async function authorizeFromob(frob: string): Promise<void> {
  const res = await fetch(`${API_BASE}/=/action/BTDT.Action.SessionAuth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: new URLSearchParams({ frob }).toString(),
    credentials: 'same-origin',
  });
  if (!res.ok) throw new RtmError(`SessionAuth failed: HTTP ${res.status}`, res.status);
  const json = (await res.json()) as { success: number; message?: string };
  if (!json.success) throw new RtmError(json.message ?? 'SessionAuth failed', 0);
}

// One-time auth bootstrap:
//   1. POST email+password → session cookie (stored in browser cookie jar)
//   2. GET getFrob → frob tied to the now-authenticated session
//   3. POST SessionAuth → authorize the frob against the session
//   4. GET getToken → permanent RTM token
//
// After this we store the token and never touch the session cookie again.
export async function bootstrapAuth(email: string, password: string): Promise<AuthState> {
  await jiftyLogin(email, password);

  // getFrob is called with the session cookie automatically attached
  const frobRes = await rtmCall('rtm.auth.getFrob', {}, '') as { frob: string };
  const frob = frobRes.frob;

  await authorizeFromob(frob);

  const tokenRes = await rtmCall('rtm.auth.getToken', { frob }, '') as {
    auth: { token: string; user: AuthUser };
  };

  return {
    token: tokenRes.auth.token,
    user: tokenRes.auth.user,
  };
}

// Validate a stored token. Returns AuthState if valid, null if expired/invalid.
// Call this on app startup before showing the main UI.
export async function checkToken(token: string): Promise<AuthState | null> {
  try {
    const res = await rtmCall('rtm.auth.checkToken', {}, token) as {
      auth: { token: string; user: AuthUser };
    };
    return { token: res.auth.token, user: res.auth.user };
  } catch (err) {
    if (err instanceof RtmError) return null;
    throw err;
  }
}

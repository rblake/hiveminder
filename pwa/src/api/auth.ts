import { jiftyLogin, rtmCall, RtmError } from './client';
import type { AuthState, AuthUser } from '@/types';

// One-time auth bootstrap:
//   1. POST email+password → session cookie (stored in browser cookie jar)
//   2. GET getFrob → frob tied to the now-authenticated session
//   3. GET getToken → permanent RTM token
//
// After this we store the token and never touch the session cookie again.
export async function bootstrapAuth(email: string, password: string): Promise<AuthState> {
  await jiftyLogin(email, password);

  // getFrob is called with the session cookie automatically attached
  const frobRes = await rtmCall('rtm.auth.getFrob', {}, '') as { frob: string };
  const frob = frobRes.frob;

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

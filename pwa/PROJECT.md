# Hiveminder PWA — Project Notes

## What this is

A Progressive Web App for two users (husband on Android, wife on iPhone) to interact
with the self-hosted Hiveminder task manager at `tasks.rblake.net`. The primary use
case is mobile: reviewing tasks and capturing new ones quickly by voice.

---

## Key decisions and why

### PWA over native app

We considered React Native (Expo) first. Switched to PWA because:
- **No app stores, no Apple Developer account** — iOS install is Safari → Add to Home Screen.
  Android install is Chrome → Add to Home Screen. Zero cost, zero accounts.
- **Single deploy** — build once, both users access the same URL with their own logins.
- **Voice works on both platforms** — Web Speech API (`webkitSpeechRecognition` on iOS
  Safari, `SpeechRecognition` on Android Chrome). iOS doesn't give live `interimResults`
  preview but the final transcript is reliable.
- The one downside: no home-screen widgets or deep OS integration. Not needed here.

### React + Vite (not Svelte, not plain JS)

- User has JS in their toolkit already (moonlights in it). React is the highest-documentation
  choice — any question has a Stack Overflow answer.
- Vite for build: fast, simple config, first-class TypeScript and CSS Modules.
- Deliberately no UI component library — less to learn, nothing opinionated to fight.

### TanStack Query for server state

Task lists are server state: they live on `tasks.rblake.net`, not in the app. React Query
handles caching, background refresh, and optimistic updates. The optimistic complete
pattern (remove task immediately, roll back on error) is the core of why the app feels
responsive. Zustand was considered but isn't needed — React Query's cache is the store.

### Auth: session cookie → permanent RTM token

Hiveminder has three auth options:
- **Option A** (RTM frob flow): designed for third-party apps; requires the user to visit
  a web page mid-flow. Awkward for a first-party app.
- **Option B** (feed auth token): read-only. Useless for task creation.
- **Option C** (session cookie): POST email+password, get a cookie. Expires.

We use Option C as a **bootstrap only** to get an Option A permanent token:

```
POST /=/BTDT.Action.Login  → session cookie (browser stores it automatically)
GET  /services/rest/?method=rtm.auth.getFrob  (cookie auto-attached) → frob
GET  /services/rest/?method=rtm.auth.getToken&frob=X  → permanent token
```

The permanent token is stored in `localStorage` and used forever (or until invalidated).
No session cookie management after the one-time login. Each user's browser has their own
token — wife on iPhone, husband on Android, fully independent.

**Risk**: If `rtm.auth.getToken` requires explicit frob authorization (i.e., the frob
needs to be approved via a separate web-UI step before getToken works), this flow will
fail. Fallback: use the session cookie for all requests with `credentials: 'same-origin'`
and handle re-auth on session expiry. **Verify this against the live server.**

### parse=1 for voice task creation

When the user adds a task, we send `parse=1` to Hiveminder's RTM API. This lets the
server extract inline metadata from the task name:

```
"Buy milk [due: friday] [tags: errands] [priority: high]"
```

The voice transcript populates a text field that the user can edit before submitting.
Quick-insert chips (`[due: today]`, etc.) let users append metadata without knowing
the bracket syntax by heart.

### Optimistic completion

Completing a task in a task manager is the most frequent interaction. Making it feel
instant matters. TanStack Query's `onMutate` / `onError` pattern:
1. Remove the task from the cache immediately (user sees it gone)
2. POST to the API in the background
3. If API fails: roll back (task reappears) + invalidate cache to sync

The user's wife is the primary mobile user. A laggy checkbox that waits for the server
would make the app feel slow. Optimistic updates fix this.

### CSS Modules (no CSS framework)

No Tailwind, no styled-components, no Emotion. Each component has a `.module.css`
file alongside it. Reasons:
- Zero runtime overhead
- No build-time class generation to understand
- Scoping is automatic (no BEM, no naming conventions)
- The user has a scientific programming background; `.module.css` maps naturally to
  "a header file for styles"

---

## Architecture

```
App.tsx
  ├── (loading) — validates stored token on startup
  ├── Login.tsx — one-time setup, never seen again after first login
  └── (authenticated)
        ├── Tasks.tsx — task list with To Do / Later tabs, FAB to add
        └── AddTask.tsx — voice + text input, submit to API

src/api/
  client.ts   — fetch wrapper, injects auth_token, throws RtmError on stat:fail
  auth.ts     — bootstrapAuth (login → frob → token) + checkToken
  tasks.ts    — getList, add, complete, delete, setName, setDueDate, setTags

src/hooks/
  useTasks.ts — TanStack Query: fetch tasks, optimistic complete, add mutation
  useVoice.ts — Web Speech API abstraction, returns transcript + listening state

src/components/
  TaskRow.tsx    — single task: checkbox, summary, priority dot, due chip, expand desc
  MicButton.tsx  — pulsing mic button (CSS animation, no JS animation library)

src/test/
  setup.ts      — vitest + @testing-library/jest-dom init
  msw-server.ts — shared MSW node server
  handlers.ts   — default API mock handlers (all RTM methods + Jifty login)
  fixtures.ts   — shared test data (tasks, user, token, lists)
```

Navigation is a simple React state machine (`'loading' | 'login' | 'tasks' | 'add'`)
in App.tsx. No router library — the app has exactly two screens after login and the
transition is always explicit. This was intentional: a router adds concepts (routes,
history, back navigation) that don't add value at this scope.

---

## How to test

```bash
cd pwa/
npm install
npm run test:run    # all tests, single pass — use this before deploying
npm test            # watch mode for development
```

All tests mock the Hiveminder API via MSW (Mock Service Worker). No running server
needed. MSW intercepts `fetch` calls at the network layer and returns controlled
responses from `src/test/handlers.ts`.

The `VITE_API_BASE=https://tasks.rblake.net` env var is set in `vitest.config.ts`
so that `client.ts` generates URLs that MSW can intercept. In production the app is
same-origin, so `API_BASE` is empty and relative URLs work.

### Test coverage by module

| File | What's tested |
|------|---------------|
| `api/client.test.ts` | stat:ok parsing, stat:fail → RtmError, URL param injection |
| `api/auth.test.ts` | full bootstrap flow, login failure, getFrob failure, checkToken valid/invalid |
| `api/tasks.test.ts` | getList, modified_after passthrough, addTask parse=1, complete, delete |
| `hooks/useVoice.test.ts` | supported flag, start/stop, transcript update, error handling |
| `hooks/useTasks.test.tsx` | fetch, error state, optimistic complete, rollback on error, add |
| `components/TaskRow.test.tsx` | render, due date, complete callback, expand description, priority dot |
| `components/MicButton.test.tsx` | render, onStart/onStop dispatch, aria-label, listening CSS class |
| `pages/Login.test.tsx` | form fields, success → onLogin, failure → alert, loading state |
| `pages/Tasks.test.tsx` | task list render, loading state, tab buttons, FAB → onAddTask |
| `pages/AddTask.test.tsx` | text input, mic button, submit disabled when empty, chip append, cancel |

### What tests do NOT cover

- `App.tsx` — the root auth gate (startup token check, view switching). Integration
  test would need more setup; test manually.
- The actual frob token exchange flow against a real Hiveminder instance — must be
  verified by running the app and logging in the first time.
- Voice transcription — cannot be unit-tested (SpeechRecognition is a native browser
  API that requires a real microphone). Test on physical devices.

---

## What still needs to be done

### Before first use

- [ ] **Add PWA icons** — `public/icons/192.png` and `public/icons/512.png`.
  Any 192×192 and 512×512 PNG will work. Without them the PWA manifest is technically
  incomplete (install prompt may not fire on Android).

- [ ] **Verify auth bootstrap against live server** — the frob flow assumes that
  calling `getFrob` while authenticated via session cookie automatically ties the frob
  to the session, making `getToken` work immediately. This needs to be confirmed against
  `tasks.rblake.net`. If it doesn't work: simpler fallback is to skip the frob step
  entirely, keep the session cookie, and handle re-auth when the session expires.

- [ ] **Apache config** — add the `Alias /app /opt/hiveminder-pwa` block to the
  `tasks.rblake.net-ssl.conf` VirtualHost before the `ProxyPass /` line.
  See `SETUP.md` for the exact snippet.

- [ ] **Deploy DNS + HTTPS** — `tasks.rblake.net` must be up and HTTPS before
  voice recognition works. Web Speech API is gated on secure contexts.

### Nice-to-have for v1.1

- [ ] **`modified_after` incremental sync** — `getTasks` accepts `modified_after`
  and the API supports it, but the app doesn't persist a `last_sync_time` anywhere.
  Add `localStorage.setItem('last_sync', new Date().toISOString())` after each
  successful fetch and pass it on the next fetch. Reduces bandwidth on background
  refreshes.

- [ ] **Task tags display** — `TaskRow` shows priority dot and due date but not tags.
  Add a tag list below the summary for tasks with tags set.

- [ ] **Delete task UI** — `deleteTask` is implemented in `api/tasks.ts` but there's
  no UI to trigger it. A long-press on a task row, or a swipe-left to reveal a delete
  button, would cover this.

- [ ] **Pull-to-refresh** — currently the task list refetches every 60s automatically.
  A manual pull-to-refresh gesture would let users force a sync. Requires a touch
  gesture handler (no library needed — track `touchstart`/`touchmove` delta).

- [ ] **Error boundary** — if a component throws unexpectedly, the app goes blank.
  Wrap `<App>` in an `<ErrorBoundary>` that shows a "Something went wrong / Reload"
  message.

- [ ] **App.tsx tests** — the root component (token validation on startup, view
  switching) has no automated tests. Add an integration test using `renderHook` or
  `render(<App />)` with MSW controlling the `checkToken` response.

- [ ] **Logout** — there's no way to log out short of clearing localStorage manually.
  A settings button or long-press on the header could expose this.

---

## Design: current state and open decisions

See the next section for the open design discussion — no visual design decisions
were explicitly made. The current CSS is functional-minimal:
- System font stack (`-apple-system, BlinkMacSystemFont, …`)
- Blue accent (#2563eb, Tailwind blue-600)
- White background, light gray borders
- 52px task row min-height (touch-accessible)
- FAB bottom-right for add
- Pulsing red mic button while recording

---

## Files to reference

| File | Purpose |
|------|---------|
| `../HIVEMINDER-API.md` | API reference — every `src/api/` call derives from this |
| `SETUP.md` | Build, test, deploy, and phone install instructions |
| `src/test/handlers.ts` | The mock API — if real responses differ, fix here first |
| `src/test/fixtures.ts` | Shared test data — matches the shape of real API responses |

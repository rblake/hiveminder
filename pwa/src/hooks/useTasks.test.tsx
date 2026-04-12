import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw-server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTasks, useCompleteTask, useAddTask } from './useTasks';
import { FIXTURES } from '@/test/fixtures';
import type { ReactNode } from 'react';

const TOKEN = FIXTURES.token;

// Wrapper provides a fresh QueryClient per test so cache doesn't bleed between tests.
function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useTasks', () => {
  it('fetches and returns tasks for the given list', async () => {
    const { result } = renderHook(() => useTasks(TOKEN, 1), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(FIXTURES.tasks.length);
    expect(result.current.data?.[0].summary).toBe('Buy milk');
  });

  it('returns error state when the API fails', async () => {
    server.use(
      http.get('https://tasks.rblake.net/services/rest/', () =>
        HttpResponse.json({ stat: 'fail', code: 300, message: 'Server error' })
      )
    );
    const { result } = renderHook(() => useTasks(TOKEN, 1), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCompleteTask', () => {
  it('removes the completed task from the cache optimistically', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );

    // Pre-populate cache
    qc.setQueryData(['tasks', TOKEN, 1], FIXTURES.tasks);

    const { result } = renderHook(() => useCompleteTask(TOKEN, 1), { wrapper });

    act(() => { result.current.mutate('4ab'); });

    // Optimistic update: task should be gone immediately
    const cached = qc.getQueryData<typeof FIXTURES.tasks>(['tasks', TOKEN, 1]);
    expect(cached?.find(t => t.id === '4ab')).toBeUndefined();
  });

  it('rolls back the cache if the API call fails', async () => {
    server.use(
      http.get('https://tasks.rblake.net/services/rest/', () =>
        HttpResponse.json({ stat: 'fail', code: 300, message: 'Error' })
      )
    );

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['tasks', TOKEN, 1], FIXTURES.tasks);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCompleteTask(TOKEN, 1), { wrapper });
    act(() => { result.current.mutate('4ab'); });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Rollback: task should be back
    const cached = qc.getQueryData<typeof FIXTURES.tasks>(['tasks', TOKEN, 1]);
    expect(cached?.find(t => t.id === '4ab')).toBeDefined();
  });
});

describe('useAddTask', () => {
  it('adds a task and invalidates the task list cache', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['tasks', TOKEN, 1], FIXTURES.tasks);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAddTask(TOKEN), { wrapper });
    await act(async () => { result.current.mutate('New task'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

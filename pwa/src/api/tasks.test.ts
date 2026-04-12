import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw-server';
import { getTasks, addTask, completeTask, deleteTask } from './tasks';
import { FIXTURES } from '@/test/fixtures';

const TOKEN = FIXTURES.token;

describe('getTasks', () => {
  it('returns tasks for a list', async () => {
    const tasks = await getTasks(TOKEN, { list_id: 1 });
    expect(tasks).toHaveLength(FIXTURES.tasks.length);
    expect(tasks[0].id).toBe('4ab');
    expect(tasks[0].summary).toBe('Buy milk');
  });

  it('passes modified_after to the API when provided', async () => {
    let capturedUrl: string | undefined;
    server.use(
      http.get('https://tasks.rblake.net/services/rest/', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ stat: 'ok', tasks: [] });
      })
    );
    await getTasks(TOKEN, { modified_after: '2026-04-01T00:00:00Z' });
    const url = new URL(capturedUrl!);
    expect(url.searchParams.get('modified_after')).toBe('2026-04-01T00:00:00Z');
  });
});

describe('addTask', () => {
  it('creates a task and returns it', async () => {
    const task = await addTask(TOKEN, 'Buy coffee [due: tomorrow] [tags: errands]');
    expect(task.summary).toBe('Buy coffee [due: tomorrow] [tags: errands]');
    expect(task.id).toBeTruthy();
  });

  it('sends parse=1 so the server handles inline metadata', async () => {
    let capturedUrl: string | undefined;
    server.use(
      http.get('https://tasks.rblake.net/services/rest/', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ stat: 'ok', task: FIXTURES.tasks[0] });
      })
    );
    await addTask(TOKEN, 'Some task');
    const url = new URL(capturedUrl!);
    expect(url.searchParams.get('parse')).toBe('1');
  });
});

describe('completeTask', () => {
  it('resolves without error for a valid task id', async () => {
    await expect(completeTask(TOKEN, '4ab')).resolves.toBeUndefined();
  });

  it('throws on API error', async () => {
    server.use(
      http.get('https://tasks.rblake.net/services/rest/', () =>
        HttpResponse.json({ stat: 'fail', code: 300, message: 'Task not found' })
      )
    );
    await expect(completeTask(TOKEN, 'bad-id')).rejects.toThrow();
  });
});

describe('deleteTask', () => {
  it('resolves without error for a valid task id', async () => {
    await expect(deleteTask(TOKEN, '4ab')).resolves.toBeUndefined();
  });
});

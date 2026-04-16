import type { Task } from '@/types';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

// Use the Hiveminder model REST API for task CRUD.
// This returns Task objects that match our interface directly.
// Auth is via the session cookie set during jiftyLogin (with remember=1,
// the cookie is persistent for 1 year).

async function modelGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

async function modelPost(action: string, fields: Record<string, string>): Promise<{ success: number; message?: string; content?: Record<string, unknown> }> {
  const res = await fetch(`${API_BASE}/=/action/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: new URLSearchParams(fields).toString(),
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getTasks(_token: string, opts: { list_id?: number; modified_after?: string } = {}): Promise<Task[]> {
  const all = await modelGet<Task[]>('/=/search/Task/complete/0.json');
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  if (opts.list_id === 2) {
    // Later: tasks with a starts date in the future
    return all.filter(t => t.starts != null && t.starts > today);
  }
  // Todo (default): tasks with no starts date, or starts today or earlier
  return all.filter(t => t.starts == null || t.starts <= today);
}

export async function addTask(_token: string, name: string, _listId = 1): Promise<Task> {
  const res = await fetch(`${API_BASE}/=/action/BTDT.Action.CreateTask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: new URLSearchParams({ summary: name }).toString(),
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  if (res.redirected) {
    // Jifty responds with a 302 to the created task's JSON URL; fetch follows it
    // automatically and the response body is already the full Task object.
    return res.json() as Promise<Task>;
  }

  // Non-redirect fallback: parse the action result and fetch the task separately.
  const action = await res.json() as { success: number; message?: string; content?: { record_locator?: string } };
  if (!action.success) throw new Error(action.message ?? 'Failed to create task');
  const rl = action.content?.record_locator;
  if (!rl) throw new Error('No record locator in response');
  return modelGet<Task>(`/=/model/Task/id/${rl}.json`);
}

export async function completeTask(_token: string, taskId: string): Promise<void> {
  await modelPost('BTDT.Action.UpdateTask', { id: taskId, complete: '1' });
}

export async function deleteTask(_token: string, taskId: string): Promise<void> {
  await modelPost('BTDT.Action.DeleteTask', { id: taskId });
}

export async function setTaskName(_token: string, taskId: string, name: string): Promise<void> {
  await modelPost('BTDT.Action.UpdateTask', { id: taskId, summary: name });
}

export async function setTaskDueDate(_token: string, taskId: string, due: string): Promise<void> {
  await modelPost('BTDT.Action.UpdateTask', { id: taskId, due });
}

export async function setTaskTags(_token: string, taskId: string, tags: string): Promise<void> {
  await modelPost('BTDT.Action.UpdateTask', { id: taskId, tags });
}

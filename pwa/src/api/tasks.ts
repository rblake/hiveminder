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
  const res = await modelPost('BTDT.Action.CreateTask', { summary: name });
  if (!res.success) throw new Error(res.message ?? 'Failed to create task');
  const id = res.content?.id as string;
  return modelGet<Task>(`/=/model/Task/id/${id}.json`);
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

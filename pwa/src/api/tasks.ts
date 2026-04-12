import { rtmCall } from './client';
import type { Task } from '@/types';

interface GetTasksOptions {
  list_id?: number;
  modified_after?: string;  // ISO8601 — fetches only tasks changed since this time
}

export async function getTasks(token: string, opts: GetTasksOptions = {}): Promise<Task[]> {
  const params: Record<string, string> = {};
  if (opts.list_id !== undefined) params.list_id = String(opts.list_id);
  if (opts.modified_after) params.modified_after = opts.modified_after;

  const res = await rtmCall('rtm.tasks.getList', params, token) as { tasks: Task[] };
  return res.tasks ?? [];
}

// Add a task. Pass parse=1 so the server extracts inline metadata:
//   "Buy milk [due: friday] [tags: errands] [priority: high]"
export async function addTask(token: string, name: string, listId = 1): Promise<Task> {
  const res = await rtmCall(
    'rtm.tasks.add',
    { name, list_id: String(listId), parse: '1' },
    token
  ) as { task: Task };
  return res.task;
}

// Mark a task complete. Returns nothing on success, throws RtmError on failure.
export async function completeTask(token: string, taskId: string): Promise<void> {
  await rtmCall('rtm.tasks.complete', { task_id: taskId }, token);
}

export async function deleteTask(token: string, taskId: string): Promise<void> {
  await rtmCall('rtm.tasks.delete', { task_id: taskId }, token);
}

export async function setTaskName(token: string, taskId: string, name: string): Promise<void> {
  await rtmCall('rtm.tasks.setName', { task_id: taskId, name }, token);
}

export async function setTaskDueDate(token: string, taskId: string, due: string): Promise<void> {
  // Pass empty string to clear the due date
  await rtmCall('rtm.tasks.setDueDate', { task_id: taskId, due }, token);
}

export async function setTaskTags(token: string, taskId: string, tags: string): Promise<void> {
  await rtmCall('rtm.tasks.setTags', { task_id: taskId, tags }, token);
}

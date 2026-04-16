import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, addTask, completeTask } from '@/api/tasks';
import type { Task } from '@/types';

// Cache key factory — keeps all task queries invalidatable together.
const taskKey = (token: string, listId: number) => ['tasks', token, listId] as const;

export function useTasks(token: string, listId: number) {
  return useQuery({
    queryKey: taskKey(token, listId),
    queryFn: () => getTasks(token, { list_id: listId }),
    // Background refresh every 60s while the app is foregrounded.
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    // Don't re-fetch if data is less than 30s old (avoids hammering on tab switch).
    staleTime: 30_000,
  });
}

export function useCompleteTask(token: string, listId: number) {
  const qc = useQueryClient();
  const key = taskKey(token, listId);

  return useMutation({
    mutationFn: (taskId: string) => completeTask(token, taskId),

    onMutate: async (taskId: string) => {
      // Cancel any outgoing refetch so it doesn't overwrite our optimistic update.
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Task[]>(key);
      // Optimistic: remove the completed task immediately from the list.
      qc.setQueryData<Task[]>(key, old => old?.filter(t => t.id !== taskId));
      return { previous };
    },

    onError: (_err, _taskId, ctx) => {
      // Rollback: restore the previous list so the task reappears.
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },

    onSettled: () => {
      // Sync with the server regardless of success or failure.
      qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useAddTask(token: string, ownerEmail?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => addTask(token, name, ownerEmail),
    onSuccess: () => {
      // Invalidate both lists so they re-fetch from the server when navigating back.
      qc.invalidateQueries({ queryKey: ['tasks', token] });
    },
  });
}

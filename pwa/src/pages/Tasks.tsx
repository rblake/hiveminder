import { useState } from 'react';
import { useTasks, useCompleteTask } from '@/hooks/useTasks';
import { TaskRow } from '@/components/TaskRow';
import styles from './Tasks.module.css';

interface Props {
  token: string;
  onAddTask: () => void;
}

const LISTS = [
  { id: 1, label: 'To Do' },
  { id: 2, label: 'Later' },
] as const;

export function Tasks({ token, onAddTask }: Props) {
  const [listId, setListId] = useState<1 | 2>(1);
  const { data: tasks, isLoading, isError } = useTasks(token, listId);
  const { mutate: complete } = useCompleteTask(token, listId);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.tabs}>
          {LISTS.map(l => (
            <button
              key={l.id}
              className={`${styles.tab} ${listId === l.id ? styles.active : ''}`}
              onClick={() => setListId(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <main className={styles.list}>
        {isLoading && <p className={styles.status}>Loading…</p>}
        {isError && <p className={styles.status}>Could not load tasks. Pull to refresh.</p>}
        {tasks?.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={complete}
          />
        ))}
        {tasks?.length === 0 && !isLoading && (
          <p className={styles.empty}>No tasks here.</p>
        )}
      </main>

      <button
        className={styles.fab}
        onClick={onAddTask}
        aria-label="Add task"
      >
        +
      </button>
    </div>
  );
}

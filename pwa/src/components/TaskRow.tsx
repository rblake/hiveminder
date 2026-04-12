import { useState } from 'react';
import type { Task } from '@/types';
import { priorityColor, priorityLabel } from '@/types';
import styles from './TaskRow.module.css';

interface Props {
  task: Task;
  onComplete: (id: string) => void;
}

// Format YYYY-MM-DD as "Apr 15" for display.
function formatDue(due: string): string {
  const d = new Date(due + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TaskRow({ task, onComplete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasDesc = task.description.trim().length > 0;
  const hasPriority = task.priority >= 3;

  return (
    <div className={styles.row}>
      <div className={styles.main}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={false}
          onChange={() => onComplete(task.id)}
          aria-label={`Complete: ${task.summary}`}
        />

        <button
          className={styles.summary}
          onClick={() => hasDesc && setExpanded(e => !e)}
        >
          {hasPriority && (
            <span
              data-testid="priority-dot"
              className={styles.priorityDot}
              style={{ background: priorityColor(task.priority) }}
              title={priorityLabel(task.priority)}
            />
          )}
          {task.summary}
        </button>

        {task.due && (
          <span data-testid="due-chip" className={styles.due}>
            {formatDue(task.due)}
          </span>
        )}
      </div>

      {expanded && hasDesc && (
        <p data-testid="task-description" className={styles.description}>
          {task.description}
        </p>
      )}
    </div>
  );
}

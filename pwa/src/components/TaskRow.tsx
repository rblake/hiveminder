import { useState } from 'react';
import type { Task } from '@/types';
import { priorityColor, priorityLabel } from '@/types';
import styles from './TaskRow.module.css';

interface Props {
  task: Task;
  onComplete: (id: string) => void;
}

function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function dueDateStyle(due: string): { label: string; color: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (due < today)   return { label: formatDate(due), color: '#dc2626' }; // red — overdue
  if (due === today) return { label: 'Today',         color: '#d97706' }; // amber — today
  return             { label: formatDate(due),        color: '#16a34a' }; // green — upcoming
}

// Address in parens must end with a 2-letter state and/or 5(+4)-digit ZIP.
// e.g. (123 Main St, Chicago, IL) or (456 Oak Ave, IL 60601) or (60601)
const ADDRESS_RE = /,\s*[A-Z]{2}(?:\s+\d{5}(?:-\d{4})?)?$|\d{5}(?:-\d{4})?$/;

// Matches addresses in parens, http(s):// URLs, bare www. URLs, and phone numbers.
// Address pattern is first so (312) area codes don't trip the phone matcher.
const LINK_RE = /(\([^)]+(?:,\s*[A-Z]{2}(?:\s+\d{5}(?:-\d{4})?)?|\d{5}(?:-\d{4})?)\)|https?:\/\/[^\s<>"]+|www\.[^\s<>"]+|\b\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b)/g;

function linkify(text: string): React.ReactNode[] {
  const parts = text.split(LINK_RE);
  return parts.map((part, i) => {
    if (/^\(/.test(part) && ADDRESS_RE.test(part.slice(1, -1))) {
      const address = part.slice(1, -1);
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
      return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={styles.link} onClick={e => e.stopPropagation()}>{part}</a>;
    }
    if (/^https?:\/\//i.test(part)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={styles.link} onClick={e => e.stopPropagation()}>{part}</a>;
    }
    if (/^www\./i.test(part)) {
      return <a key={i} href={`https://${part}`} target="_blank" rel="noopener noreferrer" className={styles.link} onClick={e => e.stopPropagation()}>{part}</a>;
    }
    if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(part)) {
      const tel = part.replace(/[^\d+]/g, '');
      return <a key={i} href={`tel:${tel}`} className={styles.link} onClick={e => e.stopPropagation()}>{part}</a>;
    }
    return part;
  });
}

export function TaskRow({ task, onComplete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasDesc = task.description.trim().length > 0;
  const hasPriority = task.priority >= 3;
  const tagList = task.tags ? task.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const hasMeta = tagList.length > 0 || !!task.starts;

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

        <div
          className={styles.summary}
          role={hasDesc ? 'button' : undefined}
          tabIndex={hasDesc ? 0 : undefined}
          onClick={() => hasDesc && setExpanded(e => !e)}
          onKeyDown={e => e.key === 'Enter' && hasDesc && setExpanded(ex => !ex)}
        >
          {hasPriority && (
            <span
              data-testid="priority-dot"
              className={styles.priorityDot}
              style={{ background: priorityColor(task.priority) }}
              title={priorityLabel(task.priority)}
            />
          )}
          {linkify(task.summary)}
        </div>

        {task.due && (() => {
          const { label, color } = dueDateStyle(task.due);
          return (
            <span data-testid="due-chip" className={styles.due} style={{ color }}>
              {label}
            </span>
          );
        })()}
      </div>

      {hasMeta && (
        <div className={styles.meta}>
          {tagList.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
          {task.starts && (
            <span className={styles.hiddenUntil}>until {formatDate(task.starts)}</span>
          )}
        </div>
      )}

      {expanded && hasDesc && (
        <p data-testid="task-description" className={styles.description}>
          {linkify(task.description)}
        </p>
      )}
    </div>
  );
}

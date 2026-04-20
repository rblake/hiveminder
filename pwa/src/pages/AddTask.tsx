import { useState } from 'react';
import { useAddTask, useCompleteTask } from '@/hooks/useTasks';
import { useVoice } from '@/hooks/useVoice';
import { MicButton } from '@/components/MicButton';
import { TaskRow } from '@/components/TaskRow';
import { parseVoiceInput } from '@/api/voice';
import type { Task } from '@/types';
import styles from './AddTask.module.css';

interface Props {
  token: string;
  ownerEmail: string;
  onCancel: () => void;
}

export function AddTask({ token, ownerEmail, onCancel }: Props) {
  const [text, setText] = useState('');
  const [addedTasks, setAddedTasks] = useState<Task[]>([]);
  const { mutate: addTask, isPending, isError } = useAddTask(token, ownerEmail);
  const { mutate: completeTask } = useCompleteTask(token, 1);
  const { isListening, startListening, stopListening, supported, transcript, error: voiceError } = useVoice();

  // When speech recognition produces a transcript, populate the text field.
  // We use a ref-based approach: transcript from useVoice is the live value;
  // we mirror it into text whenever it changes (while listening).
  if (isListening && transcript && transcript !== text) {
    setText(transcript);
  }

  const handleSubmit = () => {
    if (!text.trim()) return;
    addTask(parseVoiceInput(text.trim()), {
      onSuccess: (newTask) => {
        setText('');
        setAddedTasks(prev => [...prev, newTask]);
      },
    });
  };

  const handleComplete = (id: string) => {
    completeTask(id);
    setAddedTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.cancel} onClick={onCancel} aria-label="Cancel">
          Cancel
        </button>
        <h2 className={styles.title}>Add Task</h2>
        <div className={styles.spacer} />
      </header>

      <main className={styles.main}>
        <div className={styles.actions}>
          {supported && (
            <MicButton
              isListening={isListening}
              onStart={startListening}
              onStop={stopListening}
            />
          )}

          <button
            className={styles.submit}
            onClick={handleSubmit}
            disabled={!text.trim() || isPending}
            aria-label="Add task"
          >
            {isPending ? 'Adding…' : 'Add Task'}
          </button>
        </div>

        {isError && (
          <p className={styles.error}>Couldn't save — check your connection and try again.</p>
        )}

        <textarea
          className={styles.input}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={
            supported
              ? 'Type or tap the mic to speak…'
              : 'Type your task here…'
          }
          rows={4}
          autoFocus
          aria-label="Task text"
        />

        {isListening && (
          <p className={styles.hint}>Listening… speak your task</p>
        )}

        {voiceError && (
          <p className={styles.error}>{voiceError}</p>
        )}

        {addedTasks.length > 0 && (
          <div className={styles.addedList}>
            {addedTasks.map(task => (
              <TaskRow key={task.id} task={task} onComplete={handleComplete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

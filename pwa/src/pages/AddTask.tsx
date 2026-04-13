import { useState } from 'react';
import { useAddTask } from '@/hooks/useTasks';
import { useVoice } from '@/hooks/useVoice';
import { MicButton } from '@/components/MicButton';
import { parseVoiceInput } from '@/api/voice';
import styles from './AddTask.module.css';

interface Props {
  token: string;
  onSubmit: () => void;
  onCancel: () => void;
}

const CHIPS = [
  '[due: today]',
  '[due: tomorrow]',
  '[priority: high]',
  '[tags: errands]',
] as const;

export function AddTask({ token, onSubmit, onCancel }: Props) {
  const [text, setText] = useState('');
  const { mutate: addTask, isPending } = useAddTask(token);
  const { isListening, startListening, stopListening, supported, transcript } = useVoice();

  // When speech recognition produces a transcript, populate the text field.
  // We use a ref-based approach: transcript from useVoice is the live value;
  // we mirror it into text whenever it changes (while listening).
  if (isListening && transcript && transcript !== text) {
    setText(transcript);
  }

  const appendChip = (chip: string) => {
    setText(t => t ? `${t} ${chip}` : chip);
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    addTask(parseVoiceInput(text.trim()), {
      onSuccess: () => {
        setText('');
        onSubmit();
      },
    });
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

        <div className={styles.chips}>
          {CHIPS.map(chip => (
            <button key={chip} className={styles.chip} onClick={() => appendChip(chip)}>
              {chip}
            </button>
          ))}
        </div>

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
      </main>
    </div>
  );
}

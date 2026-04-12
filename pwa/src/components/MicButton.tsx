import styles from './MicButton.module.css';

interface Props {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function MicButton({ isListening, onStart, onStop, disabled }: Props) {
  return (
    <button
      className={`${styles.mic} ${isListening ? styles.listening : ''}`}
      onClick={isListening ? onStop : onStart}
      disabled={disabled}
      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
    >
      {/* Microphone SVG icon */}
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
        <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V19H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.08A7 7 0 0 0 19 10z" />
      </svg>
    </button>
  );
}

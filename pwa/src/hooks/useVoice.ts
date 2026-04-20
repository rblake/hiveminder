import { useState, useRef } from 'react';

// Grab the prefixed or standard SpeechRecognition constructor.
// The 'webkit' prefix is required in Safari (including iOS Safari).
const SR =
  (window as Window & { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ??
  (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;

export interface VoiceState {
  transcript: string;
  setTranscript: (t: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  supported: boolean;
  error: string | null;
}

export function useVoice(): VoiceState {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    if (!SR) return;
    setError(null);

    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = false;      // auto-stops on ~1-2s of silence
    rec.interimResults = true;   // live preview on Android Chrome; final-only on iOS Safari

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      setTranscript(text);
    };

    rec.onend = () => setIsListening(false);
    (rec as unknown as { onerror: (e: { error: string }) => void }).onerror = (e) => {
      setIsListening(false);
      if (e.error === 'not-allowed') {
        setError('Microphone access was denied. Check your browser and iOS Settings → Privacy → Microphone.');
      } else {
        setError(`Microphone error: ${e.error}`);
      }
    };

    recRef.current = rec;
    setIsListening(true);
    rec.start();
  };

  const stopListening = () => {
    recRef.current?.stop();
    setIsListening(false);
  };

  return {
    transcript,
    setTranscript,
    isListening,
    startListening,
    stopListening,
    supported: !!SR,
    error,
  };
}

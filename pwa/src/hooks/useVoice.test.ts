import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoice } from './useVoice';

// Minimal SpeechRecognition mock — mimics the shape the hook depends on.
function makeMockRecognition() {
  const instance = {
    lang: '',
    continuous: false,
    interimResults: false,
    onresult: null as ((e: SpeechRecognitionEventMock) => void) | null,
    onend: null as (() => void) | null,
    onerror: null as (() => void) | null,
    start: vi.fn(),
    stop: vi.fn(),
  };
  return instance;
}

interface SpeechRecognitionEventMock {
  results: Array<[{ transcript: string }]>;
}

describe('useVoice', () => {
  let mockInstance: ReturnType<typeof makeMockRecognition>;

  beforeEach(() => {
    mockInstance = makeMockRecognition();
    const MockSpeechRecognition = vi.fn(() => mockInstance);
    vi.stubGlobal('SpeechRecognition', MockSpeechRecognition);
    vi.stubGlobal('webkitSpeechRecognition', MockSpeechRecognition);
  });

  it('reports supported=true when SpeechRecognition is available', () => {
    const { result } = renderHook(() => useVoice());
    expect(result.current.supported).toBe(true);
  });

  it('reports supported=false when SpeechRecognition is unavailable', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    const { result } = renderHook(() => useVoice());
    expect(result.current.supported).toBe(false);
  });

  it('starts in non-listening state with empty transcript', () => {
    const { result } = renderHook(() => useVoice());
    expect(result.current.isListening).toBe(false);
    expect(result.current.transcript).toBe('');
  });

  it('sets isListening=true and calls recognition.start() on startListening()', () => {
    const { result } = renderHook(() => useVoice());
    act(() => { result.current.startListening(); });
    expect(result.current.isListening).toBe(true);
    expect(mockInstance.start).toHaveBeenCalledOnce();
  });

  it('updates transcript on result event', () => {
    const { result } = renderHook(() => useVoice());
    act(() => { result.current.startListening(); });
    act(() => {
      mockInstance.onresult?.({ results: [[{ transcript: 'Buy milk' }]] });
    });
    expect(result.current.transcript).toBe('Buy milk');
  });

  it('sets isListening=false when recognition ends', () => {
    const { result } = renderHook(() => useVoice());
    act(() => { result.current.startListening(); });
    act(() => { mockInstance.onend?.(); });
    expect(result.current.isListening).toBe(false);
  });

  it('stops recognition on stopListening()', () => {
    const { result } = renderHook(() => useVoice());
    act(() => { result.current.startListening(); });
    act(() => { result.current.stopListening(); });
    expect(mockInstance.stop).toHaveBeenCalledOnce();
    expect(result.current.isListening).toBe(false);
  });

  it('allows transcript to be set manually for editing', () => {
    const { result } = renderHook(() => useVoice());
    act(() => { result.current.setTranscript('edited text'); });
    expect(result.current.transcript).toBe('edited text');
  });

  it('sets isListening=false on recognition error', () => {
    const { result } = renderHook(() => useVoice());
    act(() => { result.current.startListening(); });
    act(() => { mockInstance.onerror?.(); });
    expect(result.current.isListening).toBe(false);
  });
});

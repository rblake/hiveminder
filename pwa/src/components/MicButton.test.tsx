import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MicButton } from './MicButton';

describe('MicButton', () => {
  it('renders a button', () => {
    render(<MicButton isListening={false} onStart={vi.fn()} onStop={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onStart when clicked while not listening', () => {
    const onStart = vi.fn();
    render(<MicButton isListening={false} onStart={onStart} onStop={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('calls onStop when clicked while listening', () => {
    const onStop = vi.fn();
    render(<MicButton isListening={true} onStart={vi.fn()} onStop={onStop} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onStop).toHaveBeenCalledOnce();
  });

  it('has aria-label describing current state', () => {
    const { rerender } = render(
      <MicButton isListening={false} onStart={vi.fn()} onStop={vi.fn()} />
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Start voice input');

    rerender(<MicButton isListening={true} onStart={vi.fn()} onStop={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Stop voice input');
  });

  it('applies the listening class when isListening=true', () => {
    render(<MicButton isListening={true} onStart={vi.fn()} onStop={vi.fn()} />);
    expect(screen.getByRole('button').className).toMatch(/listening/);
  });

  it('does not apply listening class when isListening=false', () => {
    render(<MicButton isListening={false} onStart={vi.fn()} onStop={vi.fn()} />);
    expect(screen.getByRole('button').className).not.toMatch(/listening/);
  });
});

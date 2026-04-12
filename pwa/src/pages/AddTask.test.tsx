import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddTask } from './AddTask';
import { FIXTURES } from '@/test/fixtures';
import type { ReactNode } from 'react';

const TOKEN = FIXTURES.token;

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// Stub SpeechRecognition for all tests in this file
beforeEach(() => {
  const MockSR = vi.fn(() => ({
    lang: '', continuous: false, interimResults: false,
    onresult: null, onend: null, onerror: null,
    start: vi.fn(), stop: vi.fn(),
  }));
  vi.stubGlobal('SpeechRecognition', MockSR);
  vi.stubGlobal('webkitSpeechRecognition', MockSR);
});

describe('AddTask', () => {
  it('renders a text input and submit button', () => {
    render(<AddTask token={TOKEN} onSubmit={vi.fn()} onCancel={vi.fn()} />, { wrapper });
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
  });

  it('renders the mic button', () => {
    render(<AddTask token={TOKEN} onSubmit={vi.fn()} onCancel={vi.fn()} />, { wrapper });
    expect(screen.getByRole('button', { name: /voice/i })).toBeInTheDocument();
  });

  it('submit button is disabled when the text field is empty', () => {
    render(<AddTask token={TOKEN} onSubmit={vi.fn()} onCancel={vi.fn()} />, { wrapper });
    expect(screen.getByRole('button', { name: /add task/i })).toBeDisabled();
  });

  it('calls onSubmit and clears the field after a successful submit', async () => {
    const onSubmit = vi.fn();
    render(<AddTask token={TOKEN} onSubmit={onSubmit} onCancel={vi.fn()} />, { wrapper });

    await userEvent.type(screen.getByRole('textbox'), 'Buy coffee');
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('renders quick-insert chips for common due dates', () => {
    render(<AddTask token={TOKEN} onSubmit={vi.fn()} onCancel={vi.fn()} />, { wrapper });
    expect(screen.getByText('[due: today]')).toBeInTheDocument();
    expect(screen.getByText('[due: tomorrow]')).toBeInTheDocument();
  });

  it('appends chip text to the input when a chip is clicked', async () => {
    render(<AddTask token={TOKEN} onSubmit={vi.fn()} onCancel={vi.fn()} />, { wrapper });
    await userEvent.type(screen.getByRole('textbox'), 'Buy milk');
    fireEvent.click(screen.getByText('[due: today]'));
    expect(screen.getByRole('textbox')).toHaveValue('Buy milk [due: today]');
  });

  it('calls onCancel when the cancel button is pressed', () => {
    const onCancel = vi.fn();
    render(<AddTask token={TOKEN} onSubmit={onCancel} onCancel={onCancel} />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});

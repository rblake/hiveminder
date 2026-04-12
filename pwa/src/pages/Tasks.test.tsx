import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Tasks } from './Tasks';
import { FIXTURES } from '@/test/fixtures';
import type { ReactNode } from 'react';

const TOKEN = FIXTURES.token;

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('Tasks', () => {
  it('renders the task list after loading', async () => {
    render(<Tasks token={TOKEN} onAddTask={vi.fn()} />, { wrapper });
    await waitFor(() => expect(screen.getByText('Buy milk')).toBeInTheDocument());
    expect(screen.getByText('Write report')).toBeInTheDocument();
  });

  it('shows a loading state before data arrives', () => {
    render(<Tasks token={TOKEN} onAddTask={vi.fn()} />, { wrapper });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('has To Do and Later tabs', async () => {
    render(<Tasks token={TOKEN} onAddTask={vi.fn()} />, { wrapper });
    expect(screen.getByRole('button', { name: /to do/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /later/i })).toBeInTheDocument();
  });

  it('calls onAddTask when the add button is pressed', async () => {
    const onAddTask = vi.fn();
    render(<Tasks token={TOKEN} onAddTask={onAddTask} />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));
    expect(onAddTask).toHaveBeenCalledOnce();
  });
});

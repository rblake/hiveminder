import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskRow } from './TaskRow';
import { FIXTURES } from '@/test/fixtures';

const task = FIXTURES.tasks[0]; // Buy milk, due 2026-04-15, priority 3 (Low)
const highTask = FIXTURES.tasks[1]; // Write report, priority 5 (High)

describe('TaskRow', () => {
  it('renders the task summary', () => {
    render(<TaskRow task={task} onComplete={vi.fn()} />);
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('renders the due date', () => {
    render(<TaskRow task={task} onComplete={vi.fn()} />);
    expect(screen.getByText(/Apr 15/)).toBeInTheDocument();
  });

  it('does not render a due date when task.due is null', () => {
    const nodue = { ...task, due: null };
    render(<TaskRow task={nodue} onComplete={vi.fn()} />);
    expect(screen.queryByTestId('due-chip')).not.toBeInTheDocument();
  });

  it('calls onComplete with the task id when the checkbox is clicked', () => {
    const onComplete = vi.fn();
    render(<TaskRow task={task} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onComplete).toHaveBeenCalledWith(task.id);
  });

  it('shows the description when the row is tapped', () => {
    const withDesc = { ...task, description: 'Get 2% milk' };
    render(<TaskRow task={withDesc} onComplete={vi.fn()} />);
    expect(screen.queryByText('Get 2% milk')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Buy milk'));
    expect(screen.getByText('Get 2% milk')).toBeInTheDocument();
  });

  it('does not render a description toggle if description is empty', () => {
    render(<TaskRow task={task} onComplete={vi.fn()} />);
    // Clicking summary should not crash and description area should not appear
    fireEvent.click(screen.getByText('Buy milk'));
    expect(screen.queryByTestId('task-description')).not.toBeInTheDocument();
  });

  it('applies a priority indicator for high-priority tasks', () => {
    render(<TaskRow task={highTask} onComplete={vi.fn()} />);
    expect(screen.getByTestId('priority-dot')).toBeInTheDocument();
  });

  it('does not render priority dot for no-priority tasks', () => {
    const noPriority = { ...task, priority: 1 };
    render(<TaskRow task={noPriority} onComplete={vi.fn()} />);
    expect(screen.queryByTestId('priority-dot')).not.toBeInTheDocument();
  });
});

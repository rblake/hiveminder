import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw-server';
import { Login } from './Login';
import { FIXTURES } from '@/test/fixtures';

describe('Login', () => {
  it('renders email, password fields and a connect button', () => {
    render(<Login onLogin={vi.fn()} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
  });

  it('calls onLogin with AuthState after successful login', async () => {
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    await userEvent.type(screen.getByLabelText(/email/i), FIXTURES.user.username);
    await userEvent.type(screen.getByLabelText(/password/i), 'password');
    fireEvent.click(screen.getByRole('button', { name: /connect/i }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledOnce());
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({ token: FIXTURES.token })
    );
  });

  it('shows an error message if the login fails', async () => {
    server.use(
      http.post('https://tasks.rblake.net/=/BTDT.Action.Login', () =>
        new HttpResponse(null, { status: 401 })
      )
    );

    render(<Login onLogin={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    fireEvent.click(screen.getByRole('button', { name: /connect/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument()
    );
  });

  it('disables the button while logging in', async () => {
    render(<Login onLogin={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/email/i), FIXTURES.user.username);
    await userEvent.type(screen.getByLabelText(/password/i), 'password');

    const btn = screen.getByRole('button', { name: /connect/i });
    fireEvent.click(btn);
    expect(btn).toBeDisabled();
  });
});

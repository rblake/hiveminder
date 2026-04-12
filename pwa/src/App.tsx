import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { checkToken } from '@/api/auth';
import { Login } from '@/pages/Login';
import { Tasks } from '@/pages/Tasks';
import { AddTask } from '@/pages/AddTask';
import type { AuthState } from '@/types';

const AUTH_KEY = 'hiveminder_auth';
const queryClient = new QueryClient();

type View = 'loading' | 'login' | 'tasks' | 'add';

export function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [view, setView] = useState<View>('loading');

  // On mount: check if we have a stored token and validate it.
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) { setView('login'); return; }

    const { token } = JSON.parse(stored) as AuthState;
    checkToken(token).then(result => {
      if (result) {
        setAuth(result);
        setView('tasks');
      } else {
        localStorage.removeItem(AUTH_KEY);
        setView('login');
      }
    });
  }, []);

  const handleLogin = (a: AuthState) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(a));
    setAuth(a);
    setView('tasks');
  };

  if (view === 'loading') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>…</div>;
  }

  if (view === 'login' || !auth) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {view === 'tasks' && (
        <Tasks
          token={auth.token}
          onAddTask={() => setView('add')}
        />
      )}
      {view === 'add' && (
        <AddTask
          token={auth.token}
          onSubmit={() => setView('tasks')}
          onCancel={() => setView('tasks')}
        />
      )}
    </QueryClientProvider>
  );
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/api';
import { clearToken, restoreToken, setToken } from '@/session';
import type { User, UserRole } from '@/types';

interface Session {
  user: User | null;
  /** Пока не восстановили токен, экраны не должны мигать формой входа. */
  ready: boolean;
  signIn: (channel: 'phone' | 'email', identity: string, code: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await restoreToken();
      if (saved) {
        // Токен мог протухнуть за 30 дней: проверяем его у API, а не верим.
        const me = await api.me().catch(() => null);
        if (me) setUser(me);
        else await clearToken();
      }
      setReady(true);
    })();
  }, []);

  const signIn = useCallback(
    async (channel: 'phone' | 'email', identity: string, code: string, role: UserRole) => {
      const { token, user: signed } = await api.verifyCode(channel, identity, code, role);
      await setToken(token);
      setUser(signed);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  const value = useMemo<Session>(() => ({ user, ready, signIn, signOut }), [user, ready, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSession вызван вне SessionProvider');
  return ctx;
}

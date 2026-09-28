'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LoginModal } from '@/components/layout/LoginModal';
import type { Dictionary } from '@/i18n/getDictionary';

const FAVORITES_KEY = 'casaya:favorites';

interface AppState {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  favoritesCount: number;
  loginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProviders({ dict, children }: { dict: Dictionary; children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loginOpen, setLoginOpen] = useState(false);

  // Избранное анонимного посетителя живёт в браузере; после входа
  // оно переносится в аккаунт через POST /favorites/merge.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {
      /* приватный режим — просто работаем без сохранения */
    }
  }, []);

  const persist = useCallback((next: string[]) => {
    setFavorites(next);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {
      /* игнорируем недоступное хранилище */
    }
  }, []);

  const toggleFavorite = useCallback(
    (id: string) =>
      setFavorites((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        try {
          localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
        } catch {
          /* игнорируем недоступное хранилище */
        }
        return next;
      }),
    [],
  );

  const value = useMemo<AppState>(
    () => ({
      favorites,
      isFavorite: (id) => favorites.includes(id),
      toggleFavorite,
      favoritesCount: favorites.length,
      loginOpen,
      openLogin: () => setLoginOpen(true),
      closeLogin: () => setLoginOpen(false),
    }),
    [favorites, loginOpen, toggleFavorite],
  );

  void persist;

  return (
    <AppContext.Provider value={value}>
      {children}
      {loginOpen && <LoginModal dict={dict} onClose={() => setLoginOpen(false)} />}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp вызван вне AppProviders');
  return ctx;
}

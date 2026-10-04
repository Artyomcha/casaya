import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { api } from '@/api';
import { DEFAULT_FILTERS, type Filters, type Listing, type Mode } from '@/types';

const FAVORITES_KEY = 'casaya:favorites';
const DEAL_KEY = 'casaya:dealStep';

export interface Message {
  id: string;
  mine: boolean;
  text: string;
}

interface AppState {
  listings: Listing[];
  loading: boolean;
  error: string | null;
  reload: () => void;

  mode: Mode;
  setMode: (m: Mode) => void;
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  /** Объекты после фильтров — ими питаются и выдача, и карта. */
  filtered: Listing[];

  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;

  /** Сколько шагов сделки отмечено выполненными. */
  dealStep: number;
  setDealStep: (n: number) => void;

  messages: Message[];
  sendMessage: (text: string) => void;

  plus: boolean;
  togglePlus: () => void;
  notifications: boolean;
  toggleNotifications: () => void;
  language: number;
  cycleLanguage: () => void;
}

const Ctx = createContext<AppState | null>(null);



export function AppProvider({ children }: { children: React.ReactNode }) {
  const { dict } = useI18n();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>('buy');
  const [filters, setFiltersState] = useState<Filters>(DEFAULT_FILTERS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [dealStep, setDealStepState] = useState(3);
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: 'm1', mine: false, text: dict.chat.greeting1 },
    { id: 'm2', mine: false, text: dict.chat.greeting2 },
  ]);
  const [plus, setPlus] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await api.listings();
      setListings(items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Избранное и прогресс сделки переживают перезапуск приложения.
  useEffect(() => {
    void (async () => {
      try {
        const [favs, step] = await AsyncStorage.multiGet([FAVORITES_KEY, DEAL_KEY]);
        if (favs[1]) setFavorites(JSON.parse(favs[1]));
        if (step[1]) setDealStepState(Number(step[1]));
      } catch {
        /* хранилище недоступно — работаем без сохранения */
      }
    })();
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      void AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const setDealStep = useCallback((n: number) => {
    setDealStepState(n);
    void AsyncStorage.setItem(DEAL_KEY, String(n)).catch(() => undefined);
  }, []);

  const setFilters = useCallback(
    (patch: Partial<Filters>) => setFiltersState((f) => ({ ...f, ...patch })),
    [],
  );

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { id: `m${Date.now()}`, mine: true, text: trimmed }]);
    // Ответ агента имитируется: настоящий чат появится вместе с сокетами на бэкенде.
    setTimeout(
      () =>
        setMessages((prev) => [
          ...prev,
          {
            id: `m${Date.now()}`,
            mine: false,
            text: dict.chat.reply,
          },
        ]),
      1200,
    );
  }, [dict]);

  const filtered = useMemo(
    () =>
      listings.filter(
        (l) =>
          (filters.kind === 'all' || l.kind === filters.kind) &&
          l.price <= filters.maxPrice &&
          l.bedrooms >= filters.bedrooms,
      ),
    [listings, filters],
  );

  const value = useMemo<AppState>(
    () => ({
      listings,
      loading,
      error,
      reload: load,
      mode,
      setMode,
      filters,
      setFilters,
      resetFilters: () => setFiltersState(DEFAULT_FILTERS),
      filtered,
      favorites,
      isFavorite: (id) => favorites.includes(id),
      toggleFavorite,
      dealStep,
      setDealStep,
      messages,
      sendMessage,
      plus,
      togglePlus: () => setPlus((v) => !v),
      notifications,
      toggleNotifications: () => setNotifications((v) => !v),
      language,
      cycleLanguage: () => setLanguage((v) => (v + 1) % 4),
    }),
    [
      listings, loading, error, load, mode, filters, setFilters, filtered,
      favorites, toggleFavorite, dealStep, setDealStep, messages, sendMessage,
      plus, notifications, language,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp вызван вне AppProvider');
  return ctx;
}

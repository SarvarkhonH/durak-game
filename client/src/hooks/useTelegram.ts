import { useEffect, useState } from 'react';

interface TgUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: { user?: TgUser };
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  MainButton: {
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    isVisible: boolean;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export function useTelegram() {
  const tg = window.Telegram?.WebApp;
  const [user, setUser] = useState<TgUser | null>(null);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      const u = tg.initDataUnsafe?.user;
      if (u) setUser(u);
    } else {
      // Dev fallback
      setUser({ id: 12345, first_name: 'Dev', username: 'dev_user' });
    }
  }, []);

  const haptic = {
    impact: (style: 'light' | 'medium' | 'heavy' = 'medium') =>
      tg?.HapticFeedback.impactOccurred(style),
    success: () => tg?.HapticFeedback.notificationOccurred('success'),
    error: () => tg?.HapticFeedback.notificationOccurred('error'),
  };

  return { tg, user, haptic };
}

import { useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';
const KEY = 'studia-theme';

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    try {
      localStorage.setItem(KEY, mode);
    } catch {}
  }, [mode]);
  return { mode, toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')) };
}

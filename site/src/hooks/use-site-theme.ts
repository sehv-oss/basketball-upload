import * as React from 'react';

export type SiteTheme = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'basketball-upload:site-theme';

const listeners = new Set<() => void>();
let current: SiteTheme | undefined;

function stored(): SiteTheme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SiteTheme {
  current ??= stored();
  return current;
}

function getServerSnapshot(): SiteTheme {
  return 'system';
}

function setSiteTheme(theme: SiteTheme): void {
  current = theme;

  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private mode: the choice lasts for this visit.
  }

  for (const listener of listeners) listener();
}

export function useSiteTheme(): [SiteTheme, (theme: SiteTheme) => void] {
  const theme = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  return [theme, setSiteTheme];
}

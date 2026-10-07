import * as React from 'react';

export type SiteTheme = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'basketball-upload:site-theme';

function stored(): SiteTheme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

export function useSiteTheme(): [SiteTheme, (theme: SiteTheme) => void] {
  const [theme, setTheme] = React.useState<SiteTheme>(stored);

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private mode: the choice lasts for this visit.
    }
  }, [theme]);

  return [theme, setTheme];
}

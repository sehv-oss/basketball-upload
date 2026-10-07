import type * as React from 'react';

import type { SiteTheme } from '../hooks/use-site-theme.ts';

const SECTIONS = [
  { id: 'web-component', label: 'Web Component' },
  { id: 'react', label: 'React' },
  { id: 'theming', label: 'Theming' },
  { id: 'file-types', label: 'File types' },
  { id: 'forms', label: 'Forms' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'credits', label: 'Credits' },
] as const;

const THEMES: { value: SiteTheme; label: string; icon: React.ReactElement }[] =
  [
    {
      value: 'system',
      label: 'System theme',
      icon: (
        <>
          <rect x="3.5" y="4.5" width="17" height="12" rx="2" />
          <path d="M8.5 20h7M12 16.5V20" />
        </>
      ),
    },
    {
      value: 'light',
      label: 'Light theme',
      icon: (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
        </>
      ),
    },
    {
      value: 'dark',
      label: 'Dark theme',
      icon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
    },
  ];

interface SiteHeaderProps {
  theme: SiteTheme;
  onThemeChange: (theme: SiteTheme) => void;
}

export function SiteHeader({
  theme,
  onThemeChange,
}: SiteHeaderProps): React.ReactElement {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <a className="brand" href="#top">
          <span className="brand-scope">@sehv-oss</span>
          <span className="brand-slash">/</span>
          <span>basketball-upload</span>
        </a>

        <nav className="site-nav" aria-label="Sections">
          {SECTIONS.map(({ id, label }) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>

        <div className="site-header-actions">
          <div
            className="segmented segmented-icons"
            role="group"
            aria-label="Theme"
          >
            {THEMES.map(({ value, label, icon }) => {
              const handleOnClick = (): void => onThemeChange(value);

              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={theme === value}
                  aria-label={label}
                  title={label}
                  onClick={handleOnClick}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {icon}
                  </svg>
                </button>
              );
            })}
          </div>
          <a
            className="icon-button"
            href="https://github.com/sehv-oss/basketball-upload"
            aria-label="GitHub repository"
            title="GitHub repository"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="filled">
              <path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.5.1.7-.2.7-.5v-1.7c-2.7.6-3.2-1.2-3.2-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.1-.2-4.4-1.1-4.4-4.7 0-1 .4-1.9 1-2.6-.1-.3-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.2.1 2.5.6.7 1 1.6 1 2.6 0 3.7-2.3 4.5-4.4 4.7.3.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}

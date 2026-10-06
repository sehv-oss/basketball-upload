import { useState, type ReactElement } from 'react';

import { CopyButton } from './copy-button.tsx';

const MANAGERS = ['npm', 'pnpm', 'yarn'] as const;
type Manager = (typeof MANAGERS)[number];

const PACKAGES = [
  { name: '@sehv-oss/dnd-basketball', description: 'Web Component' },
  { name: '@sehv-oss/dnd-basketball-react', description: 'React' },
] as const;

function command(manager: Manager, name: string): string {
  return manager === 'npm' ? `npm install ${name}` : `${manager} add ${name}`;
}

export function InstallTabs(): ReactElement {
  const [manager, setManager] = useState<Manager>('npm');

  return (
    <div className="install">
      <h2 className="install-title">Installation</h2>
      <div className="segmented" role="group" aria-label="Package manager">
        {MANAGERS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === manager}
            onClick={() => setManager(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <ul className="install-commands">
        {PACKAGES.map(({ name, description }) => (
          <li key={name}>
            <span className="install-label">{description}</span>
            <code>{command(manager, name)}</code>
            <CopyButton
              text={command(manager, name)}
              label={`Copy the ${description} install command`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

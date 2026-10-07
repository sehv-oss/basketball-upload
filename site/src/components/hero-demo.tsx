import * as React from 'react';

import {
  BasketballUpload,
  type BasketballUploadElement,
  type Messages,
  type Theme,
} from '@sehv-oss/basketball-upload-react';

import { portugueseMessages, spanishMessages } from '../demo/messages.ts';
import { designFile } from '../demo/sample-files.ts';
import { createSimulatedUploader } from '../demo/simulated-uploader.ts';
import { Segmented } from './segmented.tsx';

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

const LANGUAGES = [
  { value: 'en', label: 'EN' },
  { value: 'pt-BR', label: 'PT-BR' },
  { value: 'es', label: 'ES' },
] as const;

type Language = (typeof LANGUAGES)[number]['value'];

const MESSAGES: Record<Language, Partial<Messages> | undefined> = {
  en: undefined,
  'pt-BR': portugueseMessages,
  es: spanishMessages,
};

export function HeroDemo(): React.ReactElement {
  const element = React.useRef<BasketballUploadElement>(null);
  const [theme, setTheme] = React.useState<Theme>('light');
  const [language, setLanguage] = React.useState<Language>('en');
  const [instant, setInstant] = React.useState(false);
  const [failing, setFailing] = React.useState(false);

  const failingRef = React.useRef(failing);
  React.useEffect(() => {
    failingRef.current = failing;
  }, [failing]);

  const uploader = React.useMemo(
    () => createSimulatedUploader({ shouldFail: () => failingRef.current }),
    []
  );

  const reset = React.useCallback(() => {
    const hoop = element.current;
    if (!hoop) return;
    hoop.clear();
    hoop.stage([designFile()]);
  }, []);

  React.useEffect(reset, [reset]);

  return (
    <div className="demo">
      <div className="demo-stage" lang={language}>
        <BasketballUpload
          ref={element}
          className="demo-hoop"
          multiple
          theme={theme}
          instant={instant}
          uploader={uploader}
          messages={MESSAGES[language]}
        />
      </div>

      <div className="demo-controls">
        <Segmented
          label="Element theme"
          value={theme}
          options={THEMES}
          onChange={setTheme}
        />
        <Segmented
          label="Language"
          value={language}
          options={LANGUAGES}
          onChange={setLanguage}
        />
        <label className="check">
          <input
            type="checkbox"
            checked={instant}
            onChange={(event) => setInstant(event.target.checked)}
          />
          Instant
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={failing}
            onChange={(event) => setFailing(event.target.checked)}
          />
          Failing uploads
        </label>
        <button type="button" className="button" onClick={reset}>
          Reset
        </button>
      </div>

      <p className="demo-hint">
        Grab the file, pull it back like a slingshot and let go: the dots show
        exactly where it goes. Or drop files from your computer on the
        backboard. No mouse?{' '}
        <a href="#accessibility">Shoot from the keyboard</a>. Nothing leaves
        your browser: uploads are simulated.
      </p>
    </div>
  );
}

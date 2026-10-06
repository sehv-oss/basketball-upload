import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';

import {
  DndBasketball,
  type DndBasketballElement,
  type Theme,
} from '@sehv-oss/dnd-basketball-react';

import { portugueseMessages } from '../demo/messages.ts';
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
] as const;

/** The reference design, live: one file on the court, ready for the shot. */
export function HeroDemo(): ReactElement {
  const element = useRef<DndBasketballElement>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<'en' | 'pt-BR'>('en');
  const [instant, setInstant] = useState(false);
  const [failing, setFailing] = useState(false);

  const failingRef = useRef(failing);
  useEffect(() => {
    failingRef.current = failing;
  }, [failing]);

  const uploader = useMemo(
    () => createSimulatedUploader({ shouldFail: () => failingRef.current }),
    []
  );

  const reset = useCallback(() => {
    const hoop = element.current;
    if (!hoop) return;
    hoop.clear();
    hoop.stage([designFile()]);
  }, []);

  useEffect(reset, [reset]);

  return (
    <div className="demo">
      <div className="demo-stage" lang={language}>
        <DndBasketball
          ref={element}
          className="demo-hoop"
          multiple
          theme={theme}
          instant={instant}
          uploader={uploader}
          messages={language === 'pt-BR' ? portugueseMessages : undefined}
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
        backboard. Nothing leaves your browser: uploads are simulated.
      </p>
    </div>
  );
}

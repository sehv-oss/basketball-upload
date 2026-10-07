import * as React from 'react';

import {
  BasketballUpload,
  type BasketballUploadElement,
} from '@sehv-oss/basketball-upload-react';

import { sampleFiles } from '../../demo/sample-files.ts';
import { createSimulatedUploader } from '../../demo/simulated-uploader.ts';
import type { SiteTheme } from '../../hooks/use-site-theme.ts';
import { Section } from '../section.tsx';

const KEYS: { keys: React.ReactNode; action: React.ReactNode }[] = [
  {
    keys: <kbd>Tab</kbd>,
    action: 'Moves to the dropzone, the retry buttons and the file on top.',
  },
  {
    keys: (
      <>
        <kbd>Enter</kbd> <kbd>Space</kbd>
      </>
    ),
    action: 'On the dropzone: opens the file dialog.',
  },
  {
    keys: (
      <>
        Hold <kbd>Enter</kbd> <kbd>Space</kbd>
      </>
    ),
    action:
      'On a file: picks it up, aimed at a perfect shot. The dots show where it goes.',
  },
  {
    keys: (
      <>
        <kbd>←</kbd> <kbd>→</kbd>
      </>
    ),
    action: 'While holding: turns the shot.',
  },
  {
    keys: (
      <>
        <kbd>↑</kbd> <kbd>↓</kbd>
      </>
    ),
    action:
      'While holding: makes it stronger or weaker. Too far off, it misses.',
  },
  {
    keys: 'Release',
    action:
      'Shoots. A quick press is a perfect shot, and focus moves to the next file.',
  },
  {
    keys: <kbd>Esc</kbd>,
    action:
      'Drops the aim: the file goes back to the court. Moving focus away does too.',
  },
];

export function AccessibilityExample({
  theme,
}: {
  theme: SiteTheme;
}): React.ReactElement {
  const element = React.useRef<BasketballUploadElement>(null);
  const uploader = React.useMemo(
    () => createSimulatedUploader({ duration: 2500 }),
    []
  );

  const reset = React.useCallback(() => {
    let active = true;
    void sampleFiles().then((files) => {
      if (!active) return;
      element.current?.clear();
      element.current?.stage(files);
    });
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(reset, [reset]);

  const handleOnClick = (): void => {
    reset();
  };

  return (
    <Section
      id="accessibility"
      badge="Accessibility"
      title="Take the shot from the keyboard"
      description={
        <>
          Every shot works without a mouse. The file on the court is a button:
          hold <kbd>Enter</kbd> or <kbd>Space</kbd> to pick it up, steer with
          the arrows, and let go to shoot.
        </>
      }
    >
      <div className="example">
        <div className="example-code">
          <div className="keys">
            <table>
              <thead>
                <tr>
                  <th scope="col">Keys</th>
                  <th scope="col">What they do</th>
                </tr>
              </thead>
              <tbody>
                {KEYS.map(({ keys, action }, index) => (
                  <tr key={index}>
                    <th scope="row">{keys}</th>
                    <td>{action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="accessibility-notes">
            <li>
              <strong>Real buttons.</strong> The dropzone and the file on top
              are buttons with accessible names, like "Choose files to upload"
              and "Shoot final_final_v7.pdf".
            </li>
            <li>
              <strong>Announced.</strong> Scores, misses, rejected files and
              finished or failed uploads are read out from a polite live region.
            </li>
            <li>
              <strong>Progress.</strong> Each upload is a{' '}
              <code>progressbar</code> with its value, and each retry button
              names its file.
            </li>
            <li>
              <strong>Reduced motion.</strong> With{' '}
              <code>prefers-reduced-motion: reduce</code>, shots go in without
              flying and nothing swings.
            </li>
            <li>
              <strong>Translatable.</strong> Every label and announcement comes
              from <code>messages</code>: the demo at the top speaks Portuguese
              and Spanish too.
            </li>
          </ul>
        </div>
        <div className="example-live">
          <div className="button-row">
            <button type="button" className="button" onClick={handleOnClick}>
              Reset
            </button>
          </div>
          <div className="example-stage">
            <BasketballUpload
              ref={element}
              multiple
              theme={theme}
              uploader={uploader}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

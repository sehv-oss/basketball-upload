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
} from '@sehv-oss/dnd-basketball-react';

import { designFile } from '../../demo/sample-files.ts';
import { createSimulatedUploader } from '../../demo/simulated-uploader.ts';
import type { SiteTheme } from '../../hooks/use-site-theme.ts';
import { CodeBlock } from '../code-block.tsx';
import { Section } from '../section.tsx';

const CODE = `
import {
  DndBasketball,
  createXhrUploader,
} from '@sehv-oss/dnd-basketball-react';

// Stable across renders: module scope, useMemo or useCallback.
const uploader = createXhrUploader({ url: '/api/uploads' });

export function Uploads() {
  return (
    <DndBasketball
      multiple
      accept="image/*,.pdf"
      uploader={uploader}
      onShot={({ file, result }) => console.log(file.name, result)}
      onUploadSuccess={({ item }) => console.log('stored', item.response)}
    >
      <span slot="title">Upload files</span>
    </DndBasketball>
  );
}
`;

interface LogEntry {
  id: number;
  type: string;
  text: string;
}

export function ReactExample({ theme }: { theme: SiteTheme }): ReactElement {
  const element = useRef<DndBasketballElement>(null);
  const uploader = useMemo(
    () => createSimulatedUploader({ duration: 2500 }),
    []
  );
  const [log, setLog] = useState<LogEntry[]>([]);
  const next = useRef(0);

  const write = useCallback((type: string, text: string) => {
    next.current += 1;
    const entry = { id: next.current, type, text };
    setLog((entries) => [entry, ...entries].slice(0, 6));
  }, []);

  useEffect(() => {
    element.current?.clear();
    element.current?.stage([designFile()]);
  }, []);

  return (
    <Section
      id="react"
      badge="React"
      title="A thin React 19 component"
      description={
        <>
          <code>&lt;DndBasketball&gt;</code> renders the element: values become
          attributes (rendered on the server too), objects become properties and
          callbacks receive each event&apos;s <code>detail</code>. The ref is
          the element itself.
        </>
      }
    >
      <div className="example">
        <CodeBlock code={CODE} lang="tsx" filename="uploads.tsx" />
        <div className="example-live">
          <div className="example-stage">
            <DndBasketball
              ref={element}
              multiple
              theme={theme}
              uploader={uploader}
              onShot={({ file, result }) =>
                write('shot', `${file.name}: ${result}`)
              }
              onUploadStart={({ item }) =>
                write('upload-start', item.file.name)
              }
              onUploadSuccess={({ item }) =>
                write('upload-success', item.file.name)
              }
              onFileReject={({ file, reason }) =>
                write('file-reject', `${file.name}: ${reason}`)
              }
            />
          </div>
          <ol className="event-log" aria-label="Events" aria-live="polite">
            {log.length === 0 ? (
              <li className="event-log-empty">Events show up here.</li>
            ) : (
              log.map((entry) => (
                <li key={entry.id}>
                  <code>{entry.type}</code> {entry.text}
                </li>
              ))
            )}
          </ol>
        </div>
      </div>
    </Section>
  );
}

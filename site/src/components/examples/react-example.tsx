import * as React from 'react';

import {
  BasketballUpload,
  type BasketballUploadElement,
  type BasketballUploadProps,
} from '@sehv-oss/basketball-upload-react';

import { designFile } from '../../demo/sample-files.ts';
import { createSimulatedUploader } from '../../demo/simulated-uploader.ts';
import type { SiteTheme } from '../../hooks/use-site-theme.ts';
import { CodeBlock } from '../code-block.tsx';
import { Section } from '../section.tsx';

const CODE = `
import {
  BasketballUpload,
  createXhrUploader,
  type BasketballUploadProps,
} from '@sehv-oss/basketball-upload-react';

// Stable across renders: module scope, useMemo or useCallback.
const uploader = createXhrUploader({ url: '/api/uploads' });

export function Uploads() {
  const handleOnShot: BasketballUploadProps['onShot'] = ({ file, result }) =>
    console.log(file.name, result);
  const handleOnUploadSuccess: BasketballUploadProps['onUploadSuccess'] = ({
    item,
  }) => console.log('stored', item.response);

  return (
    <BasketballUpload
      multiple
      accept="image/*,.pdf"
      uploader={uploader}
      onShot={handleOnShot}
      onUploadSuccess={handleOnUploadSuccess}
    >
      <span slot="title">Upload files</span>
    </BasketballUpload>
  );
}
`;

interface LogEntry {
  id: number;
  type: string;
  text: string;
}

export function ReactExample({
  theme,
}: {
  theme: SiteTheme;
}): React.ReactElement {
  const element = React.useRef<BasketballUploadElement>(null);
  const uploader = React.useMemo(
    () => createSimulatedUploader({ duration: 2500 }),
    []
  );
  const [log, setLog] = React.useState<LogEntry[]>([]);
  const next = React.useRef(0);

  const write = React.useCallback((type: string, text: string) => {
    next.current += 1;
    const entry = { id: next.current, type, text };
    setLog((entries) => [entry, ...entries].slice(0, 6));
  }, []);

  React.useEffect(() => {
    element.current?.clear();
    element.current?.stage([designFile()]);
  }, []);

  const handleOnShot: BasketballUploadProps['onShot'] = ({ file, result }) =>
    write('shot', `${file.name}: ${result}`);
  const handleOnUploadStart: BasketballUploadProps['onUploadStart'] = ({
    item,
  }) => write('upload-start', item.file.name);
  const handleOnUploadSuccess: BasketballUploadProps['onUploadSuccess'] = ({
    item,
  }) => write('upload-success', item.file.name);
  const handleOnFileReject: BasketballUploadProps['onFileReject'] = ({
    file,
    reason,
  }) => write('file-reject', `${file.name}: ${reason}`);

  return (
    <Section
      id="react"
      badge="React"
      title="A thin React 19 component"
      description={
        <>
          <code>&lt;BasketballUpload&gt;</code> renders the element: values
          become attributes (rendered on the server too), objects become
          properties and callbacks receive each event&apos;s <code>detail</code>
          . The ref is the element itself.
        </>
      }
    >
      <div className="example">
        <CodeBlock code={CODE} language="tsx" filename="uploads.tsx" />
        <div className="example-live">
          <div className="example-stage">
            <BasketballUpload
              ref={element}
              multiple
              theme={theme}
              uploader={uploader}
              onShot={handleOnShot}
              onUploadStart={handleOnUploadStart}
              onUploadSuccess={handleOnUploadSuccess}
              onFileReject={handleOnFileReject}
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

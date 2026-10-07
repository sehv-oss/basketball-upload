import type * as React from 'react';

import { CodeBlock } from '../code-block.tsx';
import { Section } from '../section.tsx';

const XHR = `
import { createXhrUploader } from '@sehv-oss/basketball-upload';

// multipart/form-data, with upload progress.
hoop.uploader = createXhrUploader({
  url: '/api/uploads',
  fieldName: 'file',
  headers: { Authorization: \`Bearer \${token}\` },
});
`;

const CUSTOM = `
import type { Uploader } from '@sehv-oss/basketball-upload';

// Any function works: resolve when stored, reject when it failed.
const toS3: Uploader = async (file, { signal, onProgress }) => {
  const { url } = await fetch('/api/presign', {
    method: 'POST',
    body: JSON.stringify({ name: file.name }),
    signal,
  }).then((response) => response.json());

  await fetch(url, { method: 'PUT', body: file, signal });
  onProgress(file.size);
  return url;
};

hoop.uploader = toS3;
`;

export function UploadsExample(): React.ReactElement {
  return (
    <Section
      id="uploads"
      badge="Uploads"
      title="Bring your own transport"
      description={
        <>
          Scored files are uploaded by your <code>uploader</code>, three at a
          time by default (<code>concurrency</code>). It gets an{' '}
          <code>AbortSignal</code>, aborted when a file is removed, and an{' '}
          <code>onProgress</code> callback for the bar. Failed uploads offer a
          retry.
        </>
      }
    >
      <div className="example">
        <CodeBlock code={XHR} language="typescript" filename="xhr.ts" />
        <CodeBlock
          code={CUSTOM}
          language="typescript"
          filename="presigned.ts"
        />
      </div>
    </Section>
  );
}

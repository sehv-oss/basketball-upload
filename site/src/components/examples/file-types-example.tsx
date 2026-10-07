import { useMemo, useRef, type ReactElement } from 'react';

import {
  BasketballUpload,
  type BasketballUploadElement,
  type FileType,
} from '@sehv-oss/basketball-upload-react';

import { figmaFile, sampleFiles } from '../../demo/sample-files.ts';
import { createSimulatedUploader } from '../../demo/simulated-uploader.ts';
import type { SiteTheme } from '../../hooks/use-site-theme.ts';
import { CodeBlock } from '../code-block.tsx';
import { Section } from '../section.tsx';

const CODE = `
import { registerFileType } from '@sehv-oss/basketball-upload';

// For every <basketball-upload> on the page. Returns an unregister function.
registerFileType({
  kind: 'figma',                 // → ::part(file-figma), --basketball-upload-file-figma
  match: '.fig',                 // accept syntax, or (file) => boolean
  label: 'FIG',                  // defaults to the extension
  color: '#a259ff',
  artwork: (file) => figmaLogo(), // 'lines' | 'thumbnail' | (file) => Node
});

// For one element only: checked before the registered types.
hoop.fileTypes = [{ kind: 'contract', match: (file) => file.name.startsWith('contract-') }];
`;

const CSS = `
/* Built-in kinds: pdf, image, video, audio, sheet, doc, slides, archive, code. */
basketball-upload {
  --basketball-upload-file-pdf: #e11d48;
}

basketball-upload::part(file-image) {
  filter: drop-shadow(0 0.5rem 1rem rgb(47 124 246 / 0.35));
}
`;

/** The four shapes of the Figma logo, as the artwork of `.fig` cards. */
function figmaLogo(): Node {
  const namespace = 'http://www.w3.org/2000/svg';
  const logo = document.createElementNS(namespace, 'svg');
  logo.setAttribute('viewBox', '0 0 38 57');
  // Inline: the artwork lives in the element's Shadow DOM, out of reach of page styles.
  logo.setAttribute(
    'style',
    'display: block; inline-size: 48%; block-size: auto; margin: 4% auto 0'
  );
  const shapes: [string, string][] = [
    ['M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z', '#1abcfe'],
    ['M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z', '#0acf83'],
    ['M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z', '#ff7262'],
    ['M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z', '#f24e1e'],
    ['M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z', '#a259ff'],
  ];
  for (const [pathData, fill] of shapes) {
    const path = document.createElementNS(namespace, 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', fill);
    logo.append(path);
  }
  return logo;
}

export function FileTypesExample({
  theme,
}: {
  theme: SiteTheme;
}): ReactElement {
  const element = useRef<BasketballUploadElement>(null);
  const uploader = useMemo(
    () => createSimulatedUploader({ duration: 2500 }),
    []
  );
  const fileTypes = useMemo<FileType[]>(
    () => [
      {
        kind: 'figma',
        match: '.fig',
        label: 'FIG',
        color: '#a259ff',
        artwork: figmaLogo,
      },
    ],
    []
  );

  return (
    <Section
      id="file-types"
      badge="File types"
      title="Every file gets its own card"
      description={
        <>
          PDFs get the red badge of the design, images show a real thumbnail,
          and every other built-in type has its color. Register your own types
          globally with <code>registerFileType()</code>, or per element with{' '}
          <code>fileTypes</code>.
        </>
      }
    >
      <div className="example">
        <div className="example-code">
          <CodeBlock
            code={CODE}
            language="typescript"
            filename="file-types.ts"
          />
          <CodeBlock code={CSS} language="css" filename="file-types.css" />
        </div>
        <div className="example-live">
          <div className="button-row">
            <button
              type="button"
              className="button"
              onClick={() => {
                void sampleFiles().then((files) =>
                  element.current?.stage(files)
                );
              }}
            >
              Add sample files
            </button>
            <button
              type="button"
              className="button"
              onClick={() => element.current?.stage([figmaFile()])}
            >
              Add a .fig file
            </button>
            <button
              type="button"
              className="button"
              onClick={() => element.current?.clear()}
            >
              Clear
            </button>
          </div>
          <div className="example-stage">
            <BasketballUpload
              ref={element}
              multiple
              theme={theme}
              instant
              uploader={uploader}
              fileTypes={fileTypes}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

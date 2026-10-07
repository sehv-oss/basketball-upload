import * as React from 'react';

import {
  BasketballUpload,
  type BasketballUploadElement,
} from '@sehv-oss/basketball-upload-react';

import { designFile } from '../../demo/sample-files.ts';
import { CodeBlock } from '../code-block.tsx';
import { Section } from '../section.tsx';
import { Segmented } from '../segmented.tsx';

type Look = 'design' | 'hardwood' | 'night-game';

const LOOKS = [
  { value: 'design', label: 'Design' },
  { value: 'hardwood', label: 'Hardwood' },
  { value: 'night-game', label: 'Night game' },
] as const;

const CSS = `
/* Tokens: set them on the element or on any ancestor. */
basketball-upload.hardwood {
  --basketball-upload-background: #f3e5cc;
  --basketball-upload-surface: #fff9ef;
  --basketball-upload-border: #cfae7b;
  --basketball-upload-accent: #c2410c;
  --basketball-upload-net: #8b6f4e;
}

/* Values can follow the theme with light-dark(). */
basketball-upload.night-game {
  --basketball-upload-accent: light-dark(#0891b2, #22d3ee);
  --basketball-upload-background: light-dark(#e0f2fe, #0b1020);
}

/* Parts, for anything a token does not cover. */
basketball-upload::part(dropzone) {
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
}

/* States, from the outside too. */
basketball-upload:state(drop-target)::part(backboard-square) {
  border-style: dashed;
}
`;

export function ThemingExample(): React.ReactElement {
  const element = React.useRef<BasketballUploadElement>(null);
  const [look, setLook] = React.useState<Look>('hardwood');

  React.useEffect(() => {
    element.current?.clear();
    element.current?.stage([designFile()]);
  }, []);

  return (
    <Section
      id="theming"
      badge="Theming"
      title="Tokens, parts, states and themes"
      description={
        <>
          Every color and size is a <code>--basketball-upload-*</code> custom
          property whose default follows <code>light-dark()</code>. Inside, the
          styles live in cascade layers; outside, parts and{' '}
          <code>:state()</code> give you the rest.
        </>
      }
    >
      <div className="example">
        <CodeBlock code={CSS} language="css" filename="theme.css" />
        <div className="example-live">
          <Segmented
            label="Look"
            value={look}
            options={LOOKS}
            onChange={setLook}
          />
          <div className="example-stage">
            <BasketballUpload
              ref={element}
              multiple
              className={look === 'design' ? undefined : look}
              theme={look === 'night-game' ? 'dark' : 'light'}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

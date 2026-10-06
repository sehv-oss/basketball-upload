import { useEffect, useRef, useState, type ReactElement } from 'react';

import {
  DndBasketball,
  type DndBasketballElement,
} from '@sehv-oss/dnd-basketball-react';

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
dnd-basketball.hardwood {
  --dnd-basketball-background: #f3e5cc;
  --dnd-basketball-surface: #fff9ef;
  --dnd-basketball-border: #cfae7b;
  --dnd-basketball-accent: #c2410c;
  --dnd-basketball-net: #8b6f4e;
}

/* Values can follow the theme with light-dark(). */
dnd-basketball.night-game {
  --dnd-basketball-accent: light-dark(#0891b2, #22d3ee);
  --dnd-basketball-background: light-dark(#e0f2fe, #0b1020);
}

/* Parts, for anything a token does not cover. */
dnd-basketball::part(dropzone) {
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
}

/* States, from the outside too. */
dnd-basketball:state(drop-target)::part(backboard-square) {
  border-style: dashed;
}
`;

export function ThemingExample(): ReactElement {
  const element = useRef<DndBasketballElement>(null);
  const [look, setLook] = useState<Look>('hardwood');

  useEffect(() => {
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
          Every color and size is a <code>--dnd-basketball-*</code> custom
          property whose default follows <code>light-dark()</code>. Inside, the
          styles live in cascade layers; outside, parts and{' '}
          <code>:state()</code> give you the rest.
        </>
      }
    >
      <div className="example">
        <CodeBlock code={CSS} lang="css" filename="theme.css" />
        <div className="example-live">
          <Segmented
            label="Look"
            value={look}
            options={LOOKS}
            onChange={setLook}
          />
          <div className="example-stage">
            <DndBasketball
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

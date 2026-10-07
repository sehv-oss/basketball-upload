import type * as React from 'react';

import { Section } from './section.tsx';

const LINKS = [
  {
    href: 'https://github.com/jm-fuster',
    label: 'GitHub',
    handle: 'jm-fuster',
  },
  {
    href: 'https://www.figma.com/@jm_fuster',
    label: 'Figma Community',
    handle: '@jm_fuster',
  },
  {
    href: 'https://jorgemolinafuster.com',
    label: 'Website',
    handle: 'jorgemolinafuster.com',
  },
] as const;

export function Credits(): React.ReactElement {
  return (
    <Section
      id="credits"
      badge="Credits"
      title="Designed by Jorge Molina"
      description={
        <>
          The basketball upload, from the backboard dropzone to the slingshot
          and the swish of the net, is the work of Jorge Molina, published on
          Figma Community. This project is an independent code implementation of
          that design, made with admiration; it is not affiliated with or
          endorsed by the author.
        </>
      }
    >
      <div className="credits">
        <ul className="credits-links">
          {LINKS.map(({ href, label, handle }) => (
            <li key={href}>
              <a href={href}>
                <span>{label}</span>
                <strong>{handle}</strong>
              </a>
            </li>
          ))}
        </ul>
        <p className="credits-note">
          Added in this implementation: the dark theme, accessibility (keyboard
          shots, announcements, reduced motion), the upload pipeline, file
          types, form association and the Web Component API.
        </p>
      </div>
    </Section>
  );
}

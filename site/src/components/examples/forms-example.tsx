import * as React from 'react';

import { BasketballUpload } from '@sehv-oss/basketball-upload-react';
import { formatBytes } from '@sehv-oss/basketball-upload';

import type { SiteTheme } from '../../hooks/use-site-theme.ts';
import { CodeBlock } from '../code-block.tsx';
import { Section } from '../section.tsx';

const HTML = `
<form method="post" action="/tickets" enctype="multipart/form-data">
  <input name="title" required />

  <!-- A form-associated custom element: no uploader needed. -->
  <basketball-upload name="attachments" multiple required></basketball-upload>

  <button>Send</button>
</form>
`;

interface Entry {
  name: string;
  value: string;
}

export function FormsExample({
  theme,
}: {
  theme: SiteTheme;
}): React.ReactElement {
  const [entries, setEntries] = React.useState<Entry[] | null>(null);

  const handleOnSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setEntries(
      [...data.entries()].map(([name, value]) => ({
        name,
        value:
          typeof value === 'string'
            ? JSON.stringify(value)
            : `${value.name} (${formatBytes(value.size)})`,
      }))
    );
  };
  const handleOnReset = (): void => setEntries(null);

  return (
    <Section
      id="forms"
      badge="Forms"
      title="A real form control"
      description={
        <>
          The element is form-associated: the files in the basket are submitted
          under its <code>name</code>, <code>required</code> blocks an empty
          submission, and a form reset empties it. Without an{' '}
          <code>uploader</code>, files simply wait for the form.
        </>
      }
    >
      <div className="example">
        <CodeBlock code={HTML} language="html" filename="ticket.html" />
        <form
          className="example-live form-demo"
          onSubmit={handleOnSubmit}
          onReset={handleOnReset}
        >
          <label className="field">
            <span>Title</span>
            <input name="title" required defaultValue="Scouting report" />
          </label>
          <div className="example-stage">
            <BasketballUpload
              name="attachments"
              multiple
              required
              instant
              theme={theme}
            />
          </div>
          <div className="button-row">
            <button type="submit" className="button button-primary">
              Send
            </button>
            <button type="reset" className="button">
              Reset
            </button>
          </div>
          {entries && (
            <output className="form-output">
              <strong>FormData</strong>
              <ul>
                {entries.map((entry, index) => (
                  <li key={index}>
                    <code>{entry.name}</code> {entry.value}
                  </li>
                ))}
              </ul>
            </output>
          )}
        </form>
      </div>
    </Section>
  );
}

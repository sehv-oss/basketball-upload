import type { ReactElement } from 'react';

import {
  useHighlightedCode,
  type CodeLanguage,
} from '../hooks/use-highlighted-code.ts';
import { CopyButton } from './copy-button.tsx';

interface CodeBlockProps {
  code: string;
  lang: CodeLanguage;
  filename?: string;
}

export function CodeBlock({
  code,
  lang,
  filename,
}: CodeBlockProps): ReactElement {
  const html = useHighlightedCode(code, lang);
  const plain = code.trim();

  return (
    <figure className="code-block">
      <figcaption className="code-block-header">
        <span className="code-block-filename">{filename ?? lang}</span>
        <CopyButton text={plain} label={`Copy ${filename ?? 'code'}`} />
      </figcaption>
      {html ? (
        <div
          className="code-block-body"
          // Shiki escapes the code; the markup is its own.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="code-block-body">
          <code>{plain}</code>
        </pre>
      )}
    </figure>
  );
}

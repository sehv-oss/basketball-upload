import type { ReactElement } from 'react';

import {
  useHighlightedCode,
  type CodeLanguage,
} from '../hooks/use-highlighted-code.ts';
import { CopyButton } from './copy-button.tsx';

interface CodeBlockProps {
  code: string;
  language: CodeLanguage;
  filename?: string;
}

export function CodeBlock({
  code,
  language,
  filename,
}: CodeBlockProps): ReactElement {
  const html = useHighlightedCode(code, language);
  const plain = code.trim();

  return (
    <figure className="code-block">
      <figcaption className="code-block-header">
        <span className="code-block-filename">{filename ?? language}</span>
        <CopyButton text={plain} label={`Copy ${filename ?? 'code'}`} />
      </figcaption>
      {html ? (
        <div
          className="code-block-body"
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

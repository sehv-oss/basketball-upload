import * as React from 'react';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

export type CodeLanguage =
  'html' | 'css' | 'tsx' | 'typescript' | 'shellscript';

let highlighter: Promise<HighlighterCore> | undefined;

function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    themes: [
      import('shiki/themes/github-light-default.mjs'),
      import('shiki/themes/github-dark-default.mjs'),
    ],
    langs: [
      import('shiki/langs/html.mjs'),
      import('shiki/langs/css.mjs'),
      import('shiki/langs/tsx.mjs'),
      import('shiki/langs/typescript.mjs'),
      import('shiki/langs/shellscript.mjs'),
    ],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
}

export function useHighlightedCode(
  code: string,
  language: CodeLanguage
): string {
  const [html, setHtml] = React.useState('');

  React.useEffect(() => {
    let current = true;
    void getHighlighter().then((instance) => {
      if (!current) return;
      setHtml(
        instance.codeToHtml(code.trim(), {
          lang: language,
          themes: {
            light: 'github-light-default',
            dark: 'github-dark-default',
          },
          defaultColor: false,
        })
      );
    });
    return () => {
      current = false;
    };
  }, [code, language]);

  return html;
}

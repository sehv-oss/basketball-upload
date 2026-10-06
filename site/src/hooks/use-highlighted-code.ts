import { useEffect, useState } from 'react';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

export type CodeLanguage =
  'html' | 'css' | 'tsx' | 'typescript' | 'shellscript';

let highlighter: Promise<HighlighterCore> | undefined;

/** Only the languages and themes the site shows, with the JavaScript regex engine (no WASM). */
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

/**
 * Highlighted HTML for `code`, empty until ready. Both themes are emitted as
 * CSS variables (`--shiki-light`, `--shiki-dark`); the stylesheet picks one
 * with `light-dark()`.
 */
export function useHighlightedCode(code: string, lang: CodeLanguage): string {
  const [html, setHtml] = useState('');

  useEffect(() => {
    let current = true;
    void getHighlighter().then((instance) => {
      if (!current) return;
      setHtml(
        instance.codeToHtml(code.trim(), {
          lang,
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
  }, [code, lang]);

  return html;
}

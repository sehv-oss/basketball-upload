import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';

import { App } from './app.tsx';

/**
 * The page as the build writes it into `index.html`, for crawlers and link
 * previews, which do not run scripts. `main.tsx` hydrates it.
 */
export function prerender(): string {
  return ReactDOMServer.renderToString(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';

import { App } from './app.tsx';

export function prerender(): string {
  return ReactDOMServer.renderToString(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

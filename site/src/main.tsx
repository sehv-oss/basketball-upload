import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';

import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

import { App } from './app.tsx';
import { Reference } from './reference.tsx';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');

const reference = new URLSearchParams(location.search).has('reference');

ReactDOM.createRoot(root).render(
  <React.StrictMode>{reference ? <Reference /> : <App />}</React.StrictMode>
);

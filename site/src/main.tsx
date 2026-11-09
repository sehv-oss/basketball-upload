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

if (reference) root.replaceChildren();

const page = (
  <React.StrictMode>{reference ? <Reference /> : <App />}</React.StrictMode>
);

if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, page);
else ReactDOM.createRoot(root).render(page);

import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app.tsx';
import { Reference } from './reference.tsx';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');

// `?reference` renders the element alone, at the size of the reference
// design, for side-by-side comparisons with its screenshots.
const reference = new URLSearchParams(location.search).has('reference');

createRoot(root).render(
  <StrictMode>{reference ? <Reference /> : <App />}</StrictMode>
);

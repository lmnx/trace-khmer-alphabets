import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

// iOS Safari only shows :active styles once the page listens for touches, and
// buttons and tiles shrink while pressed with :active.
document.addEventListener('touchstart', () => {}, { passive: true });

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

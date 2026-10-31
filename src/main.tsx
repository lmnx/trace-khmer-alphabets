import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { installAudioUnlock } from './lib/audio';
import './index.css';

// iOS Safari only shows :active styles once the page listens for touches, and
// buttons and tiles shrink while pressed with :active.
document.addEventListener('touchstart', () => {}, { passive: true });

// Sound can start only inside a tap, so the first one wakes the audio.
installAudioUnlock();

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

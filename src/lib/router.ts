import { useSyncExternalStore } from 'react';

// Hash routes (#/trace/:order), because GitHub Pages can't send every path to
// index.html. The hash is user input, so only exact known shapes are accepted.

export type Route = { name: 'home' } | { name: 'trace'; order: number };

// Phase 1 replaces this with the length of the generated letter list.
const CONSONANT_COUNT = 33;

export function parseHash(hash: string): Route {
  const trace = /^#\/trace\/([1-9]\d?)$/.exec(hash);
  if (trace) {
    const order = Number(trace[1]);
    if (order <= CONSONANT_COUNT) return { name: 'trace', order };
  }
  return { name: 'home' };
}

export function traceHref(order: number): string {
  return `#/trace/${order}`;
}

export const homeHref = '#/';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function getHash(): string {
  return window.location.hash;
}

export function useRoute(): Route {
  return parseHash(useSyncExternalStore(subscribe, getHash));
}

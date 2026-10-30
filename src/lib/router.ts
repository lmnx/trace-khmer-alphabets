import { useSyncExternalStore } from 'react';
import { letters } from '../data/letters';

// Hash routes (#/trace/:order), because GitHub Pages can't send every path to
// index.html. The hash is user input, so only exact known shapes are accepted.

export type Route = { name: 'home' } | { name: 'trace'; order: number };

export function parseHash(hash: string): Route {
  const trace = /^#\/trace\/([1-9]\d?)$/.exec(hash);
  if (trace) {
    const order = Number(trace[1]);
    if (order <= letters.length) return { name: 'trace', order };
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

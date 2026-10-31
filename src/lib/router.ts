import { useSyncExternalStore } from 'react';
import { letters } from '../data/letters';
import type { Form } from './forms';

// Hash routes, because GitHub Pages can't send every path to index.html.
// The hash is user input, so only exact known shapes are accepted:
//   #/  #/both                     home, showing that form
//   #/trace/1  #/trace/1/both      a letter, or its full form
//   #/trace/number/0 to #/trace/number/9          a numeral

export type TraceTarget = { kind: 'letter'; order: number; form: Form } | { kind: 'number'; digit: number };

export type Route = { name: 'home'; form: Form } | { name: 'trace'; target: TraceTarget };

const HOME: Route = { name: 'home', form: 'letter' };

function toForm(suffix: string | undefined): Form {
  return suffix === 'both' ? suffix : 'letter';
}

export function parseHash(hash: string): Route {
  const home = /^#\/(both)$/.exec(hash);
  if (home) return { name: 'home', form: toForm(home[1]) };

  const letter = /^#\/trace\/([1-9]\d?)(?:\/(both))?$/.exec(hash);
  if (letter) {
    const order = Number(letter[1]);
    if (letters[order - 1]) return { name: 'trace', target: { kind: 'letter', order, form: toForm(letter[2]) } };
  }

  const number = /^#\/trace\/number\/(\d)$/.exec(hash);
  if (number) return { name: 'trace', target: { kind: 'number', digit: Number(number[1]) } };

  return HOME;
}

export function homeHref(form: Form = 'letter'): string {
  return form === 'letter' ? '#/' : `#/${form}`;
}

export function traceHref(order: number, form: Form = 'letter'): string {
  return form === 'letter' ? `#/trace/${order}` : `#/trace/${order}/${form}`;
}

export function numberHref(digit: number): string {
  return `#/trace/number/${digit}`;
}

export function targetHref(target: TraceTarget): string {
  return target.kind === 'number' ? numberHref(target.digit) : traceHref(target.order, target.form);
}

// Switches the home page's form without adding a history entry per tap.
export function showHome(form: Form): void {
  window.location.replace(homeHref(form));
}

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

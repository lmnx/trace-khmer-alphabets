import type { HtmlTagDescriptor, Plugin } from 'vite';

// GitHub Pages can't send response headers, so the policy ships as a <meta>
// tag. Any loosening needs a reason recorded in docs/security-log.md.
export const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
] as const;

export const CSP = CSP_DIRECTIVES.join('; ');

// A meta CSP only covers what comes after it, so both tags go first in <head>.
export const cspTags: HtmlTagDescriptor[] = [
  { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
  { tag: 'meta', attrs: { name: 'referrer', content: 'no-referrer' }, injectTo: 'head-prepend' },
];

// Production builds only: the dev server needs inline scripts.
export function cspPlugin(): Plugin {
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml: () => cspTags,
  };
}

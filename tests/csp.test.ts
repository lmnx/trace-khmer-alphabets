import { describe, expect, it } from 'vitest';
import { CSP, CSP_DIRECTIVES, cspPlugin, cspTags } from '../plugins/csp';

// Changing the policy should be a deliberate edit to these tests too, with
// the reason recorded in docs/security-log.md.
describe('CSP plugin', () => {
  it('ships the policy from CLAUDE.md', () => {
    expect(CSP).toBe(
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; " +
        "object-src 'none'; base-uri 'none'; form-action 'none'",
    );
  });

  it('allows no inline code, eval or other origins', () => {
    for (const directive of CSP_DIRECTIVES) {
      expect(directive).not.toMatch(/unsafe-|\*|https?:/);
    }
  });

  it('adds the CSP and referrer tags at the top of <head>, in builds only', () => {
    expect(cspPlugin().apply).toBe('build');
    expect(cspTags).toEqual([
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
      { tag: 'meta', attrs: { name: 'referrer', content: 'no-referrer' }, injectTo: 'head-prepend' },
    ]);
  });
});

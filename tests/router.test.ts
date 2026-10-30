import { describe, expect, it } from 'vitest';
import { parseHash, traceHref } from '../src/lib/router';

describe('parseHash', () => {
  it('reads trace routes for letters 1 to 33', () => {
    expect(parseHash('#/trace/1')).toEqual({ name: 'trace', order: 1 });
    expect(parseHash('#/trace/33')).toEqual({ name: 'trace', order: 33 });
    expect(parseHash(traceHref(12))).toEqual({ name: 'trace', order: 12 });
  });

  it('sends anything else home', () => {
    for (const hash of ['', '#', '#/', '#/trace', '#/trace/0', '#/trace/34', '#/trace/01', '#/trace/1/x', '#/trace/1?x', '#/trace/-1', '#/trace/1e1', '#/other']) {
      expect(parseHash(hash), hash).toEqual({ name: 'home' });
    }
  });
});

import { describe, expect, it } from 'vitest';
import { ABOUT_HREF, homeHref, numberHref, parseHash, traceHref } from '../src/lib/router';

const home = { name: 'home', form: 'letter' };

describe('parseHash', () => {
  it('reads the home page in each form', () => {
    expect(parseHash('#/')).toEqual(home);
    expect(parseHash('#/both')).toEqual({ name: 'home', form: 'both' });
    for (const form of ['letter', 'both'] as const) {
      expect(parseHash(homeHref(form))).toEqual({ name: 'home', form });
    }
  });

  it('reads letters 1 to 33 in each form', () => {
    expect(parseHash('#/trace/1')).toEqual({ name: 'trace', target: { kind: 'letter', order: 1, form: 'letter' } });
    expect(parseHash('#/trace/33/both')).toEqual({ name: 'trace', target: { kind: 'letter', order: 33, form: 'both' } });
    expect(parseHash(traceHref(12, 'both'))).toEqual({ name: 'trace', target: { kind: 'letter', order: 12, form: 'both' } });
  });

  it('reads the numbers 0 to 9', () => {
    expect(parseHash('#/trace/number/0')).toEqual({ name: 'trace', target: { kind: 'number', digit: 0 } });
    expect(parseHash(numberHref(9))).toEqual({ name: 'trace', target: { kind: 'number', digit: 9 } });
  });

  it('opens ឡ (letter 32) as a letter or from Both', () => {
    expect(parseHash('#/trace/32')).toEqual({ name: 'trace', target: { kind: 'letter', order: 32, form: 'letter' } });
    expect(parseHash('#/trace/32/both')).toEqual({ name: 'trace', target: { kind: 'letter', order: 32, form: 'both' } });
  });

  it('reads the About page', () => {
    expect(parseHash('#/about')).toEqual({ name: 'about' });
    expect(parseHash(ABOUT_HREF)).toEqual({ name: 'about' });
  });

  it('sends anything else home', () => {
    for (const hash of [
      '',
      '#',
      '#/letter',
      '#/subscript/',
      '#/trace',
      '#/trace/0',
      '#/trace/34',
      '#/trace/01',
      '#/trace/1/x',
      '#/trace/1/letter',
      '#/trace/1?x',
      '#/trace/-1',
      '#/trace/1e1',
      '#/trace/number',
      '#/trace/number/10',
      '#/trace/number/-1',
      '#/trace/number/1/subscript',
      '#/other',
      '#/practice',
      '#/practice/trace/1',
      '#/about/',
      '#/about/1',
      '#/About',
      '#/about?x',
      '#about',
      // The Subscript form was dropped.
      '#/subscript',
      '#/trace/1/subscript',
    ]) {
      expect(parseHash(hash), hash).toEqual(home);
    }
  });
});

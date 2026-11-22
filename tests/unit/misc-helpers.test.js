import { describe, it, expect } from 'vitest';
import { sameUrl } from '@/utils/MiscHelpers';

describe('MiscHelpers - sameUrl', () => {
  it('matches urls that differ only by host case, default port or trailing slash', () => {
    expect(sameUrl('https://App.com', 'https://app.com/')).toBe(true);
    expect(sameUrl('https://app.com:443/docs/', 'https://app.com/docs')).toBe(true);
  });

  it('keeps paths and queries case-sensitive', () => {
    expect(sameUrl('https://app.com/Doc?id=A', 'https://app.com/doc?id=a')).toBe(false);
  });

  it('never matches a missing url', () => {
    expect(sameUrl(undefined, undefined)).toBe(false);
    expect(sameUrl('', 'https://app.com')).toBe(false);
  });
});

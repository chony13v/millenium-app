import { toGeohash } from '../geo';
import { toDateParts } from '../time';
import { hashUserId } from '../hash';

describe('toGeohash', () => {
  it('encodes coordinates at requested precision', () => {
    expect(toGeohash(42.6, -5.6, 5)).toBe('ezs42');
  });

  it('throws on out-of-range latitude', () => {
    expect(() => toGeohash(100, 0)).toThrow('latitude must be between -90 and 90');
  });
});

describe('toDateParts', () => {
  it('returns UTC date components', () => {
    const value = toDateParts(new Date('2024-01-01T12:34:56Z'));
    expect(value).toEqual({ date: '2024-01-01', hour: 12, weekday: 1 });
  });

  it('rejects invalid numbers', () => {
    expect(() => toDateParts(Number.NaN)).toThrow('timestamp must be a finite number');
  });
});

describe('hashUserId', () => {
  it('hashes the payload deterministically', () => {
    expect(hashUserId('user', 'salt')).toBe('06c9146b1c9aa22dfefb94b0550809c02f71d620a31d59f844a0132d3dff09d4');
  });

  it('throws on missing salt', () => {
    expect(() => hashUserId('user', '')).toThrow('salt cannot be empty');
  });
});
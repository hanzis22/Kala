import { describe, expect, it } from 'vitest';
import { CITIES } from '$lib/data/cities';
import { distanceKm, nearestCity, roundCoord } from './geo';

describe('roundCoord (privasi lokasi)', () => {
  it('membulatkan ke 2 desimal', () => {
    expect(roundCoord(-6.175392)).toBe(-6.18);
    expect(roundCoord(106.827153)).toBe(106.83);
    expect(roundCoord(112.73)).toBe(112.73);
    expect(roundCoord(0.004)).toBe(0);
    expect(Object.is(roundCoord(-0.004), -0)).toBe(false);
  });
});

describe('distanceKm', () => {
  it('Jakarta–Surabaya sekitar 660 km', () => {
    const d = distanceKm({ lat: -6.17, lng: 106.82 }, { lat: -7.25, lng: 112.74 });
    expect(d).toBeGreaterThan(640);
    expect(d).toBeLessThan(680);
  });
});

describe('nearestCity', () => {
  it('Monas → Jakarta Pusat, Tugu Pahlawan → Surabaya', () => {
    expect(nearestCity(-6.1754, 106.8272, CITIES).name).toBe('Jakarta Pusat');
    expect(nearestCity(-7.2458, 112.7378, CITIES).name).toBe('Surabaya');
  });

  it('menolak daftar kosong', () => {
    expect(() => nearestCity(0, 0, [])).toThrow(RangeError);
  });
});

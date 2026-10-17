import { describe, expect, it } from 'vitest';
import { CITIES } from '$lib/data/cities';
import { distanceKm, locationFromCity, locationFromGps, nearestCity, roundCoord } from './geo';

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

describe('locationFromGps', () => {
  it('membulatkan koordinat ke 2 desimal; label dan zona dari kota terdekat', () => {
    expect(locationFromGps(-7.257472, 112.75209, CITIES)).toEqual({
      mode: 'gps',
      cityId: null,
      label: 'Surabaya',
      lat: -7.26,
      lng: 112.75,
      timeZone: 'Asia/Jakarta'
    });
  });

  it('zona waktu ikut kota terdekat (WITA)', () => {
    expect(locationFromGps(-5.147665, 119.432732, CITIES)).toMatchObject({
      label: 'Makassar',
      timeZone: 'Asia/Makassar'
    });
  });
});

describe('locationFromCity', () => {
  it('menyalin data kota apa adanya', () => {
    const c = CITIES.find((x) => x.code === '3173')!;
    expect(locationFromCity(c)).toEqual({
      mode: 'city',
      cityId: c.id,
      label: 'Jakarta Pusat',
      lat: c.lat,
      lng: c.lng,
      timeZone: 'Asia/Jakarta'
    });
  });
});

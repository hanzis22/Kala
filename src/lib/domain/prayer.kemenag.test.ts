/**
 * Uji akurasi wajib PRD §F3.2: hasil hitungan vs jadwal resmi Kemenag (fixture, sumber dan tanggal
 * pengambilan di fixtures/kemenag.ts) untuk Jakarta, Surabaya, Makassar pada 3 tanggal.
 *
 * Aturan (PRD §F3.1), sama untuk semua kota dan tanggal, dalam menit (Kala − Kemenag):
 * - awal waktu sholat dan Dhuha: −1 … +2 (boleh lebih lambat 2, lebih awal maksimal 1)
 * - Imsak dan Terbit: −2 … +1 (boleh lebih awal 2, lebih lambat maksimal 1)
 * Jadwal Kemenag sudah memuat ihtiyat 2 menit, jadi selisih 1 menit ke arah tidak aman masih di
 * dalam margin ihtiyat (pembulatan dan perbedaan titik koordinat).
 */
import { describe, expect, it } from 'vitest';
import { CITIES } from '$lib/data/cities';
import { toMinutes } from './dates';
import { KEMENAG_FIXTURES, type KemenagField } from './fixtures/kemenag';
import { prayerTimes, type PrayerConfig } from './prayer';
import { defaultSettings } from './settings';
import type { City } from './types';

const START_FIELDS: KemenagField[] = ['subuh', 'dhuha', 'dzuhur', 'ashar', 'maghrib', 'isya'];
const END_FIELDS: KemenagField[] = ['imsak', 'terbit'];

function configFor(city: City): PrayerConfig {
  return {
    location: {
      mode: 'city',
      cityId: city.id,
      label: city.name,
      lat: city.lat,
      lng: city.lng,
      timeZone: city.timeZone
    },
    prayer: defaultSettings().prayer
  };
}

describe('akurasi vs jadwal resmi Kemenag (PRD §F3.2)', () => {
  it('fixture mencakup 3 kota × 3 tanggal', () => {
    expect(new Set(KEMENAG_FIXTURES.map((f) => f.cityId)).size).toBe(3);
    expect(new Set(KEMENAG_FIXTURES.map((f) => f.date)).size).toBe(3);
    expect(KEMENAG_FIXTURES).toHaveLength(9);
  });

  for (const fixture of KEMENAG_FIXTURES) {
    // fixture.cityId = kode Kemendagri = City.code
    const city = CITIES.find((c) => c.code === fixture.cityId);

    it(`${fixture.kemenag.kabko} ${fixture.date}`, () => {
      expect(city, `kota dengan kode ${fixture.cityId}`).toBeDefined();
      const ours = prayerTimes(fixture.date, configFor(city!));
      const diff = (f: KemenagField) => ours[f] - toMinutes(fixture.times[f]);
      for (const f of START_FIELDS) {
        expect(diff(f), `${f}: Kala − Kemenag (menit)`).toBeGreaterThanOrEqual(-1);
        expect(diff(f), `${f}: Kala − Kemenag (menit)`).toBeLessThanOrEqual(2);
      }
      for (const f of END_FIELDS) {
        expect(diff(f), `${f}: Kala − Kemenag (menit)`).toBeGreaterThanOrEqual(-2);
        expect(diff(f), `${f}: Kala − Kemenag (menit)`).toBeLessThanOrEqual(1);
      }
    });
  }
});

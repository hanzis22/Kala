import { describe, expect, it } from 'vitest';
import { CITIES } from '$lib/data/cities';
import { fromMinutes } from './dates';
import {
  canLogPrayer,
  isNightForTheme,
  nextPrayer,
  prayerLogId,
  prayerStatus,
  prayerTimes,
  toPrayerConfig,
  type PrayerConfig
} from './prayer';
import { defaultSettings } from './settings';
import type { City, LocalDate, PrayerLog, PrayerName } from './types';

const city = (code: string): City => CITIES.find((c) => c.code === code)!;

function config(c: City, prayer = defaultSettings().prayer): PrayerConfig {
  return {
    location: { mode: 'city', cityId: c.id, label: c.name, lat: c.lat, lng: c.lng, timeZone: c.timeZone },
    prayer
  };
}

const JKT = config(city('3173'));
const DAY: LocalDate = '2026-10-17';
const T = prayerTimes(DAY, JKT);

/** Instan untuk jam dinding WIB (Jakarta) pada tanggal tertentu. */
const wib = (date: LocalDate, hm: string) => new Date(`${date}T${hm}:00+07:00`);
/** Instan pada menit tertentu (dari tengah malam) di WIB. */
const wibAt = (date: LocalDate, minutes: number) => wib(date, fromMinutes(minutes));

const log = (date: LocalDate, prayer: PrayerName): PrayerLog => ({
  id: prayerLogId(date, prayer),
  date,
  prayer,
  congregation: false,
  at: '2026-10-17T00:00:00.000Z'
});

describe('prayerTimes', () => {
  it('urutan waktu masuk akal dan Imsak tepat 10 menit sebelum Subuh', () => {
    expect(T.imsak).toBe(T.subuh - 10);
    const order = [T.subuh, T.terbit, T.dhuha, T.dzuhur, T.ashar, T.maghrib, T.isya];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(T.subuh).toBeGreaterThan(4 * 60);
    expect(T.isya).toBeLessThan(20 * 60);
  });

  it('ihtiyat ditambahkan ke awal waktu dan dikurangkan dari Terbit', () => {
    const zero = prayerTimes(DAY, config(city('3173'), { ...defaultSettings().prayer, ihtiyatMin: 0 }));
    for (const p of ['subuh', 'dhuha', 'dzuhur', 'ashar', 'maghrib', 'isya'] as const) {
      expect(T[p] - zero[p], p).toBeGreaterThanOrEqual(1);
      expect(T[p] - zero[p], p).toBeLessThanOrEqual(3);
    }
    expect(zero.terbit - T.terbit).toBeGreaterThanOrEqual(1);
    expect(zero.terbit - T.terbit).toBeLessThanOrEqual(3);
  });

  it('koreksi manual per sholat ditambahkan apa adanya; Imsak ikut Subuh', () => {
    const adjusted = prayerTimes(
      DAY,
      config(city('3173'), {
        ...defaultSettings().prayer,
        adjustMin: { subuh: 3, dzuhur: -2, ashar: 0, maghrib: 10, isya: -10 }
      })
    );
    expect(adjusted.subuh).toBe(T.subuh + 3);
    expect(adjusted.imsak).toBe(T.imsak + 3);
    expect(adjusted.dzuhur).toBe(T.dzuhur - 2);
    expect(adjusted.ashar).toBe(T.ashar);
    expect(adjusted.maghrib).toBe(T.maghrib + 10);
    expect(adjusted.isya).toBe(T.isya - 10);
    expect(adjusted.terbit).toBe(T.terbit);
    expect(adjusted.dhuha).toBe(T.dhuha);
  });

  it('dihitung di zona lokasi: Makassar (WITA) dan Jayapura (WIT) tetap pagi di jam lokal', () => {
    for (const code of ['7371', '9471']) {
      const t = prayerTimes(DAY, config(city(code)));
      expect(t.subuh, code).toBeGreaterThan(3 * 60 + 30);
      expect(t.subuh, code).toBeLessThan(5 * 60);
      expect(t.maghrib, code).toBeGreaterThan(17 * 60 + 30);
      expect(t.maghrib, code).toBeLessThan(18 * 60 + 30);
    }
  });
});

describe('prayerStatus dan nextPrayer: rentang fikih', () => {
  it('06.30 (setelah Terbit, sebelum Dzuhur): tidak ada "now", Subuh tanpa log = missed, berikutnya Dzuhur', () => {
    const now = wib(DAY, '06:30');
    expect(T.terbit).toBeLessThan(6 * 60 + 30);
    expect(T.dzuhur).toBeGreaterThan(6 * 60 + 30);
    const s = prayerStatus(DAY, [], now, JKT);
    expect(Object.values(s)).not.toContain('now');
    expect(s).toEqual({
      subuh: 'missed',
      dzuhur: 'upcoming',
      ashar: 'upcoming',
      maghrib: 'upcoming',
      isya: 'upcoming'
    });
    expect(prayerStatus(DAY, [log(DAY, 'subuh')], now, JKT).subuh).toBe('done');
    expect(nextPrayer(now, JKT)).toMatchObject({ prayer: 'dzuhur', date: DAY, time: T.dzuhur });
  });

  it('Subuh "now" sampai sebelum Terbit, "missed" tepat saat Terbit', () => {
    expect(prayerStatus(DAY, [], wibAt(DAY, T.subuh), JKT).subuh).toBe('now');
    expect(prayerStatus(DAY, [], wibAt(DAY, T.terbit - 1), JKT).subuh).toBe('now');
    expect(prayerStatus(DAY, [], wibAt(DAY, T.terbit), JKT).subuh).toBe('missed');
    expect(prayerStatus(DAY, [], wibAt(DAY, T.subuh - 1), JKT).subuh).toBe('upcoming');
  });

  it('selama Subuh, sholat berikutnya adalah Dzuhur (Terbit bukan sholat)', () => {
    expect(nextPrayer(wibAt(DAY, T.subuh + 1), JKT).prayer).toBe('dzuhur');
  });

  it('sholat lain berakhir saat sholat berikutnya masuk', () => {
    const s = prayerStatus(DAY, [], wibAt(DAY, T.ashar), JKT);
    expect(s.dzuhur).toBe('missed');
    expect(s.ashar).toBe('now');
    expect(prayerStatus(DAY, [], wibAt(DAY, T.ashar - 1), JKT).dzuhur).toBe('now');
  });

  it('setelah Isya: Isya "now" sampai Subuh esok, berikutnya Subuh esok', () => {
    const next = '2026-10-18';
    const tNext = prayerTimes(next, JKT);
    expect(prayerStatus(DAY, [], wibAt(DAY, T.isya + 30), JKT).isya).toBe('now');
    expect(prayerStatus(DAY, [], wib(next, '00:30'), JKT).isya).toBe('now');
    expect(prayerStatus(DAY, [], wibAt(next, tNext.subuh), JKT).isya).toBe('missed');
    expect(nextPrayer(wibAt(DAY, T.isya + 30), JKT)).toMatchObject({
      prayer: 'subuh',
      date: next,
      time: tNext.subuh
    });
    expect(nextPrayer(wib(next, '00:30'), JKT)).toMatchObject({ prayer: 'subuh', date: next });
  });

  it('tengah malam: sholat hari baru semua "upcoming"', () => {
    const s = prayerStatus('2026-10-18', [], wib('2026-10-18', '00:00'), JKT);
    expect(Object.values(s)).toEqual(['upcoming', 'upcoming', 'upcoming', 'upcoming', 'upcoming']);
  });

  it('minutesUntil menghitung selisih dari sekarang', () => {
    expect(nextPrayer(wibAt(DAY, T.dzuhur - 25), JKT)).toMatchObject({ prayer: 'dzuhur', minutesUntil: 25 });
  });

  it('log dari tanggal lain tidak dihitung', () => {
    expect(prayerStatus(DAY, [log('2026-10-16', 'subuh')], wib(DAY, '06:30'), JKT).subuh).toBe('missed');
  });
});

describe('canLogPrayer (PRD §F3.4)', () => {
  it('belum masuk waktu: tidak bisa dicatat', () => {
    expect(canLogPrayer(DAY, 'dzuhur', wibAt(DAY, T.dzuhur - 1), JKT)).toBe(false);
  });

  it('sejak masuk waktu sampai akhir hari berikutnya', () => {
    expect(canLogPrayer(DAY, 'dzuhur', wibAt(DAY, T.dzuhur), JKT)).toBe(true);
    expect(canLogPrayer(DAY, 'subuh', wib('2026-10-18', '23:59'), JKT)).toBe(true);
    expect(canLogPrayer(DAY, 'subuh', wib('2026-10-19', '00:00'), JKT)).toBe(false);
  });
});

describe('isNightForTheme (tema "ikuti waktu sholat")', () => {
  it('malam sejak Isya sampai sebelum Subuh', () => {
    expect(isNightForTheme(wibAt(DAY, T.isya), JKT)).toBe(true);
    expect(isNightForTheme(wib(DAY, '02:00'), JKT)).toBe(true);
    expect(isNightForTheme(wibAt(DAY, T.subuh - 1), JKT)).toBe(true);
    expect(isNightForTheme(wibAt(DAY, T.subuh), JKT)).toBe(false);
    expect(isNightForTheme(wibAt(DAY, T.isya - 1), JKT)).toBe(false);
  });
});

describe('toPrayerConfig', () => {
  it('null tanpa lokasi; berisi lokasi dan parameter jika ada', () => {
    const s = defaultSettings();
    expect(toPrayerConfig(s)).toBeNull();
    expect(toPrayerConfig({ ...s, location: JKT.location })).toEqual({
      location: JKT.location,
      prayer: s.prayer
    });
  });
});

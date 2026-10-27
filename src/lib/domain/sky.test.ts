import { describe, expect, it } from 'vitest';
import { CITIES } from '$lib/data/cities';
import { addDays, fromMinutes } from './dates';
import { prayerLogId, prayerTimes, type PrayerConfig } from './prayer';
import { defaultSettings } from './settings';
import { arcFraction, arcPoint, skyCard, skyTone } from './sky';
import type { LocalDate, PrayerLog, PrayerName } from './types';

const jakarta = CITIES.find((c) => c.code === '3173')!;
const JKT: PrayerConfig = {
  location: {
    mode: 'city',
    cityId: jakarta.id,
    label: jakarta.name,
    lat: jakarta.lat,
    lng: jakarta.lng,
    timeZone: jakarta.timeZone
  },
  prayer: defaultSettings().prayer
};
const D: LocalDate = '2026-10-26';
const PREV = addDays(D, -1);
const NEXT = addDays(D, 1);
const T = prayerTimes(D, JKT);

/** Instan untuk jam dinding WIB, dengan detik opsional. */
const wib = (date: LocalDate, minutes: number, seconds = 0) =>
  new Date(`${date}T${fromMinutes(minutes)}:${String(seconds).padStart(2, '0')}+07:00`);
const hm = (h: number, m = 0) => h * 60 + m;
const log = (date: LocalDate, prayer: PrayerName): PrayerLog => ({
  id: prayerLogId(date, prayer),
  date,
  prayer,
  congregation: false,
  at: '2026-10-26T00:00:00.000Z'
});

describe('skyCard: mode', () => {
  it('Maghrib belum dicatat → cta; sudah dicatat → hitung mundur ke Isya', () => {
    const now = wib(D, T.maghrib + 3);
    const open = skyCard(now, JKT, []);
    expect(open).toMatchObject({
      mode: 'cta',
      active: { prayer: 'maghrib', date: D, logged: false },
      next: { prayer: 'isya', date: D, time: T.isya, minutesUntil: T.isya - T.maghrib - 3, tomorrow: false }
    });
    const done = skyCard(now, JKT, [log(D, 'maghrib')]);
    expect(done).toMatchObject({ mode: 'countdown', active: { prayer: 'maghrib', logged: true } });
  });

  it('Terbit–Dzuhur: tanpa sholat aktif, hitung mundur ke Dzuhur', () => {
    const card = skyCard(wib(D, hm(9)), JKT, []);
    expect(card).toMatchObject({
      mode: 'countdown',
      active: null,
      next: { prayer: 'dzuhur', minutesUntil: T.dzuhur - hm(9) }
    });
  });

  it('01.00, Isya kemarin belum dicatat → cta untuk Isya kemarin; Subuh tanpa "besok"', () => {
    const now = wib(D, hm(1));
    expect(skyCard(now, JKT, [])).toMatchObject({
      mode: 'cta',
      active: { prayer: 'isya', date: PREV, logged: false },
      next: { prayer: 'subuh', date: D, tomorrow: false, minutesUntil: T.subuh - hm(1) }
    });
    expect(skyCard(now, JKT, [log(D, 'isya')]).mode).toBe('cta');
    expect(skyCard(now, JKT, [log(PREV, 'isya')])).toMatchObject({
      mode: 'countdown',
      active: { prayer: 'isya', date: PREV, logged: true }
    });
  });

  it('20.00 setelah Isya dicatat → Subuh besok', () => {
    expect(skyCard(wib(D, hm(20)), JKT, [log(D, 'isya')])).toMatchObject({
      mode: 'countdown',
      active: { prayer: 'isya', date: D, logged: true },
      next: { prayer: 'subuh', date: NEXT, tomorrow: true }
    });
  });
});

describe('skyCard: hitung mundur beresolusi menit (detik dibuang)', () => {
  it('satu menit sebelum Dzuhur: 1 m di detik 00 dan 59; tepat Dzuhur → cta', () => {
    expect(skyCard(wib(D, T.dzuhur - 1, 0), JKT, []).next).toMatchObject({
      prayer: 'dzuhur',
      minutesUntil: 1
    });
    expect(skyCard(wib(D, T.dzuhur - 1, 59), JKT, []).next).toMatchObject({
      prayer: 'dzuhur',
      minutesUntil: 1
    });
    const atStart = skyCard(wib(D, T.dzuhur, 0), JKT, []);
    expect(atStart).toMatchObject({ mode: 'cta', active: { prayer: 'dzuhur', date: D } });
    expect(atStart.next.prayer).toBe('ashar');
  });

  it('pergantian jam: 60 → 59 menit tepat di pergantian menit', () => {
    expect(skyCard(wib(D, T.dzuhur - 60, 59), JKT, []).next.minutesUntil).toBe(60);
    expect(skyCard(wib(D, T.dzuhur - 59, 0), JKT, []).next.minutesUntil).toBe(59);
  });
});

describe('skyCard: badan langit dan jam', () => {
  it('matahari siang, bulan Isya–Subuh; nowMinutes di zona lokasi', () => {
    expect(skyCard(wib(D, hm(12)), JKT, [])).toMatchObject({ body: 'sun', nowMinutes: hm(12) });
    expect(skyCard(wib(D, hm(20)), JKT, []).body).toBe('moon');
    expect(skyCard(wib(D, hm(1)), JKT, []).body).toBe('moon');
  });
});

describe('skyTone', () => {
  it('fajar = [Subuh, Ashar) ∪ [Isya, Subuh); senja = [Ashar, Isya)', () => {
    expect(skyTone(wib(D, T.subuh - 1), JKT)).toBe('fajar');
    expect(skyTone(wib(D, T.subuh), JKT)).toBe('fajar');
    expect(skyTone(wib(D, T.ashar - 1), JKT)).toBe('fajar');
    expect(skyTone(wib(D, T.ashar), JKT)).toBe('senja');
    expect(skyTone(wib(D, T.isya - 1), JKT)).toBe('senja');
    expect(skyTone(wib(D, T.isya), JKT)).toBe('fajar');
    expect(skyTone(wib(D, hm(1)), JKT)).toBe('fajar');
    expect(skyCard(wib(D, T.maghrib), JKT, []).tone).toBe('senja');
  });
});

describe('lengkung', () => {
  it('arcFraction dijepit 0.02/0.98 dan monoton antara Subuh–Isya', () => {
    expect(arcFraction(hm(1), T)).toBe(0.02);
    expect(arcFraction(T.subuh, T)).toBe(0.02);
    expect(arcFraction(T.isya, T)).toBe(0.98);
    expect(arcFraction(hm(23), T)).toBe(0.98);
    const samples = [T.subuh + 30, T.dzuhur, T.ashar, T.maghrib, T.isya - 30].map((m) => arcFraction(m, T));
    expect([...samples].sort((a, b) => a - b)).toEqual(samples);
    expect(new Set(samples).size).toBe(samples.length);
  });

  it('skyCard: penanda dan titik sholat memakai jadwal hari ini', () => {
    const card = skyCard(wib(D, T.dzuhur), JKT, []);
    expect(card.arc.marker).toBe(arcFraction(T.dzuhur, T));
    expect(card.arc.dots).toEqual({
      subuh: 0.02,
      dzuhur: arcFraction(T.dzuhur, T),
      ashar: arcFraction(T.ashar, T),
      maghrib: arcFraction(T.maghrib, T),
      isya: 0.98
    });
    expect(skyCard(wib(D, hm(1)), JKT, []).arc.marker).toBe(0.02);
  });

  it('arcPoint: ujung (8,86)/(342,86), puncak (175,36)', () => {
    expect(arcPoint(0)).toEqual({ x: 8, y: 86 });
    expect(arcPoint(1)).toEqual({ x: 342, y: 86 });
    expect(arcPoint(0.5)).toEqual({ x: 175, y: 36 });
  });
});

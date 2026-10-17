import { describe, expect, it } from 'vitest';
import { CITIES } from '$lib/data/cities';
import { prayerLogId, type PrayerConfig } from './prayer';
import { defaultSettings } from './settings';
import { weeklyPrayerGrid } from './stats';
import type { PrayerLog, PrayerName } from './types';

const c = CITIES.find((x) => x.code === '3173')!;
const JKT: PrayerConfig = {
  location: { mode: 'city', cityId: c.id, label: c.name, lat: c.lat, lng: c.lng, timeZone: c.timeZone },
  prayer: defaultSettings().prayer
};
const log = (date: string, prayer: PrayerName): PrayerLog => ({
  id: prayerLogId(date, prayer),
  date,
  prayer,
  congregation: false,
  at: '2026-10-17T00:00:00.000Z'
});

describe('weeklyPrayerGrid', () => {
  const now = new Date('2026-10-17T13:00:00+07:00'); // setelah Dzuhur, sebelum Ashar

  it('7 hari berakhir hari ini, 5 sholat per hari, total 35', () => {
    const g = weeklyPrayerGrid('2026-10-17', [], now, JKT);
    expect(g.days.map((d) => d.date)).toEqual([
      '2026-10-11',
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17'
    ]);
    expect(g.total).toBe(35);
    expect(g.done).toBe(0);
  });

  it('hari lalu tanpa log = missed; hari ini mengikuti jam', () => {
    const g = weeklyPrayerGrid('2026-10-17', [], now, JKT);
    expect(Object.values(g.days[0].statuses)).toEqual(['missed', 'missed', 'missed', 'missed', 'missed']);
    expect(g.days[6].statuses).toEqual({
      subuh: 'missed',
      dzuhur: 'now',
      ashar: 'upcoming',
      maghrib: 'upcoming',
      isya: 'upcoming'
    });
  });

  it('menghitung log di dalam rentang saja', () => {
    const logs = [log('2026-10-11', 'subuh'), log('2026-10-17', 'dzuhur'), log('2026-10-10', 'isya')];
    const g = weeklyPrayerGrid('2026-10-17', logs, now, JKT);
    expect(g.done).toBe(2);
    expect(g.days[0].statuses.subuh).toBe('done');
    expect(g.days[6].statuses.dzuhur).toBe('done');
  });
});

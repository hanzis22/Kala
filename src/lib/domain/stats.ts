import { addDays } from './dates';
import { prayerStatus, type PrayerConfig } from './prayer';
import { PRAYERS, type LocalDate, type PrayerLog, type PrayerName, type PrayerStatus } from './types';

export interface PrayerGridDay {
  date: LocalDate;
  statuses: Record<PrayerName, PrayerStatus>;
}

export interface WeeklyPrayerGrid {
  /** 7 hari, yang terakhir = endDate (hari ini). */
  days: PrayerGridDay[];
  done: number;
  /** Semua sel (7 × 5), sesuai mockup "x / 35". */
  total: number;
}

/** Grid konsistensi 7 hari terakhir × 5 sholat (PRD §F3.6). Status dihitung, tidak disimpan. */
export function weeklyPrayerGrid(
  endDate: LocalDate,
  logs: readonly PrayerLog[],
  now: Date,
  config: PrayerConfig
): WeeklyPrayerGrid {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(endDate, i - 6);
    return { date, statuses: prayerStatus(date, logs, now, config) };
  });
  const done = days.reduce((n, d) => n + PRAYERS.filter((p) => d.statuses[p] === 'done').length, 0);
  return { days, done, total: days.length * PRAYERS.length };
}

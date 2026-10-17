/** Format tampilan (bahasa Indonesia). Fungsi murni. */
import { dayNumber, fromMinutes } from '$lib/domain/dates';
import type { LocalDate, Minutes } from '$lib/domain/types';

/** 260 → '04.20' (pemisah titik, gaya penulisan jam Indonesia). */
export function formatClock(minutes: Minutes): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return fromMinutes(m).replace(':', '.');
}

const longDate = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'short'
});
const weekdayShort = new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', weekday: 'short' });

const utcNoon = (date: LocalDate) => new Date(dayNumber(date) * 86_400_000 + 12 * 3_600_000);

/** '2026-10-17' → 'Sabtu, 17 Okt' */
export function formatDayDate(date: LocalDate): string {
  return longDate.format(utcNoon(date)).replace(/\.$/, '');
}

/** '2026-10-17' → 'Sab' */
export function formatWeekdayShort(date: LocalDate): string {
  return weekdayShort.format(utcNoon(date)).replace(/\.$/, '');
}

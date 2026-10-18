/**
 * Timetable mingguan (PRD §F4). Fungsi murni: tanggal minggu, rentang jam grid,
 * penempatan sesi kelas, dan validasi input sesi.
 */
import { assignLanes, type WithLane } from './agenda';
import { addDays, dayNumber } from './dates';
import {
  occurrencesBetween,
  validateTimeSlot,
  weekdayOf,
  type Occurrence,
  type RecurrenceInput,
  type SlotError,
  type Weekday
} from './recurrence';
import type { Id, LocalDate, LocalTime } from './types';

/** Rentang jam bawaan grid (PRD §F4.3): 06.00–18.00. Melebar jika ada sesi di luarnya. */
export const DEFAULT_START_HOUR = 6;
export const DEFAULT_END_HOUR = 18;

/** Hari pertama minggu yang memuat `date`. weekStartsOn: 1 = Senin, 0 = Minggu. */
export function weekStart(date: LocalDate, weekStartsOn: 0 | 1): LocalDate {
  // 1970-01-01 = Kamis; (n + 4) % 7 → 0 = Minggu.
  const dow = (((dayNumber(date) + 4) % 7) + 7) % 7;
  const back = (dow - weekStartsOn + 7) % 7;
  return addDays(date, -back);
}

/** 7 tanggal minggu yang memuat `date`, mulai dari hari pertama minggu. */
export function weekDates(date: LocalDate, weekStartsOn: 0 | 1): LocalDate[] {
  const first = weekStart(date, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

/** Hari yang tampil di grid: Senin–Sabtu, plus Minggu jika diaktifkan (PRD §F4.3, §F8.5). */
export function visibleWeekDates(date: LocalDate, weekStartsOn: 0 | 1, showSunday: boolean): LocalDate[] {
  return weekDates(date, weekStartsOn).filter((d) => showSunday || weekdayOf(d) !== 'SU');
}

export interface HourRange {
  startHour: number;
  endHour: number;
}

/** Rentang jam grid: minimal 06–18, melebar ke jam penuh terdekat agar semua sesi terlihat utuh. */
export function hourRange(occurrences: readonly Pick<Occurrence, 'start' | 'end'>[]): HourRange {
  let startHour = DEFAULT_START_HOUR;
  let endHour = DEFAULT_END_HOUR;
  for (const o of occurrences) {
    startHour = Math.min(startHour, Math.floor(o.start / 60));
    endHour = Math.max(endHour, Math.ceil(o.end / 60));
  }
  return { startHour, endHour };
}

export type TimetableBlock = WithLane<Occurrence>;

export interface TimetableDay {
  date: LocalDate;
  weekday: Weekday;
  blocks: TimetableBlock[];
}

export interface WeekTimetable extends HourRange {
  days: TimetableDay[];
}

/**
 * Grid minggu yang memuat `date`. Rutin yang sudah dihapus harus disaring pemanggil (repo).
 * Sesi di hari yang disembunyikan (Minggu) tidak ikut memperlebar rentang jam.
 */
export function buildWeekTimetable(
  routines: readonly RecurrenceInput[],
  date: LocalDate,
  options: { weekStartsOn: 0 | 1; showSunday: boolean }
): WeekTimetable {
  const visible = visibleWeekDates(date, options.weekStartsOn, options.showSunday);
  const from = visible[0];
  const to = visible[visible.length - 1];
  const shown = new Set(visible);

  const byDate = new Map<LocalDate, Occurrence[]>(visible.map((d) => [d, []]));
  for (const routine of routines) {
    for (const occurrence of occurrencesBetween(routine, from, to)) {
      if (shown.has(occurrence.date)) byDate.get(occurrence.date)?.push(occurrence);
    }
  }

  const days = visible.map((d) => ({
    date: d,
    weekday: weekdayOf(d),
    blocks: assignLanes(byDate.get(d) ?? [])
  }));
  return { days, ...hourRange(days.flatMap((d) => d.blocks)) };
}

// ---------- Validasi sesi kelas ----------

export interface ClassSessionInput {
  subjectId: Id | null;
  days: Weekday[];
  startTime: LocalTime;
  durationMin: number;
  location: string | null;
}

export type ClassSessionError = 'subject-required' | 'days-required' | 'location-too-long' | SlotError;

export const MAX_LOCATION_LENGTH = 40;

/** Kesalahan pertama yang ditemukan, atau null jika valid. Teks `location` sudah di-trim pemanggil. */
export function validateClassSession(input: ClassSessionInput): ClassSessionError | null {
  if (!input.subjectId) return 'subject-required';
  if (input.days.length === 0) return 'days-required';
  const slot = validateTimeSlot(input.startTime, input.durationMin);
  if (slot) return slot;
  if (input.location !== null && input.location.length > MAX_LOCATION_LENGTH) return 'location-too-long';
  return null;
}

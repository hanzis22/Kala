/**
 * Rutin umum (PRD §F5, kind 'routine'). Fungsi murni: validasi input form dan opsi bulanan bawaan.
 */
import { dayNumber, isValidLocalDate } from './dates';
import {
  ruleSpecError,
  validateTimeSlot,
  weekdayOf,
  type MonthlyBy,
  type RuleSpec,
  type SlotError
} from './recurrence';
import { MAX_LOCATION_LENGTH } from './timetable';
import type { LocalDate, LocalTime } from './types';

export const MAX_TITLE_LENGTH = 60;

export interface RoutineInput {
  title: string;
  spec: RuleSpec;
  startTime: LocalTime;
  durationMin: number;
  dtstart: LocalDate;
  until: LocalDate | null;
  location: string | null;
}

export type RoutineError =
  | 'title-required'
  | 'title-too-long'
  | 'days-required'
  | 'interval-range'
  | 'monthday-range'
  | SlotError
  | 'location-too-long'
  | 'invalid-dtstart'
  | 'until-before-start';

/** Kesalahan pertama yang ditemukan, atau null jika valid. Judul di-trim di sini; `location` oleh pemanggil. */
export function validateRoutineInput(input: RoutineInput): RoutineError | null {
  const title = input.title.trim();
  if (title === '') return 'title-required';
  if (title.length > MAX_TITLE_LENGTH) return 'title-too-long';
  const rule = ruleSpecError(input.spec);
  if (rule) return rule;
  const slot = validateTimeSlot(input.startTime, input.durationMin);
  if (slot) return slot;
  if (input.location !== null && input.location.length > MAX_LOCATION_LENGTH) return 'location-too-long';
  if (!isValidLocalDate(input.dtstart)) return 'invalid-dtstart';
  if (
    input.until !== null &&
    (!isValidLocalDate(input.until) || dayNumber(input.until) < dayNumber(input.dtstart))
  ) {
    return 'until-before-start';
  }
  return null;
}

export interface MonthlyOptions {
  /** Tanggal yang sama setiap bulan. */
  monthday: MonthlyBy;
  /** Hari yang sama di urutan yang sama, misal Senin ke-3. Tanggal 29–31 menjadi urutan kelima. */
  nth: MonthlyBy;
  /** Hari terakhir bulan (PRD §7.2). */
  last: MonthlyBy;
}

/** Opsi bulanan yang ditawarkan form, diturunkan dari tanggal mulai. */
export function defaultMonthlyOptions(dtstart: LocalDate): MonthlyOptions {
  const day = Number(dtstart.slice(8, 10));
  return {
    monthday: { kind: 'monthday', day },
    nth: { kind: 'nth', nth: Math.ceil(day / 7), weekday: weekdayOf(dtstart) },
    last: { kind: 'monthday', day: -1 }
  };
}

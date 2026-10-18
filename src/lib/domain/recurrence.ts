/**
 * Pengulangan Routine (PRD §F4.2, §F5, §6). Fungsi murni.
 *
 * Tanggal diperlakukan sebagai "floating date": LocalDate → instan UTC tengah malam, dan hasil rrule
 * dibaca kembali dengan getUTC*. Dengan begitu zona waktu dan DST perangkat tidak pernah ikut campur.
 *
 * Urutan aturan per tanggal:
 * 1. Pola: `rrule` (RFC 5545 tanpa DTSTART). `rrule: null` = kegiatan sekali, hanya di `dtstart`.
 * 2. Batas: `dtstart` ≤ tanggal ≤ `until` (keduanya inklusif).
 * 3. `exdates` membuang tanggal (menang atas override).
 * 4. `overrides` mengganti jam/durasi untuk tanggal itu. Override yang membuat slot tidak valid
 *    (mis. melewati 24.00) diabaikan dan jam induk dipakai. Override untuk tanggal yang bukan
 *    kejadian tidak membuat kejadian baru.
 */
import { RRule, type Options, type Weekday as RRuleWeekday } from 'rrule';
import { dayNumber, isValidLocalDate, isValidLocalTime, MINUTES_PER_DAY, toMinutes } from './dates';
import type { Id, LocalDate, LocalTime, Minutes, Routine } from './types';

export type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';
/** Urutan RFC 5545 (Senin = 0), sama dengan indeks hari di rrule. */
export const WEEKDAYS: readonly Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;

export const MIN_DURATION = 5;
export const MAX_DURATION = 720;
/** Batas rentang occurrencesBetween, agar pemanggil tidak sengaja meminta bertahun-tahun. */
export const MAX_RANGE_DAYS = 366;

export type RecurrenceInput = Pick<
  Routine,
  'id' | 'rrule' | 'dtstart' | 'until' | 'exdates' | 'overrides' | 'startTime' | 'durationMin'
>;

export interface Occurrence {
  routineId: Id;
  date: LocalDate;
  startTime: LocalTime;
  durationMin: number;
  /** Menit sejak tengah malam. */
  start: Minutes;
  /** Eksklusif, ≤ 1440. */
  end: Minutes;
  /** true jika jam/durasi berasal dari `overrides`. */
  overridden: boolean;
}

export type SlotError = 'invalid-time' | 'duration-range' | 'past-midnight';

/** Validasi slot berjam (PRD §5 durasi 5–720, §7.3 tidak melewati 24.00). null = valid. */
export function validateTimeSlot(startTime: LocalTime, durationMin: number): SlotError | null {
  if (!isValidLocalTime(startTime)) return 'invalid-time';
  if (!Number.isInteger(durationMin) || durationMin < MIN_DURATION || durationMin > MAX_DURATION) {
    return 'duration-range';
  }
  if (toMinutes(startTime) + durationMin > MINUTES_PER_DAY) return 'past-midnight';
  return null;
}

/** ['WE', 'MO', 'WE'] → 'FREQ=WEEKLY;BYDAY=MO,WE'. Hari diurutkan dan diduplikasi. */
export function weeklyRule(days: readonly Weekday[]): string {
  const unique = WEEKDAYS.filter((d) => days.includes(d));
  if (unique.length === 0) throw new RangeError('Pola mingguan butuh minimal satu hari');
  return `FREQ=WEEKLY;BYDAY=${unique.join(',')}`;
}

/** Hari dalam pola mingguan, urut Senin–Minggu. Pola selain FREQ=WEEKLY atau tanpa BYDAY → []. */
export function weeklyDays(rrule: string): Weekday[] {
  let options: Partial<Options>;
  try {
    options = RRule.parseString(rrule);
  } catch {
    return [];
  }
  if (options.freq !== RRule.WEEKLY || options.byweekday == null) return [];
  const raw = Array.isArray(options.byweekday) ? options.byweekday : [options.byweekday];
  const indexes = new Set(raw.map((d) => (typeof d === 'number' ? d : (d as RRuleWeekday).weekday)));
  return WEEKDAYS.filter((_, i) => indexes.has(i));
}

/** Hari dalam minggu untuk sebuah LocalDate. */
export function weekdayOf(date: LocalDate): Weekday {
  // 1970-01-01 adalah Kamis (indeks 3 dalam urutan Senin = 0).
  const index = (((dayNumber(date) + 3) % 7) + 7) % 7;
  return WEEKDAYS[index];
}

export function occursOn(routine: RecurrenceInput, date: LocalDate): boolean {
  return occurrencesBetween(routine, date, date).length > 0;
}

/** Semua kejadian dalam [from, to] (inklusif), urut tanggal. */
export function occurrencesBetween(routine: RecurrenceInput, from: LocalDate, to: LocalDate): Occurrence[] {
  const fromDay = dayNumber(from);
  const toDay = dayNumber(to);
  if (toDay < fromDay) return [];
  if (toDay - fromDay + 1 > MAX_RANGE_DAYS) {
    throw new RangeError(`Rentang maksimal ${MAX_RANGE_DAYS} hari: ${from}…${to}`);
  }

  const startDay = Math.max(fromDay, dayNumber(routine.dtstart));
  const endDay = routine.until === null ? toDay : Math.min(toDay, dayNumber(routine.until));
  if (endDay < startDay) return [];

  const days =
    routine.rrule === null ? eventDays(routine, startDay, endDay) : ruleDays(routine, startDay, endDay);
  const excluded = new Set(routine.exdates);

  const result: Occurrence[] = [];
  for (const day of days) {
    const date = fromDayNumber(day);
    if (excluded.has(date)) continue;
    result.push(toOccurrence(routine, date));
  }
  return result;
}

// ---------- internal ----------

const DAY_MS = 86_400_000;

function fromDayNumber(day: number): LocalDate {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

function eventDays(routine: RecurrenceInput, startDay: number, endDay: number): number[] {
  const day = dayNumber(routine.dtstart);
  return day >= startDay && day <= endDay ? [day] : [];
}

function ruleDays(routine: RecurrenceInput, startDay: number, endDay: number): number[] {
  const rule = buildRule(routine);
  const after = new Date(startDay * DAY_MS);
  const before = new Date(endDay * DAY_MS);
  return rule.between(after, before, true).map((d) => Math.floor(d.getTime() / DAY_MS));
}

const ruleCache = new Map<string, RRule>();

function buildRule(routine: RecurrenceInput): RRule {
  const key = `${routine.rrule}|${routine.dtstart}|${routine.until ?? ''}`;
  const cached = ruleCache.get(key);
  if (cached) return cached;

  const rrule = routine.rrule ?? '';
  if (/DTSTART|UNTIL/i.test(rrule)) {
    throw new RangeError(`RRULE tidak boleh memuat DTSTART/UNTIL (pakai field dtstart/until): ${rrule}`);
  }
  const options = RRule.parseString(rrule);
  const rule = new RRule({
    ...options,
    dtstart: new Date(dayNumber(routine.dtstart) * DAY_MS),
    // until dari field Routine, inklusif sepanjang hari itu.
    until: routine.until === null ? null : new Date(dayNumber(routine.until) * DAY_MS + DAY_MS - 1),
    tzid: null
  });

  if (ruleCache.size > 500) ruleCache.clear();
  ruleCache.set(key, rule);
  return rule;
}

function toOccurrence(routine: RecurrenceInput, date: LocalDate): Occurrence {
  const override = routine.overrides[date];
  let startTime = routine.startTime;
  let durationMin = routine.durationMin;
  let overridden = false;

  if (override) {
    const candidateStart = override.startTime ?? startTime;
    const candidateDuration = override.durationMin ?? durationMin;
    if (validateTimeSlot(candidateStart, candidateDuration) === null) {
      startTime = candidateStart;
      durationMin = candidateDuration;
      overridden = true;
    }
  }

  const start = toMinutes(startTime);
  return { routineId: routine.id, date, startTime, durationMin, start, end: start + durationMin, overridden };
}

/** Untuk validasi input di luar domain (repo, form). */
export function isValidDateRange(dtstart: LocalDate, until: LocalDate | null): boolean {
  if (!isValidLocalDate(dtstart)) return false;
  if (until === null) return true;
  return isValidLocalDate(until) && dayNumber(until) >= dayNumber(dtstart);
}

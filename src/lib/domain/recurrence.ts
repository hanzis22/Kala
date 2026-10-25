/**
 * Pengulangan Routine (PRD §F4.2, §F5, §6). Fungsi murni.
 *
 * Tanggal diperlakukan sebagai "floating date": LocalDate → instan UTC tengah malam, dan hasil rrule
 * dibaca kembali dengan getUTC*. Dengan begitu zona waktu dan DST perangkat tidak pernah ikut campur.
 *
 * Urutan aturan per tanggal:
 * 1. Pola: `rrule` (subset RFC 5545 tanpa DTSTART, lihat `parseRule`). `rrule: null` = kegiatan sekali,
 *    hanya di `dtstart`. Pola di luar subset membuat occurrencesBetween melempar RangeError.
 * 2. Batas: `dtstart` ≤ tanggal ≤ `until` (keduanya inklusif).
 * 3. `exdates` membuang tanggal (menang atas override).
 * 4. `overrides` mengganti jam/durasi untuk tanggal itu. Override yang membuat slot tidak valid
 *    (mis. melewati 24.00) diabaikan dan jam induk dipakai. Override untuk tanggal yang bukan
 *    kejadian tidak membuat kejadian baru.
 */
import { RRule, type Options } from 'rrule';
import { copy } from '../copy';
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

// ---------- Pola (subset RRULE yang didukung Kala) ----------

/** Opsi bulanan: tanggal X (1–31, atau -1 = hari terakhir bulan) atau hari ke-N (1–5, atau -1 = terakhir). */
export type MonthlyBy = { kind: 'monthday'; day: number } | { kind: 'nth'; nth: number; weekday: Weekday };

/**
 * Bentuk terstruktur subset RRULE yang didukung (union tertutup). `interval` 1–99.
 * Di luar bentuk ini rutin dianggap tidak didukung: tampil read-only dan tidak pernah dihitung.
 */
export type RuleSpec =
  | { freq: 'daily'; interval: number }
  | { freq: 'weekly'; interval: number; days: Weekday[] }
  | { freq: 'monthly'; interval: number; by: MonthlyBy };

export const MAX_INTERVAL = 99;

export type RuleSpecError = 'interval-range' | 'days-required' | 'monthday-range';

/** Kesalahan pertama pada sebuah RuleSpec, atau null jika valid. */
export function ruleSpecError(spec: RuleSpec): RuleSpecError | null {
  if (!Number.isInteger(spec.interval) || spec.interval < 1 || spec.interval > MAX_INTERVAL) {
    return 'interval-range';
  }
  if (spec.freq === 'weekly' && !spec.days.some((d) => WEEKDAYS.includes(d))) return 'days-required';
  if (spec.freq === 'monthly') {
    const by = spec.by;
    const valid =
      by.kind === 'monthday'
        ? Number.isInteger(by.day) && (by.day === -1 || (by.day >= 1 && by.day <= 31))
        : Number.isInteger(by.nth) &&
          (by.nth === -1 || (by.nth >= 1 && by.nth <= 5)) &&
          WEEKDAYS.includes(by.weekday);
    if (!valid) return 'monthday-range';
  }
  return null;
}

/**
 * RuleSpec → string RRULE kanonik: FREQ, INTERVAL (hanya jika > 1, agar rrule kelas lama tetap sama
 * persis), lalu BYDAY/BYMONTHDAY. Hari mingguan urut Senin–Minggu tanpa duplikat; ordinal ditulis
 * +2MO / -1FR. Spec tidak valid → RangeError.
 */
export function buildRule(spec: RuleSpec): string {
  const error = ruleSpecError(spec);
  if (error) throw new RangeError(`Pola tidak valid (${error}): ${JSON.stringify(spec)}`);
  const parts = [`FREQ=${spec.freq.toUpperCase()}`];
  if (spec.interval > 1) parts.push(`INTERVAL=${spec.interval}`);
  if (spec.freq === 'weekly') {
    parts.push(`BYDAY=${WEEKDAYS.filter((d) => spec.days.includes(d)).join(',')}`);
  } else if (spec.freq === 'monthly') {
    const by = spec.by;
    if (by.kind === 'monthday') parts.push(`BYMONTHDAY=${by.day}`);
    else parts.push(`BYDAY=${by.nth > 0 ? '+' : ''}${by.nth}${by.weekday}`);
  }
  return parts.join(';');
}

const ALLOWED_KEYS = new Set(['FREQ', 'INTERVAL', 'BYDAY', 'BYMONTHDAY']);
const NTH_DAY_RE = /^([+-]?)(\d)(MO|TU|WE|TH|FR|SA|SU)$/;

/**
 * String RRULE → RuleSpec, atau null jika di luar subset. Tokenizer sendiri dengan allowlist kunci
 * (FREQ, INTERVAL, BYDAY, BYMONTHDAY): kunci ganda, kunci lain (COUNT, UNTIL, BYSETPOS, WKST, …),
 * dan nilai di luar batas ditolak. Sengaja tidak memakai RRule.parseString, yang menerima jauh lebih banyak.
 */
export function parseRule(rrule: string): RuleSpec | null {
  const fields = new Map<string, string>();
  for (const part of rrule.split(';')) {
    const pieces = part.split('=');
    if (pieces.length !== 2) return null;
    const [key, value] = pieces;
    if (!ALLOWED_KEYS.has(key) || fields.has(key) || value === '') return null;
    fields.set(key, value);
  }

  const intervalRaw = fields.get('INTERVAL') ?? '1';
  if (!/^\d{1,2}$/.test(intervalRaw)) return null;
  const interval = Number(intervalRaw);
  if (interval < 1 || interval > MAX_INTERVAL) return null;

  const byday = fields.get('BYDAY');
  const bymonthday = fields.get('BYMONTHDAY');

  switch (fields.get('FREQ')) {
    case 'DAILY':
      if (byday !== undefined || bymonthday !== undefined) return null;
      return { freq: 'daily', interval };
    case 'WEEKLY': {
      if (byday === undefined || bymonthday !== undefined) return null;
      const tokens = byday.split(',');
      if (!tokens.every((t) => (WEEKDAYS as readonly string[]).includes(t))) return null;
      return { freq: 'weekly', interval, days: WEEKDAYS.filter((d) => tokens.includes(d)) };
    }
    case 'MONTHLY': {
      if ((byday === undefined) === (bymonthday === undefined)) return null;
      if (bymonthday !== undefined) {
        if (!/^-?\d{1,2}$/.test(bymonthday)) return null;
        const day = Number(bymonthday);
        if (day !== -1 && (day < 1 || day > 31)) return null;
        return { freq: 'monthly', interval, by: { kind: 'monthday', day } };
      }
      const match = NTH_DAY_RE.exec(byday ?? '');
      if (!match) return null;
      const [, sign, digit, weekday] = match;
      const nth = Number(digit) * (sign === '-' ? -1 : 1);
      if (nth !== -1 && (nth < 1 || nth > 5)) return null;
      return { freq: 'monthly', interval, by: { kind: 'nth', nth, weekday: weekday as Weekday } };
    }
    default:
      return null;
  }
}

/** true jika Kala bisa menghitung rutin ini: kegiatan sekali, atau pola di dalam subset. */
export function isSupportedRoutine(routine: Pick<Routine, 'rrule'>): boolean {
  return routine.rrule === null || parseRule(routine.rrule) !== null;
}

/** Kalimat pola untuk UI, misal "Setiap 2 minggu, Senin & Rabu". */
export function describeRule(spec: RuleSpec): string {
  const t = copy.recurrence;
  if (spec.freq === 'daily') return t.daily(spec.interval);
  if (spec.freq === 'weekly') {
    return `${t.weekly(spec.interval)}, ${t.joinList(spec.days.map((d) => copy.weekdays.long[d]))}`;
  }
  const by = spec.by;
  let detail: string;
  if (by.kind === 'monthday') detail = by.day === -1 ? t.lastDay : t.monthday(by.day);
  else detail = t.nthWeekday(copy.weekdays.long[by.weekday], t.ordinal(by.nth));
  return `${t.monthly(spec.interval)}, ${detail}`;
}

/** ['WE', 'MO', 'WE'] → 'FREQ=WEEKLY;BYDAY=MO,WE'. Hari diurutkan dan diduplikasi. */
export function weeklyRule(days: readonly Weekday[]): string {
  return buildRule({ freq: 'weekly', interval: 1, days: [...days] });
}

/** Hari dalam pola mingguan, urut Senin–Minggu. Pola selain mingguan yang didukung → []. */
export function weeklyDays(rrule: string): Weekday[] {
  const spec = parseRule(rrule);
  return spec?.freq === 'weekly' ? spec.days : [];
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
  const rule = compileRule(routine);
  const after = new Date(startDay * DAY_MS);
  const before = new Date(endDay * DAY_MS);
  return rule.between(after, before, true).map((d) => Math.floor(d.getTime() / DAY_MS));
}

const ruleCache = new Map<string, RRule>();

const RRULE_WEEKDAYS = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];
const rruleWeekday = (d: Weekday) => RRULE_WEEKDAYS[WEEKDAYS.indexOf(d)];
const RRULE_FREQ = { daily: RRule.DAILY, weekly: RRule.WEEKLY, monthly: RRule.MONTHLY } as const;

/** Opsi RRule disusun dari RuleSpec, bukan dari string mentah. Pola di luar subset → RangeError. */
function compileRule(routine: RecurrenceInput): RRule {
  const key = `${routine.rrule}|${routine.dtstart}|${routine.until ?? ''}`;
  const cached = ruleCache.get(key);
  if (cached) return cached;

  const spec = parseRule(routine.rrule ?? '');
  if (spec === null) throw new RangeError(`Pola RRULE tidak didukung: ${routine.rrule}`);

  const options: Partial<Options> = { freq: RRULE_FREQ[spec.freq], interval: spec.interval, wkst: RRule.MO };
  if (spec.freq === 'weekly') options.byweekday = spec.days.map(rruleWeekday);
  if (spec.freq === 'monthly') {
    if (spec.by.kind === 'monthday') options.bymonthday = [spec.by.day];
    else options.byweekday = [rruleWeekday(spec.by.weekday).nth(spec.by.nth)];
  }

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

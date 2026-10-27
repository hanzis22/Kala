/**
 * Tugas (PRD §F6). Normalisasi, validasi, filter, urutan, status "lewat tenggat", grup "Belum selesai
 * sebelumnya", dan aturan bersihkan. Fungsi murni: "sekarang" selalu masuk sebagai argumen.
 * Status turunan tidak disimpan dan tidak pernah merah.
 */
import { addDays, isValidLocalDate, isValidLocalTime, toMinutes } from './dates';
import { validateTimeSlot, type SlotError } from './recurrence';
import { weekStart } from './timetable';
import type { Id, IsoDateTime, LocalDate, LocalTime, Minutes, Priority, Task, TaskType } from './types';

export const TASK_TYPES: readonly TaskType[] = ['pr', 'tugas', 'ujian', 'proyek', 'lainnya'];
/** Urutan = urutan sort. */
export const PRIORITIES: readonly Priority[] = ['high', 'medium', 'low'];
export const MAX_TASK_TITLE = 100;
export const MAX_TASK_NOTES = 1000;
/** Default saat "Jadwalkan pengerjaan" diaktifkan (tanggal = hari ini), sama dengan rutin F5. */
export const DEFAULT_SCHEDULE = { startTime: '16:00', durationMin: 60 } as const;
/** "Bersihkan yang selesai": tugas selesai lebih dari 7 × 24 jam lalu (PRD §F6.5). */
export const CLEAR_AFTER_MS = 7 * 86_400_000;

export interface TaskInput {
  title: string;
  notes: string | null;
  type: TaskType;
  subjectId: Id | null;
  dueDate: LocalDate | null;
  dueTime: LocalTime | null;
  scheduledDate: LocalDate | null;
  startTime: LocalTime | null;
  durationMin: number | null;
  priority: Priority;
}

export type TaskError =
  | 'title-required'
  | 'title-too-long'
  | 'notes-too-long'
  | 'invalid-type'
  | 'invalid-priority'
  | 'invalid-due-date'
  | 'invalid-due-time'
  | 'due-time-without-date'
  | 'schedule-incomplete'
  | 'invalid-scheduled-date'
  | SlotError;

/**
 * Judul di-trim dan spasi berlebih dirapikan; catatan hanya di-trim di kedua ujung (baris baru
 * dipertahankan). Teks opsional, tanggal, dan jam yang kosong menjadi null.
 */
export function normalizeTaskInput(input: TaskInput): TaskInput {
  const optional = (value: string | null) => (value ?? '').trim() || null;
  return {
    ...input,
    title: input.title.trim().replace(/\s+/g, ' '),
    notes: optional(input.notes),
    dueDate: optional(input.dueDate),
    dueTime: optional(input.dueTime),
    scheduledDate: optional(input.scheduledDate),
    startTime: optional(input.startTime)
  };
}

/**
 * Kesalahan pertama yang ditemukan, atau null jika valid. Input sudah dinormalisasi. Panjang teks
 * dihitung dalam UTF-16 code unit (`.length`), sama dengan `maxlength`. `subjectId` diperiksa repo.
 */
export function validateTaskInput(input: TaskInput): TaskError | null {
  if (input.title.length === 0) return 'title-required';
  if (input.title.length > MAX_TASK_TITLE) return 'title-too-long';
  if ((input.notes?.length ?? 0) > MAX_TASK_NOTES) return 'notes-too-long';
  if (!TASK_TYPES.includes(input.type)) return 'invalid-type';
  if (!PRIORITIES.includes(input.priority)) return 'invalid-priority';

  if (input.dueTime !== null && input.dueDate === null) return 'due-time-without-date';
  if (input.dueDate !== null && !isValidLocalDate(input.dueDate)) return 'invalid-due-date';
  if (input.dueTime !== null && !isValidLocalTime(input.dueTime)) return 'invalid-due-time';

  // Jadwal pengerjaan: lengkap (tanggal + jam + durasi) atau kosong semua.
  const { scheduledDate, startTime, durationMin } = input;
  if (scheduledDate === null && startTime === null && durationMin === null) return null;
  if (scheduledDate === null || startTime === null || durationMin === null) return 'schedule-incomplete';
  if (!isValidLocalDate(scheduledDate)) return 'invalid-scheduled-date';
  return validateTimeSlot(startTime, durationMin);
}

// Data rusak (misal dari impor) diperlakukan sebagai kosong, tidak pernah melempar.
const safeDate = (value: LocalDate | null): LocalDate | null =>
  value !== null && isValidLocalDate(value) ? value : null;
const safeMinutes = (value: LocalTime | null): Minutes | null =>
  value !== null && isValidLocalTime(value) ? toMinutes(value) : null;

/**
 * Lewat tenggat: belum selesai dan tenggatnya sudah lewat. Tenggat tanpa jam = sampai akhir hari;
 * tenggat 10.00 belum lewat pada 10.00, sudah lewat pada 10.01. `today` dan `nowMin` = tanggal dan
 * menit lokal sekarang dari store today/now.
 */
export function isOverdue(task: Task, today: LocalDate, nowMin: Minutes): boolean {
  if (task.status === 'done') return false;
  const due = safeDate(task.dueDate);
  if (due === null || due > today) return false;
  if (due < today) return true;
  const dueMin = safeMinutes(task.dueTime);
  return dueMin !== null && nowMin > dueMin;
}

/** Urut naik; null diletakkan setelah semua nilai. */
function compareNullable<T extends string | number>(a: T | null, b: T | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -1 : 1;
}

const priorityRank = (priority: Priority) => {
  const rank = PRIORITIES.indexOf(priority);
  return rank === -1 ? PRIORITIES.length : rank;
};

/**
 * Urutan Semua / Hari ini / Minggu ini (total order): bertenggat dulu, tenggat terdekat, jam tenggat
 * (tanpa jam = akhir hari, jadi di belakang), prioritas, jadwal pengerjaan lebih awal (tanpa jadwal
 * di belakang), dibuat lebih dulu, lalu id.
 */
export function compareTasks(a: Task, b: Task): number {
  return (
    compareNullable(safeDate(a.dueDate), safeDate(b.dueDate)) ||
    compareNullable(safeMinutes(a.dueTime), safeMinutes(b.dueTime)) ||
    priorityRank(a.priority) - priorityRank(b.priority) ||
    compareNullable(safeDate(a.scheduledDate), safeDate(b.scheduledDate)) ||
    compareNullable(safeMinutes(a.startTime), safeMinutes(b.startTime)) ||
    compareNullable(a.createdAt, b.createdAt) ||
    compareNullable(a.id, b.id)
  );
}

/** Urutan Selesai: selesai terbaru di atas, tanpa `completedAt` paling bawah, lalu id turun. */
function compareDone(a: Task, b: Task): number {
  if (a.completedAt !== b.completedAt) {
    if (a.completedAt === null) return 1;
    if (b.completedAt === null) return -1;
    return a.completedAt < b.completedAt ? 1 : -1;
  }
  return compareNullable(b.id, a.id);
}

export type TaskFilter = 'all' | 'today' | 'week' | 'done';

export interface TaskFilterContext {
  today: LocalDate;
  nowMin: Minutes;
  weekStartsOn: 0 | 1;
}

/**
 * Isi filter, sudah terurut. Semua / Hari ini / Minggu ini hanya tugas belum selesai (lewat tenggat
 * ikut di Hari ini dan Minggu ini); Selesai hanya tugas selesai. Hari ini = grup utama lalu
 * "Belum selesai sebelumnya". Minggu ini mengikuti `weekStartsOn`.
 */
export function filterTasks(tasks: readonly Task[], filter: TaskFilter, ctx: TaskFilterContext): Task[] {
  const live = tasks.filter((t) => t.deletedAt === null);
  switch (filter) {
    case 'all':
      return live.filter((t) => t.status === 'todo').sort(compareTasks);
    case 'today': {
      const groups = todayGroups(live, ctx);
      return [...groups.main, ...groups.carriedOver];
    }
    case 'week': {
      const first = weekStart(ctx.today, ctx.weekStartsOn);
      const last = addDays(first, 6);
      const inWeek = (date: LocalDate | null) => {
        const d = safeDate(date);
        return d !== null && d >= first && d <= last;
      };
      return live
        .filter(
          (t) =>
            t.status === 'todo' &&
            (inWeek(t.dueDate) || inWeek(t.scheduledDate) || isOverdue(t, ctx.today, ctx.nowMin))
        )
        .sort(compareTasks);
    }
    case 'done':
      return live.filter((t) => t.status === 'done').sort(compareDone);
  }
}

/**
 * "Belum selesai sebelumnya": belum selesai, dijadwalkan sebelum hari ini, dan tenggatnya kosong atau
 * setelah hari ini. Tanpa `nowMin`: lewat tenggat yang bergantung jam hanya mungkin untuk tenggat hari
 * ini, dan itu sudah dikecualikan.
 */
export function isCarriedOver(task: Task, today: LocalDate): boolean {
  if (task.status !== 'todo') return false;
  const scheduled = safeDate(task.scheduledDate);
  if (scheduled === null || scheduled >= today) return false;
  const due = safeDate(task.dueDate);
  return due === null || due > today;
}

/** Urutan "Belum selesai sebelumnya": tanggal jadwal, jam mulai, lalu `compareTasks`. */
export function compareCarriedOver(a: Task, b: Task): number {
  return (
    compareNullable(safeDate(a.scheduledDate), safeDate(b.scheduledDate)) ||
    compareNullable(safeMinutes(a.startTime), safeMinutes(b.startTime)) ||
    compareTasks(a, b)
  );
}

export interface TodayGroups {
  main: Task[];
  carriedOver: Task[];
}

/**
 * Filter Hari ini dalam dua grup yang tidak pernah beririsan. `main`: bertenggat hari ini,
 * dijadwalkan hari ini, atau lewat tenggat. `carriedOver`: `isCarriedOver`.
 */
export function todayGroups(tasks: readonly Task[], ctx: TaskFilterContext): TodayGroups {
  const live = tasks.filter((t) => t.deletedAt === null);
  const { today, nowMin } = ctx;
  const main = live
    .filter(
      (t) =>
        t.status === 'todo' &&
        (safeDate(t.dueDate) === today || safeDate(t.scheduledDate) === today || isOverdue(t, today, nowMin))
    )
    .sort(compareTasks);
  const carriedOver = live.filter((t) => isCarriedOver(t, today)).sort(compareCarriedOver);
  return { main, carriedOver };
}

/**
 * Ikut dibersihkan: selesai lebih dari 7 × 24 jam sebelum instan `now` (batas eksklusif). Selisih
 * instan, jadi tidak bergantung zona perangkat atau DST. `completedAt` kosong/rusak → false.
 */
export function isClearable(task: Task, now: IsoDateTime): boolean {
  if (task.deletedAt !== null || task.status !== 'done' || task.completedAt === null) return false;
  return Date.parse(now) - Date.parse(task.completedAt) > CLEAR_AFTER_MS;
}

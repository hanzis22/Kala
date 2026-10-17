/**
 * Database lokal Kala (IndexedDB via Dexie).
 * Semua tabel Fase 1–3 sudah ada di versi 1 supaya tidak perlu migrasi saat fitur ditambah.
 * Menambah index atau tabel baru = naikkan versi: this.version(2).stores({...}).upgrade(...)
 * dan tulis test migrasinya. Jangan pernah mengubah definisi versi yang sudah dirilis.
 */
import Dexie, { type EntityTable } from 'dexie';
import type {
  Completion,
  Countdown,
  DayEntry,
  FocusSession,
  Habit,
  HabitLog,
  PrayerLog,
  Routine,
  Settings,
  Subject,
  Task,
  TilawahLog
} from '$lib/domain/types';

export class KalaDB extends Dexie {
  settings!: EntityTable<Settings, 'key'>;
  subjects!: EntityTable<Subject, 'id'>;
  routines!: EntityTable<Routine, 'id'>;
  tasks!: EntityTable<Task, 'id'>;
  completions!: EntityTable<Completion, 'id'>;
  prayerLogs!: EntityTable<PrayerLog, 'id'>;
  dayEntries!: EntityTable<DayEntry, 'date'>;
  habits!: EntityTable<Habit, 'id'>;
  habitLogs!: EntityTable<HabitLog, 'id'>;
  tilawahLogs!: EntityTable<TilawahLog, 'date'>;
  countdowns!: EntityTable<Countdown, 'id'>;
  focusSessions!: EntityTable<FocusSession, 'id'>;

  constructor() {
    super('kala');
    this.version(1).stores({
      settings: 'key',
      subjects: 'id, updatedAt',
      routines: 'id, kind, subjectId, dtstart, updatedAt',
      tasks: 'id, status, dueDate, scheduledDate, subjectId, updatedAt',
      completions: 'id, routineId, date',
      prayerLogs: 'id, date',
      dayEntries: 'date',
      habits: 'id, updatedAt',
      habitLogs: 'id, habitId, date',
      tilawahLogs: 'date',
      countdowns: 'id, date',
      focusSessions: 'id, taskId, startedAt'
    });
  }
}

export const db = new KalaDB();

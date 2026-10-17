/**
 * Model data Kala. Sumber kebenaran untuk tipe di seluruh app.
 * Penjelasan aturan dan alasannya: docs/PRD.md §5.
 *
 * Aturan:
 * - Tanggal kalender = LocalDate 'YYYY-MM-DD', jam = LocalTime 'HH:mm'. Jangan simpan Date untuk keduanya.
 * - ID = ULID (ulidx), kecuali entitas dengan ID deterministik (Completion, PrayerLog, HabitLog).
 * - Soft delete lewat deletedAt; query default menyaring deletedAt === null.
 */

// ---------- Primitif ----------

/** 'YYYY-MM-DD' dalam waktu lokal. */
export type LocalDate = string;
/** 'HH:mm' 24 jam dalam waktu lokal. */
export type LocalTime = string;
/** ISO 8601 lengkap, misal '2026-10-17T10:40:00.000Z'. */
export type IsoDateTime = string;
/** Menit sejak tengah malam, 0–1439. Dipakai untuk semua hitungan jam di domain. */
export type Minutes = number;
/** ULID string. */
export type Id = string;

export interface Timestamps {
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  /** null = aktif. Diisi saat dihapus (soft delete). */
  deletedAt: IsoDateTime | null;
}

// ---------- Pengaturan ----------

export type ThemePreference = 'system' | 'light' | 'dark' | 'prayer';
export type PrayerName = 'subuh' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya';
export const PRAYERS: readonly PrayerName[] = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'] as const;

export interface Location {
  mode: 'gps' | 'city';
  /** Diisi jika mode = 'city'. Mengacu ke daftar kota offline. */
  cityId: string | null;
  label: string;
  lat: number;
  lng: number;
  /** IANA, misal 'Asia/Jakarta'. Dipakai untuk hitungan sholat. */
  timeZone: string;
}

export interface PrayerSettings {
  /** Fase 1 hanya 'kemenag': Subuh 20°, Isya 18°, Ashar Syafi'i. */
  method: 'kemenag';
  /** Menit pengaman yang ditambahkan ke semua waktu, 0–5. Default 2. */
  ihtiyatMin: number;
  /** Koreksi manual per waktu, −10 s.d. +10 menit. */
  adjustMin: Record<PrayerName, number>;
}

export interface Settings {
  key: 'app';
  schemaVersion: number;
  userName: string;
  location: Location | null;
  prayer: PrayerSettings;
  /** Penyesuaian tanggal Hijriah, −2 s.d. +2. */
  hijriOffsetDays: number;
  theme: ThemePreference;
  /** 1 = Senin. */
  weekStartsOn: 0 | 1;
  showSundayInTimetable: boolean;
  onboardedAt: IsoDateTime | null;
  installPromptDismissedAt: IsoDateTime | null;
  /** Untuk pengingat backup setiap 14 hari (PRD §F9.5). */
  lastExportAt: IsoDateTime | null;
  backupReminder: boolean;
}

// ---------- Belajar & jadwal ----------

export interface Subject extends Timestamps {
  id: Id;
  name: string;
  teacher: string | null;
  room: string | null;
}

/**
 * Semua blok berjam memakai entitas ini:
 * - 'class'   : sesi pelajaran (wajib subjectId, rrule mingguan)
 * - 'routine' : kegiatan berulang (les, olahraga, murajaah)
 * - 'event'   : kegiatan sekali (rrule = null, hanya terjadi di dtstart)
 */
export type RoutineKind = 'class' | 'routine' | 'event';

export interface RoutineOverride {
  startTime?: LocalTime;
  durationMin?: number;
}

export interface Routine extends Timestamps {
  id: Id;
  kind: RoutineKind;
  title: string;
  subjectId: Id | null;
  startTime: LocalTime;
  /** 5–720. startTime + durationMin tidak boleh melewati 24.00. */
  durationMin: number;
  /** RRULE RFC 5545 tanpa DTSTART, misal 'FREQ=WEEKLY;BYDAY=MO,WE'. null untuk 'event'. */
  rrule: string | null;
  dtstart: LocalDate;
  until: LocalDate | null;
  /** Tanggal yang dilewati. */
  exdates: LocalDate[];
  /** Perubahan khusus satu tanggal. */
  overrides: Record<LocalDate, RoutineOverride>;
  location: string | null;
}

export type TaskType = 'pr' | 'tugas' | 'ujian' | 'proyek' | 'lainnya';
export type Priority = 'low' | 'medium' | 'high';
export type Quadrant = 'q1' | 'q2' | 'q3' | 'q4';

export interface Task extends Timestamps {
  id: Id;
  title: string;
  notes: string | null;
  type: TaskType;
  subjectId: Id | null;
  /** Tenggat: kapan harus selesai. */
  dueDate: LocalDate | null;
  dueTime: LocalTime | null;
  /** Jadwal pengerjaan: kapan dikerjakan. Hanya ini yang membuat tugas muncul sebagai blok di agenda. */
  scheduledDate: LocalDate | null;
  startTime: LocalTime | null;
  durationMin: number | null;
  priority: Priority;
  /** Fase 2 (tampilan Matrix). */
  quadrant: Quadrant | null;
  status: 'todo' | 'done';
  completedAt: IsoDateTime | null;
}

/** Penanda selesai untuk satu kejadian Routine pada satu tanggal. id = `${routineId}:${date}`. */
export interface Completion {
  id: string;
  routineId: Id;
  date: LocalDate;
  at: IsoDateTime;
}

// ---------- Ibadah ----------

/** id = `${date}:${prayer}`. Upsert, tidak pernah duplikat. */
export interface PrayerLog {
  id: string;
  date: LocalDate;
  prayer: PrayerName;
  congregation: boolean;
  at: IsoDateTime;
}

/** Fase 2. Kunci = date. */
export interface TilawahLog {
  date: LocalDate;
  pages: number;
  lastSurah: string | null;
  lastPage: number | null;
  updatedAt: IsoDateTime;
}

// ---------- Harian ----------

export interface Priority3Item {
  text: string;
  done: boolean;
}

export type Mood = 'senang' | 'tenang' | 'biasa' | 'lelah' | 'sedih' | 'cemas';

/** Kunci = date. Fase 1 hanya priorities. */
export interface DayEntry {
  date: LocalDate;
  /** Maksimal 3. */
  priorities: Priority3Item[];
  mood: Mood | null; // Fase 3
  note: string | null; // Fase 3
  gratitude: string[]; // Fase 3
  updatedAt: IsoDateTime;
}

// ---------- Fase 2 ----------

export interface Habit extends Timestamps {
  id: Id;
  name: string;
  /** Jika diisi, habit muncul di agenda pada jam ini. */
  targetTime: LocalTime | null;
  /** Hari dalam minggu (0 = Minggu). Kosong = setiap hari. */
  days: number[];
  activeFrom: LocalDate;
  /** "Menghapus" habit = mengisi ini. Riwayat tetap utuh. */
  activeUntil: LocalDate | null;
}

/** id = `${habitId}:${date}`. */
export interface HabitLog {
  id: string;
  habitId: Id;
  date: LocalDate;
  at: IsoDateTime;
}

export interface Countdown extends Timestamps {
  id: Id;
  title: string;
  date: LocalDate;
}

export interface FocusSession {
  id: Id;
  taskId: Id | null;
  label: string;
  startedAt: IsoDateTime;
  /** Timer dihitung dari endsAt, bukan setInterval, agar tahan refresh. */
  endsAt: IsoDateTime;
  plannedMin: number;
  completed: boolean;
}

// ---------- Data turunan (TIDAK disimpan) ----------

export type AgendaSource = 'prayer' | 'class' | 'routine' | 'event' | 'task' | 'habit';
export type AgendaStatus = 'past' | 'done' | 'now' | 'next' | 'upcoming';

export interface AgendaItem {
  /** Unik dan stabil untuk keyed each, misal 'routine:01J...:2026-10-17'. */
  key: string;
  source: AgendaSource;
  sourceId: string;
  date: LocalDate;
  start: Minutes;
  end: Minutes;
  title: string;
  meta: string;
  subjectId: Id | null;
  status: AgendaStatus;
  /** Bertumpuk dengan item lain (bukan sholat). */
  conflict: boolean;
  /** Bertepatan dengan waktu sholat. */
  overlapsPrayer: PrayerName | null;
  /** Kolom tampilan saat bentrok, 0 = kiri. */
  lane: number;
  laneCount: number;
}

export type PrayerStatus = 'done' | 'now' | 'missed' | 'upcoming';

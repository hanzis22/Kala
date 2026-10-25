import { liveQuery } from 'dexie';
import { listActiveRoutines } from '$lib/data/repo/routines';
import { listSubjects } from '$lib/data/repo/subjects';
import { isSupportedRoutine } from '$lib/domain/recurrence';
import type { Routine, Subject } from '$lib/domain/types';

/**
 * Mapel aktif dan rutin aktif lewat liveQuery (ikut berubah dari tab lain, PRD §7.9).
 * Dibaca bersama dalam satu query agar grid tidak pernah menampilkan sesi tanpa mapelnya.
 * Rutin dengan pola di luar subset (misal dari impor) dipisah ke `unsupported` agar grid dan
 * tampilan Hari tidak pernah melempar; rutin itu hanya ditampilkan dan bisa dihapus.
 */
class ScheduleStore {
  subjects = $state<Subject[]>([]);
  /** Sesi kelas dengan mapel aktif dan pola yang didukung. */
  classRoutines = $state<Routine[]>([]);
  /** Rutin umum (kind 'routine') dengan pola yang didukung. */
  routines = $state<Routine[]>([]);
  /** Kegiatan sekali (kind 'event'). */
  events = $state<Routine[]>([]);
  /** Rutin dan sesi kelas dengan pola tak dikenal. */
  unsupported = $state<Routine[]>([]);
  loaded = $state(false);

  /** Dipanggil sekali dari root layout. Mengembalikan fungsi pembersih. */
  start(): () => void {
    const sub = liveQuery(async () => {
      const [subjects, all] = await Promise.all([listSubjects(), listActiveRoutines()]);
      const active = new Set(subjects.map((s) => s.id));
      const supported = all.filter(isSupportedRoutine);
      return {
        subjects,
        classRoutines: supported.filter(
          (r) => r.kind === 'class' && r.subjectId !== null && active.has(r.subjectId)
        ),
        routines: supported.filter((r) => r.kind === 'routine'),
        events: supported.filter((r) => r.kind === 'event'),
        unsupported: all.filter((r) => !isSupportedRoutine(r))
      };
    }).subscribe({
      next: (result) => {
        this.subjects = result.subjects;
        this.classRoutines = result.classRoutines;
        this.routines = result.routines;
        this.events = result.events;
        this.unsupported = result.unsupported;
        this.loaded = true;
      },
      error: (err: unknown) => console.error('[schedule] liveQuery gagal', err)
    });
    return () => sub.unsubscribe();
  }

  subjectById(id: string | null): Subject | undefined {
    return id === null ? undefined : this.subjects.find((s) => s.id === id);
  }
}

export const schedule = new ScheduleStore();

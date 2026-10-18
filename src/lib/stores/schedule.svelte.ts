import { liveQuery } from 'dexie';
import { listClassRoutines } from '$lib/data/repo/routines';
import { listSubjects } from '$lib/data/repo/subjects';
import type { Routine, Subject } from '$lib/domain/types';

/**
 * Mapel aktif dan sesi kelas aktif lewat liveQuery (ikut berubah dari tab lain, PRD §7.9).
 * Dibaca bersama dalam satu query agar grid tidak pernah menampilkan sesi tanpa mapelnya.
 */
class ScheduleStore {
  subjects = $state<Subject[]>([]);
  classRoutines = $state<Routine[]>([]);
  loaded = $state(false);

  /** Dipanggil sekali dari root layout. Mengembalikan fungsi pembersih. */
  start(): () => void {
    const sub = liveQuery(async () => {
      const [subjects, routines] = await Promise.all([listSubjects(), listClassRoutines()]);
      const active = new Set(subjects.map((s) => s.id));
      return { subjects, routines: routines.filter((r) => r.subjectId !== null && active.has(r.subjectId)) };
    }).subscribe({
      next: ({ subjects, routines }) => {
        this.subjects = subjects;
        this.classRoutines = routines;
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

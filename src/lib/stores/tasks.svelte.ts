import { liveQuery } from 'dexie';
import { getSubjectsByIds } from '$lib/data/repo/subjects';
import { listActiveTasks } from '$lib/data/repo/tasks';
import type { Id, Task } from '$lib/domain/types';

export interface SubjectName {
  name: string;
  /** Mapel sudah di-soft delete; tugas tetap ada dan menampilkan "(dihapus)" (PRD §F4.4). */
  deleted: boolean;
}

/**
 * Tugas aktif lewat liveQuery (ikut berubah dari tab lain, PRD §7.9).
 * Nama mapel dibaca dalam query yang sama, termasuk mapel yang sudah dihapus,
 * agar daftar tidak pernah menampilkan tugas tanpa label mapelnya.
 */
class TasksStore {
  all = $state<Task[]>([]);
  subjectNames = $state<ReadonlyMap<Id, SubjectName>>(new Map());
  loaded = $state(false);

  /** Dipanggil sekali dari root layout. Mengembalikan fungsi pembersih. */
  start(): () => void {
    const sub = liveQuery(async () => {
      const all = await listActiveTasks();
      const ids = [...new Set(all.flatMap((t) => (t.subjectId === null ? [] : [t.subjectId])))];
      const subjects = await getSubjectsByIds(ids);
      const subjectNames = new Map<Id, SubjectName>(
        subjects.map((s) => [s.id, { name: s.name, deleted: s.deletedAt !== null }])
      );
      return { all, subjectNames };
    }).subscribe({
      next: (result) => {
        this.all = result.all;
        this.subjectNames = result.subjectNames;
        this.loaded = true;
      },
      error: (err: unknown) => console.error('[tasks] liveQuery gagal', err)
    });
    return () => sub.unsubscribe();
  }
}

export const tasks = new TasksStore();

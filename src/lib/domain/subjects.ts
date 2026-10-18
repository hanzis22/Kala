/** Mata pelajaran (PRD §F4.1). Normalisasi dan validasi input, fungsi murni. */
import type { Id, Subject } from './types';

export interface SubjectInput {
  name: string;
  teacher: string | null;
  room: string | null;
}

export type SubjectError = 'name-required' | 'name-too-long' | 'name-duplicate' | 'detail-too-long';

export const MAX_SUBJECT_NAME = 60;
export const MAX_SUBJECT_DETAIL = 40;

/** Trim + spasi berlebih dirapikan; teks opsional yang kosong menjadi null. */
export function normalizeSubjectInput(input: SubjectInput): SubjectInput {
  const clean = (value: string | null) => (value ?? '').trim().replace(/\s+/g, ' ');
  const optional = (value: string | null) => clean(value) || null;
  return { name: clean(input.name), teacher: optional(input.teacher), room: optional(input.room) };
}

const nameKey = (name: string) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('id-ID');

/**
 * Validasi input yang sudah dinormalisasi. Nama unik tanpa membedakan huruf besar-kecil di antara
 * mapel aktif (agar tambah cepat F7 tidak ambigu). `selfId` = mapel yang sedang diubah.
 */
export function validateSubjectInput(
  input: SubjectInput,
  existing: readonly Pick<Subject, 'id' | 'name' | 'deletedAt'>[],
  selfId: Id | null = null
): SubjectError | null {
  if (input.name.length === 0) return 'name-required';
  if (input.name.length > MAX_SUBJECT_NAME) return 'name-too-long';
  if ((input.teacher?.length ?? 0) > MAX_SUBJECT_DETAIL || (input.room?.length ?? 0) > MAX_SUBJECT_DETAIL) {
    return 'detail-too-long';
  }
  const key = nameKey(input.name);
  const duplicate = existing.some((s) => s.deletedAt === null && s.id !== selfId && nameKey(s.name) === key);
  return duplicate ? 'name-duplicate' : null;
}

/** Urutan tampilan: nama menurut abjad Indonesia, angka diurutkan secara alami. */
export function compareSubjects(a: Pick<Subject, 'name'>, b: Pick<Subject, 'name'>): number {
  return a.name.localeCompare(b.name, 'id-ID', { sensitivity: 'base', numeric: true });
}

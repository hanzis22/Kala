import { describe, expect, it } from 'vitest';
import { compareSubjects, normalizeSubjectInput, validateSubjectInput } from './subjects';

const existing = [
  { id: 'a', name: 'Matematika', deletedAt: null },
  { id: 'b', name: 'Fisika', deletedAt: '2026-10-19T00:00:00.000Z' }
];

describe('normalizeSubjectInput', () => {
  it('trim, rapikan spasi, kosong → null', () => {
    expect(normalizeSubjectInput({ name: '  Bahasa   Indonesia ', teacher: '  ', room: ' 7B ' })).toEqual({
      name: 'Bahasa Indonesia',
      teacher: null,
      room: '7B'
    });
  });
});

describe('validateSubjectInput', () => {
  const input = (name: string, extra: Partial<{ teacher: string; room: string }> = {}) =>
    normalizeSubjectInput({ name, teacher: extra.teacher ?? null, room: extra.room ?? null });

  it('nama wajib', () => {
    expect(validateSubjectInput(input('   '), existing)).toBe('name-required');
  });

  it('nama maksimal 60 karakter', () => {
    expect(validateSubjectInput(input('a'.repeat(60)), existing)).toBeNull();
    expect(validateSubjectInput(input('a'.repeat(61)), existing)).toBe('name-too-long');
  });

  it('guru dan ruang maksimal 40 karakter', () => {
    expect(validateSubjectInput(input('Kimia', { room: 'r'.repeat(41) }), existing)).toBe('detail-too-long');
    expect(validateSubjectInput(input('Kimia', { teacher: 't'.repeat(41) }), existing)).toBe(
      'detail-too-long'
    );
  });

  it('nama duplikat ditolak tanpa membedakan huruf besar-kecil', () => {
    expect(validateSubjectInput(input('matematika'), existing)).toBe('name-duplicate');
    expect(validateSubjectInput(input('MATEMATIKA '), existing)).toBe('name-duplicate');
  });

  it('nama mapel yang sudah dihapus boleh dipakai lagi', () => {
    expect(validateSubjectInput(input('Fisika'), existing)).toBeNull();
  });

  it('mengubah mapel sendiri tanpa ganti nama bukan duplikat', () => {
    expect(validateSubjectInput(input('Matematika'), existing, 'a')).toBeNull();
  });
});

describe('compareSubjects', () => {
  it('abjad, tanpa membedakan huruf besar-kecil, angka alami', () => {
    const names = ['matematika', 'Bahasa Inggris', 'Mapel 10', 'Mapel 2'].map((name) => ({ name }));
    expect(names.sort(compareSubjects).map((s) => s.name)).toEqual([
      'Bahasa Inggris',
      'Mapel 2',
      'Mapel 10',
      'matematika'
    ]);
  });
});

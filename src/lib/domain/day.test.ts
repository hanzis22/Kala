import { describe, expect, it } from 'vitest';
import {
  emptyDayEntry,
  greetingFor,
  MAX_PRIORITY_TEXT,
  normalizePriorities,
  validatePriorities
} from './day';

const p = (text: string, done = false) => ({ text, done });

describe('greetingFor', () => {
  it.each([
    [0, 'pagi'],
    [659, 'pagi'],
    [660, 'siang'],
    [899, 'siang'],
    [900, 'sore'],
    [1079, 'sore'],
    [1080, 'malam'],
    [1439, 'malam']
  ])('%i → %s', (minutes, greeting) => {
    expect(greetingFor(minutes)).toBe(greeting);
  });
});

describe('normalizePriorities', () => {
  it('trim, baris kosong dibuang tanpa celah, done ikut barisnya', () => {
    expect(normalizePriorities([p('  Hafalan ', true), p('   ', true), p('Latihan soal', false)])).toEqual([
      p('Hafalan', true),
      p('Latihan soal', false)
    ]);
    expect(normalizePriorities([p(''), p(''), p('Baca bab 3', true)])).toEqual([p('Baca bab 3', true)]);
    expect(normalizePriorities([])).toEqual([]);
  });

  it('tidak mengubah input', () => {
    const input = [p(' a ')];
    normalizePriorities(input);
    expect(input).toEqual([p(' a ')]);
  });
});

describe('validatePriorities', () => {
  const long = 'x'.repeat(MAX_PRIORITY_TEXT);

  it('maksimal 3 dan 80 karakter', () => {
    expect(validatePriorities([p('a'), p('b'), p('c')])).toBeNull();
    expect(validatePriorities([p('a'), p('b'), p('c'), p('d')])).toBe('too-many');
    expect(validatePriorities([p(long)])).toBeNull();
    expect(validatePriorities([p(long + 'x')])).toBe('too-long');
  });

  it('dicek setelah normalisasi: baris kosong tidak dihitung, spasi di ujung tidak dihitung', () => {
    expect(validatePriorities([p('a'), p('  '), p('b'), p('c')])).toBeNull();
    expect(validatePriorities([p(` ${long}  `)])).toBeNull();
  });

  it('too-many dicek sebelum too-long', () => {
    expect(validatePriorities([p('a'), p('b'), p('c'), p(long + 'x')])).toBe('too-many');
  });

  it('panjang = UTF-16 .length (surrogate pair dihitung 2)', () => {
    const emoji = '\u{1F4DA}'; // 2 code unit
    expect(validatePriorities([p('x'.repeat(78) + emoji)])).toBeNull();
    expect(validatePriorities([p('x'.repeat(79) + emoji)])).toBe('too-long');
  });
});

describe('emptyDayEntry', () => {
  it('entri kosong dengan updatedAt', () => {
    expect(emptyDayEntry('2026-10-26', '2026-10-26T01:00:00.000Z')).toEqual({
      date: '2026-10-26',
      priorities: [],
      mood: null,
      note: null,
      gratitude: [],
      updatedAt: '2026-10-26T01:00:00.000Z'
    });
  });
});

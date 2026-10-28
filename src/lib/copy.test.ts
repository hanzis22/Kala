import { describe, expect, it } from 'vitest';
import { copy } from './copy';

const sky = copy.today.sky;

describe('copy.today', () => {
  it('countdown: visual "{j} j {mm} m" / "{m} m", dibacakan tanpa nol di depan', () => {
    expect(sky.countdown(0)).toEqual({ visual: '0 m', spoken: '0 menit lagi' });
    expect(sky.countdown(59)).toEqual({ visual: '59 m', spoken: '59 menit lagi' });
    expect(sky.countdown(60)).toEqual({ visual: '1 j 00 m', spoken: '1 jam 0 menit lagi' });
    expect(sky.countdown(65)).toEqual({ visual: '1 j 05 m', spoken: '1 jam 5 menit lagi' });
    expect(sky.countdown(605)).toEqual({ visual: '10 j 05 m', spoken: '10 jam 5 menit lagi' });
  });

  it('sub mode CTA: "lagi" hanya sekali di kedua versi', () => {
    const sub = sky.sub(sky.at('Isya', '18.57', false), 65);
    expect(sub).toEqual({
      visual: 'Isya pukul 18.57, 1 j 05 m lagi',
      spoken: 'Isya pukul 18.57, 1 jam 5 menit lagi'
    });
    expect(sky.sub('Subuh pukul 04.20', 5).spoken).toBe('Subuh pukul 04.20, 5 menit lagi');
    for (const m of [0, 59, 60, 65, 605]) {
      const s = sky.sub('Subuh pukul 04.20', m);
      expect(s.visual).not.toContain('lagi lagi');
      expect(s.spoken).not.toContain('lagi lagi');
    }
  });

  it('at: "besok" hanya jika tomorrow', () => {
    expect(sky.at('Subuh', '04.20', true)).toBe('Subuh besok pukul 04.20');
    expect(sky.at('Subuh', '04.20', false)).toBe('Subuh pukul 04.20');
  });

  it('heading: tanpa koma jika nama kosong', () => {
    expect(copy.today.heading('Selamat pagi', 'Dhani')).toBe('Selamat pagi, Dhani');
    expect(copy.today.heading('Selamat pagi', '  Dhani ')).toBe('Selamat pagi, Dhani');
    expect(copy.today.heading('Selamat pagi', '')).toBe('Selamat pagi');
    expect(copy.today.heading('Selamat pagi', '   ')).toBe('Selamat pagi');
  });

  it('chip: label per status diawali teks terlihat, tanpa kata "terlewat"', () => {
    const label = copy.today.chips.label;
    expect(label('Subuh', '04.20', 'done')).toBe('Subuh 04.20, sudah dicatat. Ketuk untuk menghapus catatan');
    expect(label('Subuh', '04.20', 'now')).toBe('Subuh 04.20, sedang berlangsung. Ketuk untuk mencatat');
    expect(label('Subuh', '04.20', 'missed')).toBe('Subuh 04.20, belum dicatat. Ketuk untuk mencatat');
    expect(label('Subuh', '04.20', 'upcoming')).toBe('Subuh 04.20, belum masuk');
    expect(copy.today.chips.removed('Ashar')).toBe('Catatan Ashar dihapus');
  });

  it('prioritas: hitungan, label input, label checkbox', () => {
    const p = copy.today.priorities;
    expect(p.count(1, 2)).toBe('1 dari 2');
    expect(p.inputLabel(3)).toBe('Prioritas 3');
    expect(p.checkLabel('Belajar fisika')).toBe('Tandai selesai: Belajar fisika');
  });

  it('agenda: label centang menyebut jenis (Usulan #37)', () => {
    const a = copy.today.agenda;
    expect(a.check('Matematika', 'kelas', '07.00–08.30', false)).toBe(
      'Tandai selesai: Matematika, kelas, 07.00–08.30'
    );
    expect(a.check('Matematika', 'kelas', '07.00–08.30', true)).toBe(
      'Batalkan selesai: Matematika, kelas, 07.00–08.30'
    );
    expect(a.prayerCheck('Dzuhur', '11.42', false)).toBe('Tandai sudah sholat: Dzuhur, sholat, 11.42');
    expect(a.prayerCheck('Dzuhur', '11.42', true)).toBe('Hapus catatan sholat: Dzuhur, sholat, 11.42');
  });

  it('agenda: pill berikutnya, meta, grup', () => {
    const a = copy.today.agenda;
    expect(a.next(25)).toEqual({ visual: 'Berikutnya · 25 menit lagi', spoken: 'Berikutnya, 25 menit lagi' });
    expect(a.next(59).visual).toBe('Berikutnya · 59 menit lagi');
    expect(a.next(60)).toEqual({
      visual: 'Berikutnya · 1 j 00 m lagi',
      spoken: 'Berikutnya, 1 jam 0 menit lagi'
    });
    expect(a.next(65).visual).toBe('Berikutnya · 1 j 05 m lagi');
    expect(a.meta('Kelas', 'R. 11B', '08.30')).toBe('Kelas · R. 11B · sampai 08.30');
    expect(a.meta('Rutin', '  ', '17.00')).toBe('Rutin · sampai 17.00');
    expect(a.carriedOver(2)).toBe('Belum selesai sebelumnya (2)');
    expect(a.overlapsPrayer('Dzuhur')).toBe('Bertepatan dengan waktu Dzuhur');
  });
});

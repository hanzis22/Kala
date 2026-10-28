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
});

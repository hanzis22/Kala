/**
 * Kartu langit Hari Ini (PRD §F2.2). Fungsi murni: `now` selalu dari argumen. Semua jam di zona lokasi,
 * sama dengan Ibadah, karena sholat terikat lokasi.
 */
import { toZoned } from './dates';
import {
  activePrayer,
  isNightForTheme,
  nextPrayer,
  prayerLogId,
  prayerTimes,
  type DayPrayerTimes,
  type PrayerConfig
} from './prayer';
import type { LocalDate, Minutes, PrayerLog, PrayerName } from './types';

export type SkyTone = 'fajar' | 'senja';

export interface SkyCardState {
  tone: SkyTone;
  /** Bulan sejak Isya sampai sebelum Subuh (sama dengan tema "ikuti waktu sholat"). */
  body: 'sun' | 'moon';
  /** Menit sekarang di zona lokasi. */
  nowMinutes: Minutes;
  /** Sholat yang sedang dalam rentang fikihnya; 00.00–Subuh = Isya tanggal kemarin. */
  active: { prayer: PrayerName; date: LocalDate; logged: boolean } | null;
  /** `minutesUntil` beresolusi menit (detik dibuang), sama dengan `nextPrayer`. `tomorrow` = tanggal lokasi besok. */
  next: { prayer: PrayerName; date: LocalDate; time: Minutes; minutesUntil: number; tomorrow: boolean };
  /** cta = sholat aktif belum dicatat ("Tandai sudah sholat …"); selain itu hitung mundur. */
  mode: 'cta' | 'countdown';
  /** Pecahan 0..1 sepanjang lengkung Subuh → Isya. */
  arc: { marker: number; dots: Record<PrayerName, number> };
}

/** Satu aturan untuk Hari Ini dan Ibadah: senja = [Ashar, Isya), fajar = sisanya ([Isya, Ashar) esok). */
export function skyTone(now: Date, config: PrayerConfig): SkyTone {
  const z = toZoned(now, config.location.timeZone);
  const t = prayerTimes(z.date, config);
  return z.minutes >= t.ashar && z.minutes < t.isya ? 'senja' : 'fajar';
}

const ARC_MIN = 0.02;
const ARC_MAX = 0.98;

/** Posisi linear di lengkung Subuh → Isya, dijepit ke [0.02, 0.98]: sebelum Subuh di kiri, setelah Isya di kanan. */
export function arcFraction(minutes: Minutes, times: Pick<DayPrayerTimes, 'subuh' | 'isya'>): number {
  const u = (minutes - times.subuh) / (times.isya - times.subuh);
  return Math.min(ARC_MAX, Math.max(ARC_MIN, u));
}

/** Titik Bezier kuadrat lengkung (8,86) → (175,−14) → (342,86) di viewBox 350×92. */
export function arcPoint(u: number): { x: number; y: number } {
  const a = (1 - u) * (1 - u);
  const b = 2 * (1 - u) * u;
  const c = u * u;
  return { x: a * 8 + b * 175 + c * 342, y: a * 86 + b * -14 + c * 86 };
}

export function skyCard(now: Date, config: PrayerConfig, logs: readonly PrayerLog[]): SkyCardState {
  const z = toZoned(now, config.location.timeZone);
  const times = prayerTimes(z.date, config);
  const logged = new Set(logs.map((l) => prayerLogId(l.date, l.prayer)));

  const current = activePrayer(now, config);
  const active = current && { ...current, logged: logged.has(prayerLogId(current.date, current.prayer)) };
  const next = nextPrayer(now, config);

  return {
    tone: skyTone(now, config),
    body: isNightForTheme(now, config) ? 'moon' : 'sun',
    nowMinutes: z.minutes,
    active,
    next: { ...next, tomorrow: next.date > z.date },
    mode: active && !active.logged ? 'cta' : 'countdown',
    arc: {
      marker: arcFraction(z.minutes, times),
      dots: {
        subuh: arcFraction(times.subuh, times),
        dzuhur: arcFraction(times.dzuhur, times),
        ashar: arcFraction(times.ashar, times),
        maghrib: arcFraction(times.maghrib, times),
        isya: arcFraction(times.isya, times)
      }
    }
  };
}

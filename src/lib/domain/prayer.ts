/**
 * Waktu sholat (PRD §F3). Fungsi murni: `now` selalu dari argumen. Semua jam dihitung di zona waktu
 * lokasi (`Location.timeZone`), tidak bergantung zona perangkat.
 *
 * Parameter (PRD §F3.1, dikalibrasi terhadap jadwal resmi Kemenag, lihat prayer.kemenag.test.ts):
 * - Subuh 20°, Isya 18°, Ashar mazhab Syafi'i (adhan).
 * - Dhuha: matahari 4,5° di atas ufuk timur.
 * - Dzuhur +1 menit (zawal: seluruh piringan matahari melewati meridian).
 * - Maghrib +1 dan Terbit −1 menit (koreksi ufuk/kerendahan horizon).
 * - Ihtiyat (default 2 menit) ditambahkan ke awal waktu sholat dan Dhuha, dikurangkan dari Terbit.
 * - Pembulatan seperti Kemenag: awal waktu dibulatkan ke atas, Terbit ke bawah.
 * - Koreksi manual per sholat (−10..+10) ditambahkan setelah pembulatan.
 * - Imsak = Subuh yang ditampilkan − 10 menit.
 */
import { CalculationParameters, Coordinates, Madhab, PrayerTimes, Rounding } from 'adhan';
import { addDays, dayNumber, isValidLocalDate, MINUTES_PER_DAY, toZoned, zoneOffsetMinutes } from './dates';
import {
  PRAYERS,
  type LocalDate,
  type Location,
  type Minutes,
  type PrayerLog,
  type PrayerName,
  type PrayerSettings,
  type PrayerStatus,
  type Settings
} from './types';

export const PRAYER_PARAMS = {
  fajrAngle: 20,
  ishaAngle: 18,
  dhuhaAngle: 4.5,
  zawalMin: 1,
  horizonMin: 1,
  imsakBeforeSubuhMin: 10
} as const;

/** Bagian Settings yang dibutuhkan hitungan sholat (lokasi wajib ada). */
export interface PrayerConfig {
  location: Location;
  prayer: PrayerSettings;
}

/** Jadwal satu hari, dalam menit sejak tengah malam di zona lokasi. */
export interface DayPrayerTimes {
  date: LocalDate;
  imsak: Minutes;
  subuh: Minutes;
  terbit: Minutes;
  dhuha: Minutes;
  dzuhur: Minutes;
  ashar: Minutes;
  maghrib: Minutes;
  isya: Minutes;
}

function adhanTimes(date: LocalDate, location: Location, fajrAngle: number): PrayerTimes {
  const [y, m, d] = date.split('-').map(Number);
  const params = new CalculationParameters('Other', fajrAngle, PRAYER_PARAMS.ishaAngle);
  params.madhab = Madhab.Shafi;
  params.rounding = Rounding.None;
  // adhan membaca komponen tanggal (getFullYear/getMonth/getDate), jadi Date lokal ini aman di zona mana pun.
  return new PrayerTimes(new Coordinates(location.lat, location.lng), new Date(y, m - 1, d), params);
}

/** Menit pecahan sejak tengah malam `date` di zona lokasi (bisa < 0 atau ≥ 1440 jika melewati hari). */
function exactMinutes(instant: Date, date: LocalDate, timeZone: string): number {
  const z = toZoned(instant, timeZone);
  const seconds = instant.getUTCSeconds() + instant.getUTCMilliseconds() / 1000;
  return (dayNumber(z.date) - dayNumber(date)) * MINUTES_PER_DAY + z.minutes + seconds / 60;
}

export function prayerTimes(date: LocalDate, config: PrayerConfig): DayPrayerTimes {
  const { location, prayer } = config;
  const tz = location.timeZone;
  const main = adhanTimes(date, location, PRAYER_PARAMS.fajrAngle);
  // Dhuha = saat matahari setinggi h° di pagi hari = rumus Subuh adhan dengan sudut −h.
  const dhuha = adhanTimes(date, location, -PRAYER_PARAMS.dhuhaAngle).fajr;
  const ihtiyat = prayer.ihtiyatMin;
  const adj = prayer.adjustMin;
  const start = (instant: Date, extra = 0) => Math.ceil(exactMinutes(instant, date, tz) + ihtiyat + extra);

  const subuh = start(main.fajr) + adj.subuh;
  return {
    date,
    imsak: subuh - PRAYER_PARAMS.imsakBeforeSubuhMin,
    subuh,
    terbit: Math.floor(exactMinutes(main.sunrise, date, tz) - ihtiyat - PRAYER_PARAMS.horizonMin),
    dhuha: start(dhuha),
    dzuhur: start(main.dhuhr, PRAYER_PARAMS.zawalMin) + adj.dzuhur,
    ashar: start(main.asr) + adj.ashar,
    maghrib: start(main.maghrib, PRAYER_PARAMS.horizonMin) + adj.maghrib,
    isya: start(main.isha) + adj.isya
  };
}

/** Titik waktu absolut sederhana: menit sejak 1970-01-01 00.00 di zona lokasi. */
const at = (date: LocalDate, minutes: Minutes) => dayNumber(date) * MINUTES_PER_DAY + minutes;

/** Rentang [mulai, akhir) sebuah sholat pada `date` (PRD §F3.5, fikih): Subuh berakhir saat Terbit. */
function prayerWindow(prayer: PrayerName, date: LocalDate, config: PrayerConfig): [number, number] {
  const t = prayerTimes(date, config);
  switch (prayer) {
    case 'subuh':
      return [at(date, t.subuh), at(date, t.terbit)];
    case 'dzuhur':
      return [at(date, t.dzuhur), at(date, t.ashar)];
    case 'ashar':
      return [at(date, t.ashar), at(date, t.maghrib)];
    case 'maghrib':
      return [at(date, t.maghrib), at(date, t.isya)];
    case 'isya': {
      const next = addDays(date, 1);
      return [at(date, t.isya), at(next, prayerTimes(next, config).subuh)];
    }
  }
}

const nowAt = (now: Date, config: PrayerConfig) => {
  const z = toZoned(now, config.location.timeZone);
  return { ...z, abs: at(z.date, z.minutes) };
};

export const prayerLogId = (date: LocalDate, prayer: PrayerName) => `${date}:${prayer}`;

/** Kebalikan `prayerLogId`; null jika tanggal atau nama sholat tidak valid. */
export function parsePrayerLogId(id: string): { date: LocalDate; prayer: PrayerName } | null {
  const [date, prayer, ...rest] = id.split(':');
  if (rest.length > 0 || prayer === undefined || !isValidLocalDate(date)) return null;
  const name = PRAYERS.find((p) => p === prayer);
  return name === undefined ? null : { date, prayer: name };
}

/**
 * Status tiap sholat pada `date`: done (ada log), now (dalam rentangnya), missed (rentangnya sudah
 * lewat tanpa log), upcoming (belum masuk). Antara Terbit dan Dzuhur tidak ada yang berstatus now.
 */
export function prayerStatus(
  date: LocalDate,
  logs: readonly PrayerLog[],
  now: Date,
  config: PrayerConfig
): Record<PrayerName, PrayerStatus> {
  const logged = new Set(logs.filter((l) => l.date === date).map((l) => l.prayer));
  const current = nowAt(now, config).abs;
  const result = {} as Record<PrayerName, PrayerStatus>;
  for (const p of PRAYERS) {
    if (logged.has(p)) {
      result[p] = 'done';
      continue;
    }
    const [start, end] = prayerWindow(p, date, config);
    result[p] = current < start ? 'upcoming' : current < end ? 'now' : 'missed';
  }
  return result;
}

/** Sholat berikutnya yang belum masuk waktunya. Setelah Terbit → Dzuhur; setelah Isya → Subuh esok. */
export function nextPrayer(
  now: Date,
  config: PrayerConfig
): { prayer: PrayerName; date: LocalDate; time: Minutes; minutesUntil: number } {
  const n = nowAt(now, config);
  for (const date of [n.date, addDays(n.date, 1)]) {
    const t = prayerTimes(date, config);
    for (const p of PRAYERS) {
      const start = at(date, t[p]);
      if (start > n.abs) return { prayer: p, date, time: t[p], minutesUntil: start - n.abs };
    }
  }
  // Tidak tercapai: Subuh esok selalu setelah sekarang.
  throw new Error('nextPrayer: tidak ada sholat berikutnya');
}

/**
 * Sholat yang sedang dalam rentang fikihnya, beserta tanggal lokasinya. Antara 00.00 dan Subuh yang aktif
 * adalah Isya tanggal kemarin; antara Terbit dan Dzuhur tidak ada (null).
 */
export function activePrayer(
  now: Date,
  config: PrayerConfig
): { prayer: PrayerName; date: LocalDate } | null {
  const n = nowAt(now, config);
  const candidates: { prayer: PrayerName; date: LocalDate }[] = [
    { prayer: 'isya', date: addDays(n.date, -1) },
    ...PRAYERS.map((prayer) => ({ prayer, date: n.date }))
  ];
  return (
    candidates.find(({ prayer, date }) => {
      const [start, end] = prayerWindow(prayer, date, config);
      return start <= n.abs && n.abs < end;
    }) ?? null
  );
}

/** PRD §F3.4: boleh dicatat sejak waktunya masuk sampai akhir hari berikutnya. */
export function canLogPrayer(date: LocalDate, prayer: PrayerName, now: Date, config: PrayerConfig): boolean {
  const n = nowAt(now, config);
  const [start] = prayerWindow(prayer, date, config);
  return n.abs >= start && dayNumber(n.date) <= dayNumber(date) + 1;
}

/** Mode tema "ikuti waktu sholat": malam = sejak Isya sampai sebelum Subuh (PRD §F8.4). */
export function isNightForTheme(now: Date, config: PrayerConfig): boolean {
  const n = nowAt(now, config);
  const t = prayerTimes(n.date, config);
  return n.minutes >= t.isya || n.minutes < t.subuh;
}

/**
 * Zona perangkat berbeda dari zona lokasi sholat? Yang dibandingkan offset pada instan `now`, bukan nama
 * IANA: Asia/Pontianak dan Asia/Jakarta sama-sama UTC+7, jadi tidak dianggap berbeda.
 */
export function zoneMismatch(
  location: Pick<Location, 'timeZone'>,
  deviceTimeZone: string,
  now: Date
): boolean {
  return zoneOffsetMinutes(now, location.timeZone) !== zoneOffsetMinutes(now, deviceTimeZone);
}

/** PrayerConfig dari Settings; null jika lokasi belum dipilih. */
export function toPrayerConfig(settings: Pick<Settings, 'location' | 'prayer'>): PrayerConfig | null {
  return settings.location ? { location: settings.location, prayer: settings.prayer } : null;
}

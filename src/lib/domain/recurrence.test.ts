import { describe, expect, it } from 'vitest';
import {
  buildRule,
  describeRule,
  isSupportedRoutine,
  isValidDateRange,
  parseRule,
  occurrencesBetween,
  occursOn,
  validateTimeSlot,
  weekdayOf,
  weeklyDays,
  weeklyRule,
  type RecurrenceInput,
  type RuleSpec
} from './recurrence';

// Minggu acuan: Senin 19 Okt 2026 – Minggu 25 Okt 2026.
function routine(patch: Partial<RecurrenceInput> = {}): RecurrenceInput {
  return {
    id: 'r1',
    rrule: 'FREQ=WEEKLY;BYDAY=MO,WE',
    dtstart: '2026-10-19',
    until: null,
    exdates: [],
    overrides: {},
    startTime: '07:00',
    durationMin: 90,
    ...patch
  };
}

const dates = (r: RecurrenceInput, from: string, to: string) =>
  occurrencesBetween(r, from, to).map((o) => o.date);

describe('validateTimeSlot', () => {
  it('menerima slot yang berakhir tepat 24.00', () => {
    expect(validateTimeSlot('23:00', 60)).toBeNull();
  });

  it('menolak slot yang melewati 24.00', () => {
    expect(validateTimeSlot('23:00', 61)).toBe('past-midnight');
    expect(validateTimeSlot('12:00', 720)).toBeNull();
    expect(validateTimeSlot('12:01', 720)).toBe('past-midnight');
  });

  it('durasi 5–720 menit, bilangan bulat', () => {
    expect(validateTimeSlot('07:00', 5)).toBeNull();
    expect(validateTimeSlot('00:00', 720)).toBeNull();
    expect(validateTimeSlot('07:00', 4)).toBe('duration-range');
    expect(validateTimeSlot('07:00', 721)).toBe('duration-range');
    expect(validateTimeSlot('07:00', 45.5)).toBe('duration-range');
    expect(validateTimeSlot('07:00', Number.NaN)).toBe('duration-range');
  });

  it('jam harus HH:mm 24 jam', () => {
    expect(validateTimeSlot('7:00', 30)).toBe('invalid-time');
    expect(validateTimeSlot('24:00', 30)).toBe('invalid-time');
    expect(validateTimeSlot('', 30)).toBe('invalid-time');
  });
});

describe('weeklyRule / weeklyDays', () => {
  it('mengurutkan dan membuang duplikat', () => {
    expect(weeklyRule(['WE', 'MO', 'WE'])).toBe('FREQ=WEEKLY;BYDAY=MO,WE');
    expect(weeklyRule(['SU', 'SA', 'MO'])).toBe('FREQ=WEEKLY;BYDAY=MO,SA,SU');
  });

  it('menolak daftar hari kosong', () => {
    expect(() => weeklyRule([])).toThrow(RangeError);
  });

  it('round-trip', () => {
    expect(weeklyDays(weeklyRule(['FR', 'TU']))).toEqual(['TU', 'FR']);
    expect(weeklyDays('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU')).toHaveLength(7);
  });

  it('pola bukan mingguan atau tidak valid → []', () => {
    expect(weeklyDays('FREQ=DAILY')).toEqual([]);
    expect(weeklyDays('FREQ=WEEKLY')).toEqual([]);
    expect(weeklyDays('bukan rrule')).toEqual([]);
  });
});

describe('weekdayOf', () => {
  it('hari dalam minggu dari LocalDate', () => {
    expect(weekdayOf('2026-10-19')).toBe('MO');
    expect(weekdayOf('2026-10-25')).toBe('SU');
    expect(weekdayOf('1970-01-01')).toBe('TH');
    expect(weekdayOf('1969-12-28')).toBe('SU');
  });
});

describe('occurrencesBetween: pola mingguan', () => {
  it('BYDAY banyak hari dalam satu minggu', () => {
    expect(dates(routine(), '2026-10-19', '2026-10-25')).toEqual(['2026-10-19', '2026-10-21']);
  });

  it('satu hari, beberapa minggu', () => {
    const r = routine({ rrule: 'FREQ=WEEKLY;BYDAY=FR' });
    expect(dates(r, '2026-10-19', '2026-11-08')).toEqual(['2026-10-23', '2026-10-30', '2026-11-06']);
  });

  it('jam, menit, dan durasi diisi dari routine', () => {
    expect(occurrencesBetween(routine(), '2026-10-19', '2026-10-19')).toEqual([
      {
        routineId: 'r1',
        date: '2026-10-19',
        startTime: '07:00',
        durationMin: 90,
        start: 420,
        end: 510,
        overridden: false
      }
    ]);
  });

  it('tidak ada kejadian sebelum dtstart', () => {
    const r = routine({ dtstart: '2026-10-20' });
    expect(dates(r, '2026-10-19', '2026-10-25')).toEqual(['2026-10-21']);
  });

  it('dtstart di hari yang bukan BYDAY tidak menjadi kejadian', () => {
    const r = routine({ dtstart: '2026-10-20' });
    expect(occursOn(r, '2026-10-20')).toBe(false);
  });

  it('dtstart inklusif', () => {
    expect(occursOn(routine({ dtstart: '2026-10-21' }), '2026-10-21')).toBe(true);
  });

  it('until inklusif', () => {
    const r = routine({ until: '2026-10-21' });
    expect(dates(r, '2026-10-19', '2026-11-01')).toEqual(['2026-10-19', '2026-10-21']);
  });

  it('until sebelum dtstart → tidak ada kejadian', () => {
    expect(dates(routine({ until: '2026-10-18' }), '2026-10-01', '2026-10-31')).toEqual([]);
  });

  it('rentang melintasi bulan dan tahun', () => {
    const r = routine({ rrule: 'FREQ=WEEKLY;BYDAY=TH', dtstart: '2026-12-01' });
    expect(dates(r, '2026-12-28', '2027-01-10')).toEqual(['2026-12-31', '2027-01-07']);
  });

  it('rentang kosong dan from > to', () => {
    expect(dates(routine(), '2026-10-20', '2026-10-20')).toEqual([]);
    expect(dates(routine(), '2026-10-25', '2026-10-19')).toEqual([]);
  });

  it('rentang maksimal 366 hari', () => {
    expect(() => occurrencesBetween(routine(), '2026-01-01', '2026-12-31')).not.toThrow();
    expect(() => occurrencesBetween(routine(), '2026-01-01', '2027-01-02')).toThrow(RangeError);
  });

  it('menolak RRULE yang memuat DTSTART/UNTIL sendiri', () => {
    expect(() =>
      occurrencesBetween(routine({ rrule: 'DTSTART=20261019;FREQ=DAILY' }), '2026-10-19', '2026-10-25')
    ).toThrow(RangeError);
    const r = routine({ rrule: 'FREQ=WEEKLY;BYDAY=MO;UNTIL=20261231T000000Z' });
    expect(() => occurrencesBetween(r, '2026-10-19', '2026-10-25')).toThrow(RangeError);
  });
});

describe('occurrencesBetween: exdates dan overrides', () => {
  it('exdate melewati satu tanggal', () => {
    const r = routine({ exdates: ['2026-10-21'] });
    expect(dates(r, '2026-10-19', '2026-10-28')).toEqual(['2026-10-19', '2026-10-26', '2026-10-28']);
    expect(occursOn(r, '2026-10-21')).toBe(false);
  });

  it('override jam memindahkan satu kejadian saja', () => {
    const r = routine({ overrides: { '2026-10-21': { startTime: '09:15' } } });
    const [mon, wed] = occurrencesBetween(r, '2026-10-19', '2026-10-21');
    expect(mon).toMatchObject({ startTime: '07:00', start: 420, end: 510, overridden: false });
    expect(wed).toMatchObject({
      startTime: '09:15',
      durationMin: 90,
      start: 555,
      end: 645,
      overridden: true
    });
  });

  it('override durasi saja', () => {
    const r = routine({ overrides: { '2026-10-19': { durationMin: 45 } } });
    expect(occurrencesBetween(r, '2026-10-19', '2026-10-19')[0]).toMatchObject({
      startTime: '07:00',
      durationMin: 45,
      end: 465,
      overridden: true
    });
  });

  it('exdate menang atas override di tanggal yang sama', () => {
    const r = routine({ exdates: ['2026-10-19'], overrides: { '2026-10-19': { startTime: '10:00' } } });
    expect(dates(r, '2026-10-19', '2026-10-19')).toEqual([]);
  });

  it('override di tanggal yang bukan kejadian tidak membuat kejadian baru', () => {
    const r = routine({ overrides: { '2026-10-20': { startTime: '10:00' } } });
    expect(occursOn(r, '2026-10-20')).toBe(false);
  });

  it('override yang melewati 24.00 diabaikan, jam induk dipakai', () => {
    const r = routine({ overrides: { '2026-10-19': { startTime: '23:30' } } });
    expect(occurrencesBetween(r, '2026-10-19', '2026-10-19')[0]).toMatchObject({
      startTime: '07:00',
      overridden: false
    });
  });
});

describe('occurrencesBetween: kegiatan sekali (rrule null)', () => {
  const event = routine({ rrule: null, dtstart: '2026-10-21' });

  it('hanya terjadi di dtstart', () => {
    expect(dates(event, '2026-10-19', '2026-10-25')).toEqual(['2026-10-21']);
    expect(occursOn(event, '2026-10-22')).toBe(false);
  });

  it('di luar rentang → kosong; exdate menghapusnya', () => {
    expect(dates(event, '2026-10-22', '2026-10-25')).toEqual([]);
    expect(dates({ ...event, exdates: ['2026-10-21'] }, '2026-10-19', '2026-10-25')).toEqual([]);
  });
});

describe('isValidDateRange', () => {
  it('until opsional, tidak boleh sebelum dtstart', () => {
    expect(isValidDateRange('2026-10-19', null)).toBe(true);
    expect(isValidDateRange('2026-10-19', '2026-10-19')).toBe(true);
    expect(isValidDateRange('2026-10-19', '2026-10-18')).toBe(false);
    expect(isValidDateRange('2026-02-30', null)).toBe(false);
  });
});

describe('occurrencesBetween: interval dan bulanan', () => {
  it('INTERVAL=2 mingguan: minggu aktif vs pasif, Selasa sebelum dtstart tidak ikut', () => {
    const r = routine({ rrule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,WE', dtstart: '2026-10-21' });
    expect(dates(r, '2026-10-19', '2026-11-20')).toEqual([
      '2026-10-21',
      '2026-11-03',
      '2026-11-04',
      '2026-11-17',
      '2026-11-18'
    ]);
    expect(occursOn(r, '2026-10-20')).toBe(false);
    expect(occursOn(r, '2026-10-27')).toBe(false);
  });

  it('BYMONTHDAY=31 melewati bulan pendek sepanjang 2026', () => {
    const r = routine({ rrule: 'FREQ=MONTHLY;BYMONTHDAY=31', dtstart: '2026-01-01' });
    expect(dates(r, '2026-01-01', '2026-12-31')).toEqual([
      '2026-01-31',
      '2026-03-31',
      '2026-05-31',
      '2026-07-31',
      '2026-08-31',
      '2026-10-31',
      '2026-12-31'
    ]);
  });

  it('BYMONTHDAY=-1 = hari terakhir bulan, termasuk 29 Feb 2028', () => {
    const r = routine({ rrule: 'FREQ=MONTHLY;BYMONTHDAY=-1', dtstart: '2028-01-01' });
    expect(dates(r, '2028-01-01', '2028-04-30')).toEqual([
      '2028-01-31',
      '2028-02-29',
      '2028-03-31',
      '2028-04-30'
    ]);
  });

  it('+5MO hanya di bulan yang punya Senin kelima', () => {
    const r = routine({ rrule: 'FREQ=MONTHLY;BYDAY=+5MO', dtstart: '2026-01-01' });
    expect(dates(r, '2026-01-01', '2026-12-31')).toEqual([
      '2026-03-30',
      '2026-06-29',
      '2026-08-31',
      '2026-11-30'
    ]);
  });

  it('-1FR = Jumat terakhir', () => {
    const r = routine({ rrule: 'FREQ=MONTHLY;BYDAY=-1FR', dtstart: '2026-10-01' });
    expect(dates(r, '2026-10-01', '2026-12-31')).toEqual(['2026-10-30', '2026-11-27', '2026-12-25']);
  });

  it('Senin kedua setiap 2 bulan', () => {
    const r = routine({ rrule: 'FREQ=MONTHLY;INTERVAL=2;BYDAY=+2MO', dtstart: '2026-10-01' });
    expect(dates(r, '2026-10-01', '2027-02-28')).toEqual(['2026-10-12', '2026-12-14', '2027-02-08']);
  });

  it('DAILY interval 3', () => {
    const r = routine({ rrule: 'FREQ=DAILY;INTERVAL=3' });
    expect(dates(r, '2026-10-19', '2026-10-28')).toEqual([
      '2026-10-19',
      '2026-10-22',
      '2026-10-25',
      '2026-10-28'
    ]);
  });
});

describe('buildRule / parseRule', () => {
  const specs: [RuleSpec, string][] = [
    [{ freq: 'daily', interval: 1 }, 'FREQ=DAILY'],
    [{ freq: 'daily', interval: 3 }, 'FREQ=DAILY;INTERVAL=3'],
    [{ freq: 'weekly', interval: 1, days: ['MO', 'WE'] }, 'FREQ=WEEKLY;BYDAY=MO,WE'],
    [{ freq: 'weekly', interval: 2, days: ['TU'] }, 'FREQ=WEEKLY;INTERVAL=2;BYDAY=TU'],
    [{ freq: 'monthly', interval: 1, by: { kind: 'monthday', day: 15 } }, 'FREQ=MONTHLY;BYMONTHDAY=15'],
    [{ freq: 'monthly', interval: 1, by: { kind: 'monthday', day: -1 } }, 'FREQ=MONTHLY;BYMONTHDAY=-1'],
    [
      { freq: 'monthly', interval: 2, by: { kind: 'nth', nth: 2, weekday: 'MO' } },
      'FREQ=MONTHLY;INTERVAL=2;BYDAY=+2MO'
    ],
    [{ freq: 'monthly', interval: 1, by: { kind: 'nth', nth: -1, weekday: 'FR' } }, 'FREQ=MONTHLY;BYDAY=-1FR']
  ];

  it.each(specs)('string kanonik dan round-trip: %j', (spec, rule) => {
    expect(buildRule(spec)).toBe(rule);
    expect(parseRule(buildRule(spec))).toEqual(spec);
  });

  it('normalisasi: 2MO → +2MO, urutan hari, INTERVAL=1 dibuang', () => {
    expect(buildRule(parseRule('FREQ=MONTHLY;BYDAY=2MO')!)).toBe('FREQ=MONTHLY;BYDAY=+2MO');
    expect(buildRule(parseRule('FREQ=WEEKLY;BYDAY=FR,MO,MO')!)).toBe('FREQ=WEEKLY;BYDAY=MO,FR');
    expect(buildRule(parseRule('FREQ=WEEKLY;INTERVAL=1;BYDAY=MO')!)).toBe('FREQ=WEEKLY;BYDAY=MO');
    expect(buildRule(parseRule('BYDAY=MO;FREQ=WEEKLY')!)).toBe('FREQ=WEEKLY;BYDAY=MO');
  });

  it('buildRule menolak spec tidak valid', () => {
    expect(() => buildRule({ freq: 'daily', interval: 0 })).toThrow(RangeError);
    expect(() => buildRule({ freq: 'weekly', interval: 1, days: [] })).toThrow(RangeError);
    expect(() => buildRule({ freq: 'monthly', interval: 1, by: { kind: 'monthday', day: 32 } })).toThrow(
      RangeError
    );
    expect(() =>
      buildRule({ freq: 'monthly', interval: 1, by: { kind: 'nth', nth: 6, weekday: 'MO' } })
    ).toThrow(RangeError);
  });

  const dangerous = [
    'FREQ=SECONDLY',
    'FREQ=HOURLY',
    'FREQ=YEARLY',
    'FREQ=DAILY;COUNT=3',
    'FREQ=MONTHLY;BYDAY=MO;BYSETPOS=1',
    'FREQ=DAILY;BYHOUR=7',
    'FREQ=WEEKLY;BYDAY=MO;WKST=SU',
    'FREQ=WEEKLY;BYDAY=MO;UNTIL=20261231T000000Z',
    'FREQ=WEEKLY;FREQ=DAILY;BYDAY=MO',
    'FREQ=WEEKLY;BYDAY=MO;BYDAY=TU',
    'FREQ=DAILY;X-FOO=1',
    'FREQ=DAILY;INTERVAL=0',
    'FREQ=DAILY;INTERVAL=100',
    'FREQ=DAILY;INTERVAL=1.5',
    'FREQ=DAILY;INTERVAL=-1',
    'FREQ=DAILY;BYDAY=MO',
    'FREQ=DAILY;BYMONTHDAY=1',
    'FREQ=WEEKLY',
    'FREQ=WEEKLY;BYDAY=+1MO',
    'FREQ=WEEKLY;BYDAY=MO,,TU',
    'FREQ=WEEKLY;BYDAY=MO;BYMONTHDAY=1',
    'FREQ=MONTHLY',
    'FREQ=MONTHLY;BYDAY=MO',
    'FREQ=MONTHLY;BYDAY=+1MO,+3MO',
    'FREQ=MONTHLY;BYDAY=+6MO',
    'FREQ=MONTHLY;BYDAY=-2FR',
    'FREQ=MONTHLY;BYMONTHDAY=1,15',
    'FREQ=MONTHLY;BYMONTHDAY=0',
    'FREQ=MONTHLY;BYMONTHDAY=32',
    'FREQ=MONTHLY;BYMONTHDAY=-2',
    'FREQ=MONTHLY;BYMONTHDAY=1;BYDAY=+1MO',
    'freq=daily',
    'FREQ=DAILY;',
    'FREQ==DAILY',
    'FREQ=DAILY;INTERVAL',
    ''
  ];

  it.each(dangerous)('string di luar subset → parseRule null dan occurrencesBetween melempar: %s', (rule) => {
    expect(parseRule(rule)).toBeNull();
    expect(isSupportedRoutine({ rrule: rule })).toBe(false);
    expect(() => occurrencesBetween(routine({ rrule: rule }), '2026-10-19', '2026-10-25')).toThrow(
      RangeError
    );
  });

  it('isSupportedRoutine: kegiatan sekali dan pola subset', () => {
    expect(isSupportedRoutine({ rrule: null })).toBe(true);
    expect(isSupportedRoutine({ rrule: 'FREQ=WEEKLY;BYDAY=MO,WE' })).toBe(true);
  });
});

describe('describeRule', () => {
  it.each<[RuleSpec, string]>([
    [{ freq: 'daily', interval: 1 }, 'Setiap hari'],
    [{ freq: 'daily', interval: 3 }, 'Setiap 3 hari'],
    [{ freq: 'weekly', interval: 1, days: ['MO', 'WE'] }, 'Setiap minggu, Senin & Rabu'],
    [{ freq: 'weekly', interval: 1, days: ['SA'] }, 'Setiap minggu, Sabtu'],
    [{ freq: 'weekly', interval: 2, days: ['MO', 'WE', 'FR'] }, 'Setiap 2 minggu, Senin, Rabu & Jumat'],
    [{ freq: 'monthly', interval: 1, by: { kind: 'monthday', day: 15 } }, 'Bulanan, tanggal 15'],
    [{ freq: 'monthly', interval: 3, by: { kind: 'monthday', day: 1 } }, 'Setiap 3 bulan, tanggal 1'],
    [
      { freq: 'monthly', interval: 2, by: { kind: 'nth', nth: 2, weekday: 'MO' } },
      'Setiap 2 bulan, Senin kedua'
    ],
    [{ freq: 'monthly', interval: 1, by: { kind: 'nth', nth: 5, weekday: 'SU' } }, 'Bulanan, Minggu kelima'],
    [
      { freq: 'monthly', interval: 1, by: { kind: 'nth', nth: -1, weekday: 'FR' } },
      'Bulanan, Jumat terakhir'
    ],
    [{ freq: 'monthly', interval: 1, by: { kind: 'monthday', day: -1 } }, 'Bulanan, hari terakhir']
  ])('%j → %s', (spec, text) => {
    expect(describeRule(spec)).toBe(text);
  });
});

describe('zona waktu perangkat', () => {
  it('hasil sama di zona mana pun, termasuk saat pergantian DST', () => {
    const previous = process.env.TZ;
    const r = routine({ rrule: 'FREQ=WEEKLY;BYDAY=SU,MO' });
    try {
      for (const tz of ['Asia/Jakarta', 'America/New_York', 'Pacific/Kiritimati', 'UTC']) {
        process.env.TZ = tz;
        // DST New York berakhir Minggu 1 Nov 2026.
        expect(dates(r, '2026-10-31', '2026-11-02'), tz).toEqual(['2026-11-01', '2026-11-02']);
        expect(weekdayOf('2026-11-01'), tz).toBe('SU');
        const biweekly = routine({ rrule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,WE', dtstart: '2026-10-21' });
        expect(dates(biweekly, '2026-10-20', '2026-11-08'), tz).toEqual([
          '2026-10-21',
          '2026-11-03',
          '2026-11-04'
        ]);
        const lastDay = routine({ rrule: 'FREQ=MONTHLY;BYMONTHDAY=-1', dtstart: '2026-10-01' });
        expect(dates(lastDay, '2026-10-01', '2027-03-01'), tz).toEqual([
          '2026-10-31',
          '2026-11-30',
          '2026-12-31',
          '2027-01-31',
          '2027-02-28'
        ]);
        const lastFriday = routine({ rrule: 'FREQ=MONTHLY;BYDAY=-1FR', dtstart: '2026-10-01' });
        expect(dates(lastFriday, '2026-10-01', '2026-11-30'), tz).toEqual(['2026-10-30', '2026-11-27']);
        const every3 = routine({ rrule: 'FREQ=DAILY;INTERVAL=3', dtstart: '2026-10-30' });
        expect(dates(every3, '2026-10-30', '2026-11-05'), tz).toEqual([
          '2026-10-30',
          '2026-11-02',
          '2026-11-05'
        ]);
      }
    } finally {
      process.env.TZ = previous;
    }
  });
});

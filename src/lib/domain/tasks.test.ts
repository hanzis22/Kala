import { describe, expect, it } from 'vitest';
import {
  CLEAR_AFTER_MS,
  compareTasks,
  filterTasks,
  isCarriedOver,
  isClearable,
  isOverdue,
  normalizeTaskInput,
  todayGroups,
  validateTaskInput,
  type TaskError,
  type TaskFilterContext,
  type TaskInput
} from './tasks';
import type { Priority, Task, TaskType } from './types';

// Hari acuan: Senin 26 Okt 2026, 10.00. Minggu ini (Senin) = 26 Okt–1 Nov.
const TODAY = '2026-10-26';
const CTX: TaskFilterContext = { today: TODAY, nowMin: 600, weekStartsOn: 1 };

const task = (over: Partial<Task> = {}): Task => ({
  id: 't',
  title: 'Tugas',
  notes: null,
  type: 'pr',
  subjectId: null,
  dueDate: null,
  dueTime: null,
  scheduledDate: null,
  startTime: null,
  durationMin: null,
  priority: 'medium',
  quadrant: null,
  status: 'todo',
  completedAt: null,
  createdAt: '2026-10-20T00:00:00.000Z',
  updatedAt: '2026-10-20T00:00:00.000Z',
  deletedAt: null,
  ...over
});

const ids = (tasks: readonly Task[]) => tasks.map((t) => t.id);

describe('normalizeTaskInput', () => {
  const input = (over: Partial<TaskInput> = {}): TaskInput => ({
    title: 'PR Fisika',
    notes: null,
    type: 'pr',
    subjectId: null,
    dueDate: null,
    dueTime: null,
    scheduledDate: null,
    startTime: null,
    durationMin: null,
    priority: 'medium',
    ...over
  });

  it('judul di-trim dan spasi berlebih dirapikan', () => {
    expect(normalizeTaskInput(input({ title: '  PR   Fisika ' })).title).toBe('PR Fisika');
  });

  it('catatan hanya di-trim di ujung, baris baru dipertahankan', () => {
    expect(normalizeTaskInput(input({ notes: '  Bab 1\n  Bab 2  ' })).notes).toBe('Bab 1\n  Bab 2');
  });

  it('teks, tanggal, dan jam kosong menjadi null', () => {
    const result = normalizeTaskInput(
      input({ notes: '   ', dueDate: '', dueTime: '', scheduledDate: '', startTime: '' })
    );
    expect(result).toMatchObject({
      notes: null,
      dueDate: null,
      dueTime: null,
      scheduledDate: null,
      startTime: null
    });
  });
});

describe('validateTaskInput', () => {
  const valid: TaskInput = {
    title: 'PR Fisika',
    notes: null,
    type: 'pr',
    subjectId: null,
    dueDate: null,
    dueTime: null,
    scheduledDate: null,
    startTime: null,
    durationMin: null,
    priority: 'medium'
  };
  const schedule = { scheduledDate: TODAY, startTime: '16:00', durationMin: 60 };
  const check = (over: Partial<TaskInput>) => validateTaskInput(normalizeTaskInput({ ...valid, ...over }));

  it.each<[string, Partial<TaskInput>, TaskError | null]>([
    ['minimal valid', {}, null],
    ['tenggat tanggal saja', { dueDate: '2026-10-30' }, null],
    ['tenggat tanggal + jam', { dueDate: '2026-10-30', dueTime: '10:00' }, null],
    ['jadwal lengkap', schedule, null],
    ['judul kosong', { title: '' }, 'title-required'],
    ['judul hanya spasi', { title: '    ' }, 'title-required'],
    ['judul 100 karakter', { title: 'a'.repeat(100) }, null],
    ['judul 101 karakter', { title: 'a'.repeat(101) }, 'title-too-long'],
    ['catatan 1000 karakter', { notes: 'a'.repeat(1000) }, null],
    ['catatan 1001 karakter', { notes: 'a'.repeat(1001) }, 'notes-too-long'],
    ['jenis di luar daftar', { type: 'kuis' as TaskType }, 'invalid-type'],
    ['prioritas di luar daftar', { priority: 'urgent' as Priority }, 'invalid-priority'],
    ['jam tenggat tanpa tanggal', { dueTime: '10:00' }, 'due-time-without-date'],
    ['tanggal tenggat tidak ada', { dueDate: '2026-02-30' }, 'invalid-due-date'],
    ['jam tenggat 24:00', { dueDate: '2026-10-30', dueTime: '24:00' }, 'invalid-due-time'],
    ['jadwal tanpa durasi', { scheduledDate: TODAY, startTime: '16:00' }, 'schedule-incomplete'],
    ['jadwal tanpa tanggal', { startTime: '16:00', durationMin: 60 }, 'schedule-incomplete'],
    ['tanggal jadwal tidak valid', { ...schedule, scheduledDate: '2026-13-01' }, 'invalid-scheduled-date'],
    ['jam mulai tidak valid', { ...schedule, startTime: '7:00' }, 'invalid-time'],
    ['23.00 + 60 = 24.00', { ...schedule, startTime: '23:00', durationMin: 60 }, null],
    ['23.00 + 61 lewat tengah malam', { ...schedule, startTime: '23:00', durationMin: 61 }, 'past-midnight'],
    ['durasi 4', { ...schedule, durationMin: 4 }, 'duration-range'],
    ['durasi 721', { ...schedule, durationMin: 721 }, 'duration-range'],
    ['durasi 1.5', { ...schedule, durationMin: 1.5 }, 'duration-range']
  ])('%s', (_, over, expected) => {
    expect(check(over)).toBe(expected);
  });
});

describe('isOverdue', () => {
  it('tugas selesai tidak pernah lewat tenggat', () => {
    expect(isOverdue(task({ status: 'done', dueDate: '2026-10-25' }), TODAY, 600)).toBe(false);
  });

  it('tanpa tenggat', () => {
    expect(isOverdue(task(), TODAY, 600)).toBe(false);
  });

  it('tenggat kemarin', () => {
    expect(isOverdue(task({ dueDate: '2026-10-25' }), TODAY, 0)).toBe(true);
  });

  it('tenggat besok', () => {
    expect(isOverdue(task({ dueDate: '2026-10-27' }), TODAY, 1439)).toBe(false);
  });

  it('tenggat hari ini tanpa jam = sampai akhir hari', () => {
    expect(isOverdue(task({ dueDate: TODAY }), TODAY, 1439)).toBe(false);
  });

  it('tenggat hari ini 10.00: belum lewat pada 10.00, lewat pada 10.01', () => {
    const t = task({ dueDate: TODAY, dueTime: '10:00' });
    expect(isOverdue(t, TODAY, 600)).toBe(false);
    expect(isOverdue(t, TODAY, 601)).toBe(true);
  });

  it('jam tenggat rusak tidak melempar', () => {
    expect(() => isOverdue(task({ dueDate: TODAY, dueTime: 'xx' }), TODAY, 1439)).not.toThrow();
    expect(isOverdue(task({ dueDate: TODAY, dueTime: 'xx' }), TODAY, 1439)).toBe(false);
  });
});

describe('filterTasks', () => {
  const tasks = [
    task({ id: 'kemarin', dueDate: '2026-10-25' }),
    task({ id: 'hari-ini-jam', dueDate: TODAY, dueTime: '13:00' }),
    task({ id: 'hari-ini', dueDate: TODAY }),
    task({ id: 'minggu', dueDate: '2026-11-01' }),
    task({ id: 'senin-depan', dueDate: '2026-11-02' }),
    task({ id: 'jadwal-hari-ini', scheduledDate: TODAY, startTime: '16:00', durationMin: 60 }),
    task({ id: 'kosong' }),
    task({ id: 'selesai', dueDate: TODAY, status: 'done', completedAt: '2026-10-26T01:00:00.000Z' })
  ];

  it('Semua: semua tugas belum selesai', () => {
    expect(ids(filterTasks(tasks, 'all', CTX))).toEqual([
      'kemarin',
      'hari-ini-jam',
      'hari-ini',
      'minggu',
      'senin-depan',
      'jadwal-hari-ini',
      'kosong'
    ]);
  });

  it('Hari ini: bertenggat atau dijadwalkan hari ini, plus lewat tenggat', () => {
    expect(ids(filterTasks(tasks, 'today', CTX))).toEqual([
      'kemarin',
      'hari-ini-jam',
      'hari-ini',
      'jadwal-hari-ini'
    ]);
  });

  it('Minggu ini: tenggat atau jadwal di minggu ini, plus lewat tenggat', () => {
    expect(ids(filterTasks(tasks, 'week', CTX))).toEqual([
      'kemarin',
      'hari-ini-jam',
      'hari-ini',
      'minggu',
      'jadwal-hari-ini'
    ]);
  });

  it('Selesai: hanya tugas selesai', () => {
    expect(ids(filterTasks(tasks, 'done', CTX))).toEqual(['selesai']);
  });

  it('Selesai: terbaru di atas, tanpa completedAt paling bawah, lalu id turun', () => {
    const done = [
      task({ id: 'a', status: 'done', completedAt: null }),
      task({ id: 'b', status: 'done', completedAt: '2026-10-20T00:00:00.000Z' }),
      task({ id: 'c', status: 'done', completedAt: '2026-10-25T00:00:00.000Z' }),
      task({ id: 'd', status: 'done', completedAt: '2026-10-20T00:00:00.000Z' }),
      task({ id: 'e', status: 'done', completedAt: null })
    ];
    expect(ids(filterTasks(done, 'done', CTX))).toEqual(['c', 'd', 'b', 'e', 'a']);
  });

  it('tugas terhapus tidak pernah masuk', () => {
    const deleted = [
      task({ id: 'hapus', dueDate: TODAY, deletedAt: '2026-10-26T01:00:00.000Z' }),
      task({ id: 'hapus-selesai', status: 'done', deletedAt: '2026-10-26T01:00:00.000Z' })
    ];
    for (const filter of ['all', 'today', 'week', 'done'] as const) {
      expect(filterTasks(deleted, filter, CTX), filter).toEqual([]);
    }
  });

  it('bertenggat minggu depan tapi dijadwalkan hari ini masuk Hari ini', () => {
    const t = task({
      id: 'x',
      dueDate: '2026-11-03',
      scheduledDate: TODAY,
      startTime: '16:00',
      durationMin: 60
    });
    expect(ids(filterTasks([t], 'today', CTX))).toEqual(['x']);
  });

  it('batas minggu mengikuti weekStartsOn (hari ini Minggu 25 Okt)', () => {
    const sunday = '2026-10-25';
    const week = [
      task({ id: 'jadwal-senin-lalu', scheduledDate: '2026-10-19', startTime: '16:00', durationMin: 60 }),
      task({ id: 'tenggat-senin', dueDate: '2026-10-26' }),
      task({ id: 'tenggat-sabtu', dueDate: '2026-10-31' }),
      task({ id: 'tenggat-minggu-depan', dueDate: '2026-11-01' })
    ];
    expect(ids(filterTasks(week, 'week', { today: sunday, nowMin: 600, weekStartsOn: 1 }))).toEqual([
      'jadwal-senin-lalu'
    ]);
    expect(ids(filterTasks(week, 'week', { today: sunday, nowMin: 600, weekStartsOn: 0 }))).toEqual([
      'tenggat-senin',
      'tenggat-sabtu'
    ]);
  });
});

describe('isCarriedOver / todayGroups', () => {
  const yesterday = { scheduledDate: '2026-10-25', durationMin: 60 };

  it('belum selesai sebelumnya vs grup utama', () => {
    const tasks = [
      task({ id: 'tanpa-tenggat', ...yesterday, startTime: '08:00' }),
      task({ id: 'tenggat-jumat', ...yesterday, startTime: '16:00', dueDate: '2026-10-30' }),
      task({ id: 'tenggat-kemarin', ...yesterday, startTime: '16:00', dueDate: '2026-10-25' }),
      task({ id: 'tenggat-hari-ini', ...yesterday, startTime: '16:00', dueDate: TODAY }),
      task({
        id: 'selesai',
        ...yesterday,
        startTime: '16:00',
        status: 'done',
        completedAt: '2026-10-25T10:00:00.000Z'
      }),
      task({ id: 'terhapus', ...yesterday, startTime: '16:00', deletedAt: '2026-10-25T10:00:00.000Z' })
    ];
    const groups = todayGroups(tasks, CTX);
    expect(ids(groups.main)).toEqual(['tenggat-kemarin', 'tenggat-hari-ini']);
    expect(ids(groups.carriedOver)).toEqual(['tanpa-tenggat', 'tenggat-jumat']);
    expect([...ids(groups.main), ...ids(groups.carriedOver)]).not.toContain('terhapus');
    expect(ids(filterTasks(tasks, 'today', CTX))).toEqual([...ids(groups.main), ...ids(groups.carriedOver)]);
    expect(isCarriedOver(tasks[4], TODAY)).toBe(false);
  });

  it('urutan: tanggal jadwal, jam mulai, lalu compareTasks', () => {
    const tasks = [
      task({ id: 'kemarin-pagi-sedang', ...yesterday, startTime: '08:00' }),
      task({ id: 'kemarin-sore', ...yesterday, startTime: '16:00' }),
      task({ id: 'kemarin-pagi-tinggi', ...yesterday, startTime: '08:00', priority: 'high' }),
      task({ id: 'kamis-malam', scheduledDate: '2026-10-22', startTime: '20:00', durationMin: 60 })
    ];
    expect(ids(todayGroups(tasks, CTX).carriedOver)).toEqual([
      'kamis-malam',
      'kemarin-pagi-tinggi',
      'kemarin-pagi-sedang',
      'kemarin-sore'
    ]);
  });

  it('main dan carriedOver tidak pernah beririsan', () => {
    const dates = [null, '2026-10-24', '2026-10-25', TODAY, '2026-10-27'];
    const tasks: Task[] = [];
    for (const dueDate of dates) {
      for (const scheduledDate of dates) {
        tasks.push(
          task({
            id: `${dueDate}|${scheduledDate}`,
            dueDate,
            scheduledDate,
            startTime: scheduledDate === null ? null : '16:00',
            durationMin: scheduledDate === null ? null : 60
          })
        );
      }
    }
    const { main, carriedOver } = todayGroups(tasks, CTX);
    const mainIds = new Set(ids(main));
    expect(carriedOver.length).toBeGreaterThan(0);
    expect(carriedOver.filter((t) => mainIds.has(t.id))).toEqual([]);
  });
});

describe('compareTasks', () => {
  // Setiap pasangan hanya berbeda di satu langkah; `first` harus di atas `second`.
  it.each<[string, Partial<Task>, Partial<Task>]>([
    ['1. bertenggat sebelum tanpa tenggat', { dueDate: '2026-11-30' }, {}],
    ['2. tanggal tenggat naik', { dueDate: '2026-10-27' }, { dueDate: '2026-10-28' }],
    ['3. jam tenggat naik', { dueDate: TODAY, dueTime: '08:00' }, { dueDate: TODAY, dueTime: '13:00' }],
    ['3. tenggat tanpa jam setelah yang berjam', { dueDate: TODAY, dueTime: '23:59' }, { dueDate: TODAY }],
    ['4. prioritas tinggi sebelum sedang', { priority: 'high' }, { priority: 'medium' }],
    ['4. prioritas sedang sebelum rendah', { priority: 'medium' }, { priority: 'low' }],
    [
      '5. tanggal jadwal lebih awal',
      { scheduledDate: TODAY, startTime: '16:00', durationMin: 60 },
      { scheduledDate: '2026-10-27', startTime: '16:00', durationMin: 60 }
    ],
    [
      '5. jam mulai lebih awal',
      { scheduledDate: TODAY, startTime: '08:00', durationMin: 60 },
      { scheduledDate: TODAY, startTime: '16:00', durationMin: 60 }
    ],
    ['5. berjadwal sebelum tanpa jadwal', { scheduledDate: TODAY, startTime: '16:00', durationMin: 60 }, {}],
    [
      '6. dibuat lebih dulu',
      { createdAt: '2026-10-20T00:00:00.000Z' },
      { createdAt: '2026-10-21T00:00:00.000Z' }
    ],
    ['7. id naik', { id: '01A' }, { id: '01B' }]
  ])('%s', (_, first, second) => {
    const a = task({ id: 'x', ...first });
    const b = task({ id: 'x', ...second });
    expect(compareTasks(a, b)).toBeLessThan(0);
    expect(compareTasks(b, a)).toBeGreaterThan(0);
  });

  it('tenggat hari ini 08.00 yang sudah lewat tetap di atas tenggat hari ini tanpa jam', () => {
    const tasks = [
      task({ id: 'tanpa-jam', dueDate: TODAY }),
      task({ id: 'pagi', dueDate: TODAY, dueTime: '08:00' })
    ];
    expect(ids(filterTasks(tasks, 'today', CTX))).toEqual(['pagi', 'tanpa-jam']);
  });
});

describe('isClearable', () => {
  const NOW = '2026-11-02T10:00:00.000Z';
  const done = (completedAt: string | null, over: Partial<Task> = {}) =>
    task({ status: 'done', completedAt, ...over });

  it('batas eksklusif 7 × 24 jam', () => {
    expect(CLEAR_AFTER_MS).toBe(604_800_000);
    expect(isClearable(done('2026-10-26T10:00:00.000Z'), NOW)).toBe(false);
    expect(isClearable(done('2026-10-26T09:59:59.999Z'), NOW)).toBe(true);
    expect(isClearable(done('2026-10-26T11:00:00.000Z'), NOW)).toBe(false);
  });

  it('completedAt kosong atau rusak tidak pernah dibersihkan', () => {
    expect(isClearable(done(null), NOW)).toBe(false);
    expect(isClearable(done('bukan-tanggal'), NOW)).toBe(false);
  });

  it('belum selesai atau sudah terhapus', () => {
    expect(isClearable(done('2026-10-01T00:00:00.000Z', { status: 'todo' }), NOW)).toBe(false);
    expect(isClearable(done('2026-10-01T00:00:00.000Z', { deletedAt: NOW }), NOW)).toBe(false);
  });
});

describe('zona waktu perangkat', () => {
  it('filter Minggu ini dan grup Hari ini sama di zona mana pun, termasuk saat pergantian DST', () => {
    const previous = process.env.TZ;
    // DST New York berakhir Minggu 1 Nov 2026.
    const sunday = '2026-11-01';
    const tasks = [
      task({ id: 'tenggat-senin-lalu', dueDate: '2026-10-26' }),
      task({ id: 'tenggat-minggu', dueDate: sunday }),
      task({ id: 'tenggat-senin', dueDate: '2026-11-02' }),
      task({ id: 'jadwal-sabtu', scheduledDate: '2026-10-31', startTime: '16:00', durationMin: 60 })
    ];
    try {
      for (const tz of ['Asia/Jakarta', 'America/New_York', 'Pacific/Kiritimati', 'UTC']) {
        process.env.TZ = tz;
        const ctx = { today: sunday, nowMin: 600 };
        expect(ids(filterTasks(tasks, 'week', { ...ctx, weekStartsOn: 1 })), tz).toEqual([
          'tenggat-senin-lalu',
          'tenggat-minggu',
          'jadwal-sabtu'
        ]);
        expect(ids(filterTasks(tasks, 'week', { ...ctx, weekStartsOn: 0 })), tz).toEqual([
          'tenggat-senin-lalu',
          'tenggat-minggu',
          'tenggat-senin'
        ]);
        const groups = todayGroups(tasks, { ...ctx, weekStartsOn: 1 });
        expect(ids(groups.main), tz).toEqual(['tenggat-senin-lalu', 'tenggat-minggu']);
        expect(ids(groups.carriedOver), tz).toEqual(['jadwal-sabtu']);
      }
    } finally {
      process.env.TZ = previous;
    }
  });
});

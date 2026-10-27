/**
 * Semua teks UI Kala. Bahasa Indonesia, sapaan "kamu".
 * Dikumpulkan di sini agar siap i18n (Paraglide, Fase 3).
 */
import type { TaskRepoError } from '$lib/data/repo/tasks';
import type { Weekday } from '$lib/domain/recurrence';
import type { TaskError, TaskFilter } from '$lib/domain/tasks';
import type { PrayerName, Priority, RoutineKind, TaskType } from '$lib/domain/types';

export const copy = {
  appName: 'Kala',
  loading: 'Memuat…',

  common: {
    close: 'Tutup',
    save: 'Simpan',
    cancel: 'Batal',
    delete: 'Hapus'
  },

  weekdays: {
    short: { MO: 'Sen', TU: 'Sel', WE: 'Rab', TH: 'Kam', FR: 'Jum', SA: 'Sab', SU: 'Min' },
    long: {
      MO: 'Senin',
      TU: 'Selasa',
      WE: 'Rabu',
      TH: 'Kamis',
      FR: 'Jumat',
      SA: 'Sabtu',
      SU: 'Minggu'
    }
  } satisfies Record<'short' | 'long', Record<Weekday, string>>,

  /** Kalimat pola rutin (dipakai describeRule di domain). */
  recurrence: {
    daily: (n: number) => (n === 1 ? 'Setiap hari' : `Setiap ${n} hari`),
    weekly: (n: number) => (n === 1 ? 'Setiap minggu' : `Setiap ${n} minggu`),
    monthly: (n: number) => (n === 1 ? 'Bulanan' : `Setiap ${n} bulan`),
    monthday: (day: number) => `tanggal ${day}`,
    lastDay: 'hari terakhir',
    /** nth: 1–5, atau -1 = terakhir. */
    ordinal: (nth: number) =>
      nth === -1 ? 'terakhir' : (['pertama', 'kedua', 'ketiga', 'keempat', 'kelima'][nth - 1] ?? `ke-${nth}`),
    nthWeekday: (day: string, ordinal: string) => `${day} ${ordinal}`,
    joinList: (items: readonly string[]) =>
      items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`
  },

  nav: {
    label: 'Navigasi utama',
    today: 'Hari Ini',
    schedule: 'Jadwal',
    tasks: 'Tugas',
    worship: 'Ibadah',
    more: 'Lainnya'
  },

  pages: {
    today: {
      title: 'Hari Ini',
      emptyTitle: 'Harimu masih kosong',
      emptyBody: 'Jadwal sholat, prioritas, dan agenda harianmu akan tampil di sini.'
    },
    schedule: {
      title: 'Jadwal',
      emptyTitle: 'Belum ada jadwal',
      emptyBody: 'Jadwal pelajaran dan rutinmu akan tampil di sini.'
    },
    subjects: {
      title: 'Mata pelajaran'
    },
    tasks: {
      title: 'Tugas',
      emptyTitle: 'Belum ada tugas',
      emptyBody: 'PR, tugas, dan ujianmu akan tampil di sini.'
    },
    worship: {
      title: 'Ibadah'
    },
    more: {
      title: 'Lainnya',
      emptyTitle: 'Segera hadir',
      emptyBody: 'Pengaturan, cadangan data, dan fitur lain akan tampil di sini.'
    }
  },

  onboarding: {
    title: 'Selamat datang di Kala',
    body: 'Satu tempat untuk jadwal belajar, ibadah, dan rutinitasmu. Semua data tersimpan di perangkat ini, tanpa akun.',
    start: 'Mulai'
  },

  notFound: {
    title: 'Halaman tidak ditemukan',
    body: 'Alamat ini tidak ada di Kala.',
    back: 'Kembali ke Hari Ini'
  },

  error: {
    title: 'Ada yang tidak beres',
    body: 'Coba muat ulang halaman ini.'
  },

  prayer: {
    names: {
      subuh: 'Subuh',
      dzuhur: 'Dzuhur',
      ashar: 'Ashar',
      maghrib: 'Maghrib',
      isya: 'Isya'
    } satisfies Record<PrayerName, string>,
    imsak: 'Imsak',
    terbit: 'Terbit',
    dhuha: 'Dhuha'
  },

  worship: {
    scheduleHeading: 'Jadwal sholat hari ini',
    method: 'Metode Kemenag',
    noteDone: 'Sudah',
    noteDoneCongregation: 'Sudah · berjamaah',
    noteNow: (minutes: number) => (minutes < 1 ? 'Baru saja masuk' : `Sudah masuk ${minutes} menit lalu`),
    noteMissed: 'Belum dicatat',
    noteUpcoming: (time: string) => `Masuk pukul ${time}`,
    mark: 'Tandai',
    markLabel: (name: string) => `Tandai sudah sholat ${name}`,
    doneLabel: (name: string) => `Sudah sholat ${name}. Ubah catatan`,
    weekHeading: 'Konsistensi minggu ini',
    weekSummary: (done: number, total: number) => `${done} / ${total}`,
    weekAria: (done: number, total: number) =>
      `Sholat 5 waktu, 7 hari terakhir: ${done} dari ${total} sudah dicatat`,
    legendDone: 'Sudah',
    legendNow: 'Sekarang',
    legendOther: 'Terlewat / belum',
    noLocationTitle: 'Pilih lokasimu dulu',
    noLocationBody: 'Waktu sholat dihitung dari lokasimu, sepenuhnya di perangkat ini.',
    noLocationAction: 'Pilih lokasi',
    logSheetTitle: (name: string, time: string) => `${name} · dicatat ${time}`,
    logSheetDescription: 'Catatan ini hanya tersimpan di perangkatmu.',
    congregation: 'Berjamaah',
    undo: 'Batalkan catatan'
  },

  location: {
    changeLabel: (label: string) => `Lokasi: ${label}. Ganti lokasi`,
    pickTitle: 'Pilih lokasi',
    pickDescription: 'Dipakai untuk menghitung waktu sholat. Disimpan hanya di perangkat ini.',
    searchLabel: 'Cari kota atau kabupaten',
    useMyLocation: 'Pakai lokasi saya',
    locating: 'Mencari lokasimu…',
    gpsDenied: 'Izin lokasi tidak diberikan. Kamu tetap bisa memilih kota dari daftar.',
    gpsUnavailable: 'Lokasi belum bisa didapat. Pilih kota dari daftar.',
    capitalsHeading: 'Ibu kota provinsi',
    resultsHeading: 'Hasil pencarian',
    noResults: 'Tidak ada kota yang cocok.',
    loadingCities: 'Memuat daftar kota…',
    loadFailed: 'Daftar kota gagal dimuat. Coba buka lagi.'
  },

  schedule: {
    subjectsLink: 'Mapel',
    subjectsLinkLabel: 'Kelola mata pelajaran',
    weekHeading: 'Minggu ini',
    weekAria: (range: string) => `Jadwal pelajaran ${range}`,
    noSubjectsTitle: 'Mulai dari mata pelajaran',
    noSubjectsBody:
      'Tambahkan mapelmu dulu, lalu isi jam pelajarannya sekali saja. Jadwal ini tampil otomatis setiap minggu.',
    noSubjectsAction: 'Kelola mapel',
    noSessionsTitle: 'Belum ada jam pelajaran',
    noSessionsBody: 'Ketuk + untuk menambah sesi kelas pertamamu.',
    addSession: 'Tambah sesi kelas',
    todayMarker: 'hari ini',
    blockLabel: (subject: string, day: string, start: string, end: string, room: string | null) =>
      `${subject}, ${day} ${start}–${end}${room ? `, ruang ${room}` : ''}. Ubah sesi`,
    clashLabel: (n: number, day: string, start: string, end: string, subjects: string) =>
      `${n} sesi bentrok, ${day} ${start}–${end}: ${subjects}. Pilih sesi`,
    pickTitle: 'Pilih sesi',
    pickDescription: (day: string) => `Jam sesi ini bertumpuk di hari ${day}. Pilih yang ingin kamu ubah.`,
    pickItemLabel: (subject: string, start: string, end: string) => `Ubah ${subject}, ${start}–${end}`,
    viewGroupLabel: 'Tampilan jadwal',
    viewDay: 'Hari',
    viewWeek: 'Minggu',
    dayToday: 'Hari ini',
    dayPrev: 'Hari sebelumnya',
    dayNext: 'Hari berikutnya',
    dayEmpty: 'Tidak ada kelas, rutin, atau kegiatan di hari ini.',
    kindTag: { class: 'Kelas', routine: 'Rutin', event: 'Kegiatan' } satisfies Record<RoutineKind, string>,
    overridden: 'Jam diubah',
    skipped: 'Dilewati',
    restore: 'Kembalikan',
    restoreLabel: (title: string) => `Kembalikan ${title}`,
    dayItemLabel: (title: string, time: string, overridden: boolean) =>
      `${title}, ${time}${overridden ? ', jam diubah' : ''}. Ubah`
  },

  subjects: {
    back: 'Kembali ke Jadwal',
    listHeading: 'Daftar mapel',
    emptyTitle: 'Belum ada mapel',
    emptyBody: 'Tambahkan mata pelajaran yang kamu ikuti. Guru dan ruang boleh dikosongkan.',
    add: 'Tambah mapel',
    sessions: (n: number) => (n === 0 ? 'Belum ada sesi' : `${n} sesi per minggu`),
    editLabel: (name: string) => `Ubah ${name}`,
    sheetAddTitle: 'Tambah mapel',
    sheetEditTitle: 'Ubah mapel',
    sheetDescription: 'Tersimpan hanya di perangkat ini.',
    name: 'Nama mapel',
    namePlaceholder: 'Misal: Matematika',
    abbr: 'Singkatan',
    abbrHint: 'Tampil di jadwal mingguan. Paling pas 2–4 huruf, misal MTK.',
    teacher: 'Guru',
    room: 'Ruang',
    optional: 'opsional',
    delete: 'Hapus mapel',
    confirmTitle: (name: string) => `Hapus ${name}?`,
    confirmBody: (n: number) =>
      n === 0
        ? 'Mapel ini akan dihapus dari daftarmu.'
        : `${n} sesi kelas per minggu ikut dihapus dari jadwal. Tugas yang sudah ada tetap tersimpan.`,
    confirmAction: 'Ya, hapus',
    errors: {
      'name-required': 'Nama mapel wajib diisi.',
      'name-too-long': 'Nama mapel maksimal 60 karakter.',
      'name-duplicate': 'Mapel dengan nama ini sudah ada.',
      'abbr-too-long': 'Singkatan maksimal 6 karakter.',
      'detail-too-long': 'Guru dan ruang maksimal 40 karakter.',
      'not-found': 'Mapel ini sudah tidak ada.'
    } as Record<string, string>
  },

  session: {
    sheetAddTitle: 'Tambah sesi kelas',
    sheetEditTitle: 'Ubah sesi kelas',
    sheetDescription: 'Sesi berulang setiap minggu di hari yang kamu pilih.',
    subject: 'Mapel',
    noSubjects: 'Belum ada mapel. Tambahkan dulu, lalu kembali ke sini.',
    addSubject: 'Tambah mapel',
    days: 'Hari',
    startTime: 'Jam mulai',
    duration: 'Durasi (menit)',
    endsAt: (time: string) => `Selesai pukul ${time}`,
    room: 'Ruang',
    roomHint: 'Terisi dari ruang mapel. Ubah jika sesi ini di ruang lain.',
    sundayHidden: 'Kolom Minggu sedang disembunyikan. Aktifkan di tab Lainnya.',
    delete: 'Hapus sesi',
    confirmTitle: 'Hapus sesi ini?',
    confirmBody: (subject: string, days: string) => `${subject} setiap ${days} dihapus dari jadwal.`,
    confirmAction: 'Ya, hapus',
    errors: {
      'subject-required': 'Pilih mapel dulu.',
      'days-required': 'Pilih minimal satu hari.',
      'invalid-time': 'Jam mulai belum diisi.',
      'duration-range': 'Durasi 5–720 menit.',
      'past-midnight': 'Sesi harus selesai paling lambat pukul 24.00.',
      'location-too-long': 'Ruang maksimal 40 karakter.',
      'not-found': 'Sesi ini sudah tidak ada.',
      'not-occurrence': 'Tanggal ini bukan jadwal sesi ini.'
    } as Record<string, string>,
    fromDescription: (date: string) => `Perubahan berlaku mulai ${date}. Jadwal sebelumnya tetap.`,
    deleteFrom: 'Hapus mulai tanggal ini'
  },

  routine: {
    heading: 'Rutin',
    add: 'Tambah rutin',
    empty: 'Belum ada rutin. Tambahkan les, olahraga, atau murajaah yang berulang.',
    editLabel: (title: string, rule: string) => `Ubah ${title}, ${rule}`,
    untilLabel: (date: string) => `Sampai ${date}`,
    fromLabel: (date: string) => `Mulai ${date}`,
    unsupported: 'Pola ini tidak bisa diubah di Kala',
    untitled: 'Tanpa judul',
    deleteLabel: (title: string) => `Hapus ${title}`,
    sheetAddTitle: 'Tambah rutin',
    sheetEditTitle: 'Ubah rutin',
    sheetFromTitle: (date: string) => `Ubah rutin mulai ${date}`,
    sheetDescription: 'Muncul otomatis sesuai pola yang kamu pilih.',
    title: 'Judul',
    titlePlaceholder: 'Misal: Les bahasa Inggris',
    pattern: 'Pola',
    freq: { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan' },
    every: 'Setiap',
    interval: 'Jarak pengulangan',
    unit: { daily: 'hari', weekly: 'minggu', monthly: 'bulan' },
    days: 'Hari',
    monthly: 'Muncul pada',
    monthday: 'Tanggal',
    monthdaySelect: 'Tanggal setiap bulan',
    nth: 'Hari ke-',
    nthSelect: 'Urutan hari',
    nthWeekdaySelect: 'Hari',
    nthOptions: [
      [1, 'Pertama'],
      [2, 'Kedua'],
      [3, 'Ketiga'],
      [4, 'Keempat'],
      [5, 'Kelima'],
      [-1, 'Terakhir']
    ] as const,
    lastDay: 'Hari terakhir bulan',
    monthdayHint: (day: number) =>
      `Bulan tanpa tanggal ${day} dilewati. Pilih "Hari terakhir bulan" agar tetap muncul di akhir bulan.`,
    startTime: 'Jam mulai',
    duration: 'Durasi (menit)',
    endsAt: (time: string) => `Selesai pukul ${time}`,
    dtstart: 'Tanggal mulai',
    dtstartLocked: 'Perubahan berlaku mulai tanggal ini. Jadwal sebelumnya tetap.',
    until: 'Tanggal akhir',
    optional: 'opsional',
    preview: 'Pratinjau',
    delete: 'Hapus rutin',
    deleteFrom: 'Hapus mulai tanggal ini',
    confirmTitle: (title: string) => `Hapus ${title}?`,
    confirmBody: 'Seluruh jadwal rutin ini dihapus.',
    confirmFromTitle: (date: string) => `Hapus mulai ${date}?`,
    confirmFromBody: (title: string, date: string) =>
      `${title} tidak muncul lagi mulai ${date}. Jadwal sebelumnya tetap ada.`,
    confirmAction: 'Ya, hapus',
    errors: {
      'title-required': 'Judul rutin wajib diisi.',
      'title-too-long': 'Judul rutin maksimal 60 karakter.',
      'days-required': 'Pilih minimal satu hari.',
      'interval-range': 'Jarak pengulangan 1–99.',
      'monthday-range': 'Pilih tanggal atau hari dalam bulan.',
      'invalid-time': 'Jam mulai belum diisi.',
      'duration-range': 'Durasi 5–720 menit.',
      'past-midnight': 'Rutin harus selesai paling lambat pukul 24.00.',
      'location-too-long': 'Tempat maksimal 40 karakter.',
      'invalid-dtstart': 'Tanggal mulai belum diisi.',
      'until-before-start': 'Tanggal akhir tidak boleh sebelum tanggal mulai.',
      'not-found': 'Rutin ini sudah tidak ada.',
      'not-occurrence': 'Tanggal ini bukan jadwal rutin ini.'
    } as Record<string, string>
  },

  occurrence: {
    title: (name: string, date: string) => `${name} · ${date}`,
    description: 'Pilih perubahan untuk jadwal ini.',
    onlyThis: 'Hanya tanggal ini',
    onlyThisNote: 'Ubah satu tanggal hanya mengganti jam dan durasi.',
    save: 'Simpan untuk tanggal ini',
    clear: 'Kembalikan jam semula',
    skip: 'Lewati tanggal ini',
    fromThis: 'Tanggal ini dan seterusnya',
    fromThisNote: 'Ubah pola, hari, atau detail lain mulai tanggal ini.',
    errors: {
      'invalid-time': 'Jam mulai belum diisi.',
      'duration-range': 'Durasi 5–720 menit.',
      'past-midnight': 'Harus selesai paling lambat pukul 24.00.',
      'not-found': 'Jadwal ini sudah tidak ada.',
      'not-occurrence': 'Tanggal ini sudah tidak ada di jadwal.'
    } as Record<string, string>
  },

  tasks: {
    filterLabel: 'Filter tugas',
    filters: { all: 'Semua', today: 'Hari ini', week: 'Minggu ini', done: 'Selesai' } satisfies Record<
      TaskFilter,
      string
    >,
    count: (n: number) => `${n} tugas`,
    /** Filter Semua memakai ulang copy.pages.tasks.emptyTitle/emptyBody. */
    empty: {
      today: {
        title: 'Tidak ada tugas untuk hari ini',
        body: 'Tugas yang bertenggat atau dijadwalkan hari ini tampil di sini.'
      },
      week: {
        title: 'Tidak ada tugas minggu ini',
        body: 'Tugas yang bertenggat atau dijadwalkan minggu ini tampil di sini.'
      },
      done: { title: 'Belum ada tugas selesai', body: 'Tugas yang kamu tandai selesai tampil di sini.' }
    },
    carriedOverHeading: 'Belum selesai sebelumnya',
    add: 'Tambah tugas',
    types: {
      pr: 'PR',
      tugas: 'Tugas',
      ujian: 'Ujian',
      proyek: 'Proyek',
      lainnya: 'Lainnya'
    } satisfies Record<TaskType, string>,
    priorities: { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' } satisfies Record<Priority, string>,
    meta: {
      /** day = 'Sel, 27 Okt', time = '10.00' | null */
      due: (day: string, time: string | null) => `Tenggat ${day}${time ? ` · ${time}` : ''}`,
      /** day = 'Sen 26 Okt' */
      scheduled: (day: string, start: string, end: string) => `Dikerjakan ${day} ${start}–${end}`,
      doneOn: (day: string) => `Selesai ${day}`,
      priorityHigh: 'Prioritas tinggi',
      overdue: 'Lewat tenggat',
      subjectDeleted: (name: string | null) => (name ? `${name} (dihapus)` : 'Mapel (dihapus)')
    },
    aria: {
      markDone: (title: string) => `Tandai selesai: ${title}`,
      markUndone: (title: string) => `Batalkan selesai: ${title}`,
      /** due = 'Sel, 27 Okt · 10.00' | null */
      row: (title: string, due: string | null, overdue: boolean, done: boolean) =>
        `${title}${due ? `, tenggat ${due}` : ''}${overdue ? ', lewat tenggat' : ''}${done ? ', selesai' : ''}. Ubah`
    },
    sheet: {
      addTitle: 'Tambah tugas',
      editTitle: 'Ubah tugas',
      description: 'Tersimpan hanya di perangkat ini.',
      title: 'Judul',
      titlePlaceholder: 'Misal: PR Fisika bab 3',
      type: 'Jenis',
      subject: 'Mapel',
      noSubject: 'Tanpa mapel',
      priority: 'Prioritas',
      due: 'Tenggat',
      dueDate: 'Tanggal tenggat',
      dueTime: 'Jam tenggat',
      clearDueTime: 'Hapus jam',
      schedule: 'Jadwalkan pengerjaan',
      scheduledDate: 'Tanggal pengerjaan',
      startTime: 'Jam mulai',
      duration: 'Durasi (menit)',
      endsAt: (time: string) => `Selesai pukul ${time}`,
      notes: 'Catatan',
      optional: 'opsional',
      delete: 'Hapus tugas'
    },
    clear: 'Bersihkan yang selesai',
    clearTitle: (n: number) => `Bersihkan ${n} tugas?`,
    clearBody: 'Tugas yang selesai lebih dari 7 hari lalu akan dihapus.',
    clearAction: 'Bersihkan',
    deleted: 'Dihapus',
    cleared: (n: number) => `${n} tugas dibersihkan`,
    errors: {
      'title-required': 'Judul tugas wajib diisi.',
      'title-too-long': 'Judul tugas maksimal 100 karakter.',
      'notes-too-long': 'Catatan maksimal 1000 karakter.',
      'invalid-type': 'Pilih jenis tugas.',
      'invalid-priority': 'Pilih prioritas.',
      'invalid-due-date': 'Tanggal tenggat tidak valid.',
      'invalid-due-time': 'Jam tenggat tidak valid.',
      'due-time-without-date': 'Isi tanggal tenggat dulu sebelum jamnya.',
      'schedule-incomplete': 'Lengkapi tanggal, jam mulai, dan durasi pengerjaan.',
      'invalid-scheduled-date': 'Tanggal pengerjaan tidak valid.',
      'invalid-time': 'Jam mulai belum diisi.',
      'duration-range': 'Durasi 5–720 menit.',
      'past-midnight': 'Pengerjaan harus selesai paling lambat pukul 24.00.',
      'subject-not-found': 'Mapel ini sudah tidak ada. Pilih mapel lain.',
      'not-found': 'Tugas ini sudah tidak ada.'
    } satisfies Record<TaskError | TaskRepoError, string>
  },

  toast: {
    undo: 'Urungkan',
    close: 'Tutup'
  },

  moreSettings: {
    scheduleHeading: 'Jadwal',
    showSunday: 'Tampilkan Minggu di jadwal',
    showSundayHint: 'Untuk kelas atau les di hari Minggu.'
  },

  update: {
    message: 'Versi baru tersedia',
    reload: 'Muat ulang',
    dismiss: 'Tutup pemberitahuan'
  }
} as const;

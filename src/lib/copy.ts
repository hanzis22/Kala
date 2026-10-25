/**
 * Semua teks UI Kala. Bahasa Indonesia, sapaan "kamu".
 * Dikumpulkan di sini agar siap i18n (Paraglide, Fase 3).
 */
import type { Weekday } from '$lib/domain/recurrence';
import type { PrayerName, RoutineKind } from '$lib/domain/types';

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
      'not-found': 'Sesi ini sudah tidak ada.'
    } as Record<string, string>
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

/**
 * Semua teks UI Kala. Bahasa Indonesia, sapaan "kamu".
 * Dikumpulkan di sini agar siap i18n (Paraglide, Fase 3).
 */
export const copy = {
  appName: 'Kala',
  loading: 'Memuat…',

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
    tasks: {
      title: 'Tugas',
      emptyTitle: 'Belum ada tugas',
      emptyBody: 'PR, tugas, dan ujianmu akan tampil di sini.'
    },
    worship: {
      title: 'Ibadah',
      emptyTitle: 'Jadwal sholat belum tersedia',
      emptyBody: 'Waktu sholat untuk lokasimu dan catatan sholatmu akan tampil di sini.'
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

  update: {
    message: 'Versi baru tersedia',
    reload: 'Muat ulang',
    dismiss: 'Tutup pemberitahuan'
  }
} as const;

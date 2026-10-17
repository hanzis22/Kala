/**
 * Semua teks UI Kala. Bahasa Indonesia, sapaan "kamu".
 * Dikumpulkan di sini agar siap i18n (Paraglide, Fase 3).
 */
import type { PrayerName } from '$lib/domain/types';

export const copy = {
  appName: 'Kala',
  loading: 'Memuat…',

  common: {
    close: 'Tutup'
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

  update: {
    message: 'Versi baru tersedia',
    reload: 'Muat ulang',
    dismiss: 'Tutup pemberitahuan'
  }
} as const;

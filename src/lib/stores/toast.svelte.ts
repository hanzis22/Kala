export interface ToastAction {
  label: string;
  /** Selesai tanpa melempar = toast ditutup (termasuk urungkan basi yang mengembalikan false). */
  run: () => unknown;
}

export interface ToastOptions {
  message: string;
  action?: ToastAction;
}

/**
 * Satu toast global (UndoToast di root layout). Tanpa timer (WCAG 2.2.1, Ledger F6):
 * tertutup hanya lewat ✕, Escape di dalam toast, toast berikutnya, atau aksi yang berhasil.
 */
class ToastStore {
  /** id naik di setiap show agar pesan yang sama dirender ulang dan dibacakan lagi. */
  current = $state<(ToastOptions & { id: number }) | null>(null);
  #nextId = 1;

  /** Menggantikan toast yang sedang tampil. */
  show(options: ToastOptions): void {
    this.current = { ...options, id: this.#nextId++ };
  }

  dismiss(): void {
    this.current = null;
  }

  /** Menjalankan aksi; jika gagal (melempar), toast tetap tampil agar bisa dicoba lagi. */
  async runAction(): Promise<void> {
    const shown = this.current;
    if (!shown?.action) return;
    try {
      await shown.action.run();
    } catch (err) {
      console.error('[toast] aksi gagal', err);
      return;
    }
    if (this.current?.id === shown.id) this.current = null;
  }
}

export const toast = new ToastStore();

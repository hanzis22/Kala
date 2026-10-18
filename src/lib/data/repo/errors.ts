/** Galat validasi dari repo. `code` dipetakan ke teks UI di copy.ts. UI sebaiknya memvalidasi lebih dulu. */
export class ValidationError<Code extends string = string> extends Error {
  constructor(readonly code: Code) {
    super(`Validasi gagal: ${code}`);
    this.name = 'ValidationError';
  }
}

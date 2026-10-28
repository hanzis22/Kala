<script lang="ts">
  /**
   * 3 prioritas hari ini (PRD §F2, rencana F2 §5, Usulan #7/#16/#29/#30). Satu state lokal untuk ketiga baris;
   * semua tulis (teks dan centang) dirakit dari state itu. Simpan dengan debounce + flush saat keluar kartu,
   * Enter, halaman tersembunyi, dan pagehide. Sinkron dari store hanya saat tidak ada fokus di kartu dan
   * tidak ada tulis yang belum tercermin di store. Dirender setelah load pertama store `day` dan tidak
   * di-unmount saat `day.loaded` = false (tengah malam), agar fokus tidak hilang.
   */
  import { untrack } from 'svelte';
  import { copy } from '$lib/copy';
  import { setPriorities } from '$lib/data/repo/dayEntries';
  import { MAX_PRIORITIES, MAX_PRIORITY_TEXT, normalizePriorities } from '$lib/domain/day';
  import type { LocalDate, Priority3Item } from '$lib/domain/types';
  import { day } from '$lib/stores/day.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { today } from '$lib/stores/today.svelte';

  const t = copy.today.priorities;
  const DEBOUNCE_MS = 500;

  const keyOf = (items: readonly Priority3Item[]) =>
    JSON.stringify(items.map((i) => ({ text: i.text, done: i.done })));
  const rows = (items: readonly Priority3Item[]): Priority3Item[] =>
    Array.from({ length: MAX_PRIORITIES }, (_, i) => ({
      text: items[i]?.text ?? '',
      done: items[i]?.done ?? false
    }));

  let local = $state<Priority3Item[]>(rows([]));
  /** Tanggal edit dimulai (#22): flush menulis ke sini, bukan ke `today.current` saat flush. */
  let editDate: LocalDate = today.current;
  /** Versi tersimpan terakhir untuk `editDate` (sudah dinormalisasi). */
  let saved = $state<Priority3Item[]>([]);
  /** Tulis terakhir ke `editDate` yang belum tercermin di store; emisi lain (lebih lama) diabaikan. */
  let awaitingKey = $state<string | null>(null);
  let seenKey: string | null = null;
  let focusedInside = $state(false);
  let debouncing = $state(false);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let cardEl = $state<HTMLElement>();

  const filled = $derived(local.filter((i) => i.text.trim() !== ''));
  const doneCount = $derived(filled.filter((i) => i.done).length);

  function clearTimer() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    debouncing = false;
  }

  async function write(date: LocalDate, items: Priority3Item[]) {
    const key = keyOf(items);
    if (date === editDate) awaitingKey = key;
    try {
      await setPriorities(date, items, new Date().toISOString());
      // Flush tanggal lama yang selesai setelah pergantian hari tidak boleh mengubah `saved` tanggal baru.
      if (date === editDate) saved = items;
    } catch (err) {
      console.error('[PrioritiesCard] gagal menyimpan prioritas', err);
      if (awaitingKey === key) awaitingKey = null;
      toast.show({ message: copy.error.body });
    }
  }

  function flush() {
    clearTimer();
    const items = normalizePriorities(local);
    // Baris kosong naik hanya saat fokus di luar kartu, agar input yang sedang diketik tidak bergeser.
    if (!focusedInside) local = rows(items);
    if (keyOf(items) === keyOf(saved)) return;
    void write(editDate, items);
  }

  function scheduleFlush() {
    if (timer !== null) clearTimeout(timer);
    debouncing = true;
    timer = setTimeout(flush, DEBOUNCE_MS);
  }

  // Sinkron dari store: hanya untuk tanggal yang sedang diedit, saat kartu tidak fokus dan tidak ada edit tertunda.
  $effect(() => {
    if (!day.loaded || day.date !== today.current || day.date !== editDate) return;
    const stored = day.entry?.priorities ?? [];
    const key = keyOf(stored);
    if (awaitingKey !== null) {
      if (key !== awaitingKey) return;
      awaitingKey = null;
    }
    if (key === seenKey || focusedInside || debouncing) return;
    if (keyOf(normalizePriorities(local)) !== keyOf(saved)) return; // tulis gagal: state lokal dipertahankan
    seenKey = key;
    saved = stored.map((i) => ({ text: i.text, done: i.done }));
    local = rows(saved);
  });

  // Pergantian hari saat kartu terbuka (Usulan #30): snapshot dulu, reset, baru tulis ke tanggal lama.
  $effect(() => {
    const current = today.current;
    untrack(() => {
      if (current === editDate) return;
      clearTimer();
      const items = normalizePriorities(local);
      const snapshot = keyOf(items) !== keyOf(saved) ? { date: editDate, items } : null;
      local = rows([]);
      saved = [];
      awaitingKey = null;
      seenKey = null;
      editDate = current;
      if (snapshot) void write(snapshot.date, snapshot.items);
    });
  });

  $effect(() => {
    const onvisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onvisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onvisibility);
      window.removeEventListener('pagehide', flush);
      // Pindah tab saat debounce berjalan: edit tidak hilang.
      if (timer !== null) flush();
    };
  });

  function onfocusin() {
    focusedInside = true;
  }

  function onfocusout(event: FocusEvent) {
    const to = event.relatedTarget;
    if (to instanceof Node && cardEl?.contains(to)) return;
    focusedInside = false;
    flush();
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      flush();
    }
  }

  function ontoggle(index: number, checked: boolean) {
    local[index].done = checked;
    flush();
  }
</script>

<section
  bind:this={cardEl}
  aria-labelledby="priorities-heading"
  class="flex flex-col gap-3 rounded-xl border border-line bg-card p-5"
  {onfocusin}
  {onfocusout}
>
  <div class="flex items-baseline justify-between gap-3">
    <h2 id="priorities-heading" class="text-heading-md font-extrabold text-ink">{t.heading}</h2>
    {#if filled.length > 0}
      <p class="text-label font-semibold text-muted tabular-nums">{t.count(doneCount, filled.length)}</p>
    {/if}
  </div>

  <ul class="flex flex-col gap-2">
    {#each local as item, i (i)}
      {@const empty = item.text.trim() === ''}
      <li class="flex items-center gap-1">
        <label class="flex size-11 shrink-0 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            class="size-5 accent-brand"
            checked={item.done && !empty}
            disabled={empty}
            aria-label={t.checkLabel(empty ? t.inputLabel(i + 1) : item.text.trim())}
            onchange={(e) => ontoggle(i, e.currentTarget.checked)}
          />
        </label>
        <input
          type="text"
          bind:value={item.text}
          maxlength={MAX_PRIORITY_TEXT}
          aria-label={t.inputLabel(i + 1)}
          placeholder={t.placeholder}
          class={[
            'min-h-11 w-full min-w-0 rounded-md border border-line bg-ground px-4 text-field placeholder:text-muted',
            item.done && !empty ? 'text-muted line-through' : 'text-ink'
          ]}
          oninput={scheduleFlush}
          {onkeydown}
        />
      </li>
    {/each}
  </ul>
</section>

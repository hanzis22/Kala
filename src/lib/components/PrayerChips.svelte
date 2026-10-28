<script lang="ts">
  /**
   * Chip 5 sholat Hari Ini (PRD §F2, rencana F2 §4, Usulan #2/#28/#31). Status dari `prayerStatus` untuk
   * tanggal yang sama dengan Ibadah (store `today`), jam di zona lokasi. Status dibedakan oleh ikon + label
   * aksesibel, tidak dari warna saja; terlewat tidak pernah merah.
   */
  import Check from '@lucide/svelte/icons/check';
  import Clock from '@lucide/svelte/icons/clock';
  import { copy } from '$lib/copy';
  import { logPrayer, removePrayerLog, restorePrayerLog } from '$lib/data/repo/prayerLogs';
  import {
    canLogPrayer,
    prayerLogId,
    prayerStatus,
    prayerTimes,
    type PrayerConfig
  } from '$lib/domain/prayer';
  import { PRAYERS, type PrayerName, type PrayerStatus } from '$lib/domain/types';
  import { formatClock } from '$lib/format';
  import { now } from '$lib/stores/now.svelte';
  import { prayerLogs } from '$lib/stores/prayerLogs.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { today } from '$lib/stores/today.svelte';

  let { config }: { config: PrayerConfig } = $props();

  const t = copy.today.chips;
  const names = copy.prayer.names;

  const date = $derived(today.current);
  const times = $derived(prayerTimes(date, config));
  const statuses = $derived(prayerStatus(date, prayerLogs.items, now.current, config));

  const chipEls: Partial<Record<PrayerName, HTMLButtonElement>> = $state({});
  /** Guard ketukan ganda per sholat selama tulis berjalan. */
  let pending = $state<PrayerName[]>([]);
  /** Usulan #31: fokus ke chip setelah Urungkan, baru saat liveQuery sudah memuat log yang dipulihkan. */
  let pendingFocus = $state<PrayerName | null>(null);

  $effect(() => {
    const p = pendingFocus;
    if (!p || statuses[p] !== 'done') return;
    pendingFocus = null;
    const active = document.activeElement;
    const inToast = active instanceof HTMLElement && active.closest('[role="status"]') !== null;
    // Jangan mencuri fokus jika user sudah pindah ke elemen lain.
    if (active === null || active === document.body || inToast) chipEls[p]?.focus();
  });

  const chipClass: Record<PrayerStatus, string> = {
    done: 'border-brand-soft bg-brand-soft text-brand-ink',
    now: 'border-brand bg-card text-ink',
    missed: 'border-line bg-sunken text-ink',
    upcoming: 'border-line bg-transparent text-muted'
  };

  async function onchip(prayer: PrayerName) {
    const status = statuses[prayer];
    if (status === 'upcoming' || pending.includes(prayer)) return;
    const logDate = date;
    pending = [...pending, prayer];
    try {
      if (status === 'done') {
        const snapshot = prayerLogs.items.find((l) => l.id === prayerLogId(logDate, prayer));
        await removePrayerLog(logDate, prayer);
        if (snapshot) {
          toast.show({
            message: t.removed(names[prayer]),
            action: {
              label: copy.toast.undo,
              // Galat restore tidak ditangkap: toast.runAction menahan toast agar bisa dicoba lagi.
              // false (sudah dicatat ulang) = toast ditutup tanpa galat; fokus tetap ke chip.
              run: async () => {
                await restorePrayerLog(snapshot);
                pendingFocus = prayer;
              }
            }
          });
        }
      } else if (canLogPrayer(logDate, prayer, now.current, config)) {
        await logPrayer(logDate, prayer, new Date().toISOString());
      }
    } catch (err) {
      console.error('[PrayerChips] gagal menulis catatan sholat', err);
      toast.show({ message: copy.error.body });
    } finally {
      pending = pending.filter((p) => p !== prayer);
    }
  }
</script>

<section aria-label={t.groupLabel} class="grid grid-cols-5 gap-2">
  {#each PRAYERS as p (p)}
    {@const status = statuses[p]}
    {@const time = formatClock(times[p])}
    <button
      bind:this={chipEls[p]}
      type="button"
      data-prayer={p}
      data-status={status}
      aria-label={t.label(names[p], time, status)}
      aria-disabled={status === 'upcoming' || undefined}
      class={[
        'flex min-h-11 min-w-0 flex-col items-center gap-1 rounded-lg border px-1 py-2.5',
        chipClass[status]
      ]}
      onclick={() => onchip(p)}
    >
      <span aria-hidden="true" class="flex h-[18px] items-center">
        {#if status === 'done'}
          <Check size={18} strokeWidth={2.6} />
        {:else if status === 'now'}
          <span class="size-2 rounded-full bg-brand-ink"></span>
        {:else if status === 'missed'}
          <span class="size-2 rounded-full border-[1.5px] border-muted"></span>
        {:else}
          <Clock size={16} strokeWidth={2} />
        {/if}
      </span>
      <span class="text-caption font-bold">{names[p]}</span>
      <span class="text-caption font-medium tabular-nums">{time}</span>
    </button>
  {/each}
</section>

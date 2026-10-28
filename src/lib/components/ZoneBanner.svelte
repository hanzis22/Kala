<script lang="ts">
  /**
   * Banner zona (PRD §7.5, rencana F2 §2, Usulan #6/#24): tampil jika offset zona perangkat ≠ zona lokasi
   * pada saat ini. "Tutup" diingat per pasangan `${zona perangkat}|${zona lokasi}` di localStorage
   * (preferensi UI sepele); banner muncul lagi jika pasangannya berubah. Hanya di Hari Ini.
   */
  import { Button } from '$lib/components/ui/button';
  import { copy } from '$lib/copy';
  import { zoneMismatch } from '$lib/domain/prayer';
  import type { Location } from '$lib/domain/types';
  import { now } from '$lib/stores/now.svelte';

  let {
    location,
    onupdate
  }: {
    location: Location;
    onupdate: () => void;
  } = $props();

  const STORAGE_KEY = 'kala.zoneBannerDismissed';
  const t = copy.today.banner;

  function readDismissed(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  let dismissed = $state<string | null>(readDismissed());

  const pair = $derived(`${now.timeZone}|${location.timeZone}`);
  const visible = $derived(dismissed !== pair && zoneMismatch(location, now.timeZone, now.current));

  function dismiss() {
    dismissed = pair;
    try {
      localStorage.setItem(STORAGE_KEY, pair);
    } catch {
      // Tetap tertutup untuk sesi ini.
    }
  }
</script>

{#if visible}
  <section aria-label={t.region} class="flex flex-col gap-3 rounded-xl border border-line bg-card p-4">
    <div class="flex flex-col gap-1">
      <p class="text-heading-md font-extrabold text-ink">{t.title}</p>
      <p class="text-body text-muted">{t.body(location.label)}</p>
    </div>
    <div class="flex flex-wrap gap-2">
      <Button size="sm" onclick={onupdate}>{t.update}</Button>
      <Button size="sm" variant="ghost" onclick={dismiss}>{t.dismiss}</Button>
    </div>
  </section>
{/if}

<script lang="ts">
  /** Sheet saat mengetuk centang sholat yang sudah dicatat: sakelar berjamaah + batalkan catatan. */
  import { Button } from '$lib/components/ui/button';
  import * as Sheet from '$lib/components/ui/sheet';
  import { copy } from '$lib/copy';
  import { removePrayerLog, setCongregation } from '$lib/data/repo/prayerLogs';
  import { toZoned } from '$lib/domain/dates';
  import type { PrayerLog } from '$lib/domain/types';
  import { formatClock } from '$lib/format';

  let {
    open = $bindable(false),
    log,
    timeZone
  }: {
    open?: boolean;
    log: PrayerLog | null;
    timeZone: string;
  } = $props();

  const t = copy.worship;
  const name = $derived(log ? copy.prayer.names[log.prayer] : '');
  const loggedAt = $derived(log ? formatClock(toZoned(new Date(log.at), timeZone).minutes) : '');

  async function toggleCongregation(event: Event) {
    if (!log) return;
    await setCongregation(log.date, log.prayer, (event.currentTarget as HTMLInputElement).checked);
  }

  async function undo() {
    if (!log) return;
    await removePrayerLog(log.date, log.prayer);
    open = false;
  }
</script>

<Sheet.Root bind:open>
  <Sheet.Content>
    {#if log}
      <Sheet.Header>
        <Sheet.Title>{t.logSheetTitle(name, loggedAt)}</Sheet.Title>
        <Sheet.Description>{t.logSheetDescription}</Sheet.Description>
      </Sheet.Header>

      <label class="flex min-h-12 items-center justify-between gap-4 rounded-md border border-line px-4">
        <span class="text-body font-bold text-ink">{t.congregation}</span>
        <input
          type="checkbox"
          role="switch"
          checked={log.congregation}
          onchange={toggleCongregation}
          class="peer size-6 accent-brand"
        />
      </label>

      <Button variant="outline" onclick={undo}>{t.undo}</Button>
    {/if}
  </Sheet.Content>
</Sheet.Root>

<script lang="ts">
  /**
   * Ibadah (PRD §F3), mengikuti docs/design/mockups/ibadah.mockup.html: header + kartu jadwal sholat
   * + kartu konsistensi minggu ini. Tilawah, dzikir, puasa, dan pengingat kalender = Fase 2.
   */
  import Check from '@lucide/svelte/icons/check';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import CityPicker from '$lib/components/CityPicker.svelte';
  import PrayerLogSheet from '$lib/components/PrayerLogSheet.svelte';
  import { Button } from '$lib/components/ui/button';
  import { copy } from '$lib/copy';
  import { logPrayer } from '$lib/data/repo/prayerLogs';
  import { setLocation } from '$lib/data/repo/settings';
  import { toHijri } from '$lib/domain/hijri';
  import { canLogPrayer, prayerStatus, prayerTimes, toPrayerConfig } from '$lib/domain/prayer';
  import { weeklyPrayerGrid } from '$lib/domain/stats';
  import { toZoned } from '$lib/domain/dates';
  import {
    PRAYERS,
    type Location,
    type PrayerLog,
    type PrayerName,
    type PrayerStatus
  } from '$lib/domain/types';
  import { formatClock, formatDayDate, formatWeekdayShort } from '$lib/format';
  import { now } from '$lib/stores/now.svelte';
  import { prayerLogs } from '$lib/stores/prayerLogs.svelte';
  import { settings } from '$lib/stores/settings.svelte';
  import { today } from '$lib/stores/today.svelte';

  const t = copy.worship;

  let pickerOpen = $state(false);
  let logSheetOpen = $state(false);
  let selectedLog = $state<PrayerLog | null>(null);

  const date = $derived(today.current);
  const config = $derived(settings.current ? toPrayerConfig(settings.current) : null);
  const times = $derived(config ? prayerTimes(date, config) : null);
  const statuses = $derived(config ? prayerStatus(date, prayerLogs.items, now.current, config) : null);
  const grid = $derived(config ? weeklyPrayerGrid(date, prayerLogs.items, now.current, config) : null);
  const nowMinutes = $derived(config ? toZoned(now.current, config.location.timeZone).minutes : 0);
  const hijri = $derived(toHijri(date, settings.current?.hijriOffsetDays ?? 0));
  const logFor = (p: PrayerName) => prayerLogs.items.find((l) => l.date === date && l.prayer === p) ?? null;

  /** Kartu langit (SENJA.md): fajar dari Subuh sampai sebelum Ashar, senja dari Ashar sampai Subuh berikutnya. */
  const sky = $derived(times && nowMinutes >= times.subuh && nowMinutes < times.ashar ? 'fajar' : 'senja');

  function note(p: PrayerName, status: PrayerStatus): string {
    if (!times) return '';
    switch (status) {
      case 'done':
        return logFor(p)?.congregation ? t.noteDoneCongregation : t.noteDone;
      case 'now':
        return t.noteNow(Math.max(0, nowMinutes - times[p]));
      case 'missed':
        return t.noteMissed;
      case 'upcoming':
        return t.noteUpcoming(formatClock(times[p]));
    }
  }

  async function mark(p: PrayerName) {
    if (!config || !canLogPrayer(date, p, now.current, config)) return;
    await logPrayer(date, p, now.current.toISOString());
  }

  function openLog(p: PrayerName) {
    selectedLog = logFor(p);
    logSheetOpen = selectedLog !== null;
  }

  // Sheet berjamaah membaca catatan terbaru (mis. setelah sakelar diubah).
  $effect(() => {
    if (selectedLog) selectedLog = prayerLogs.items.find((l) => l.id === selectedLog?.id) ?? null;
  });

  function selectLocation(location: Location) {
    void setLocation(location);
  }

  const cellClass = (status: PrayerStatus) =>
    status === 'done'
      ? 'border-brand bg-brand'
      : status === 'now'
        ? 'border-brand bg-transparent'
        : 'border-line bg-sunken';
</script>

<svelte:head><title>{copy.pages.worship.title} · {copy.appName}</title></svelte:head>

<div class="flex flex-col gap-5 pt-6">
  <header class="flex items-start justify-between gap-3">
    <div class="flex min-w-0 flex-col gap-1">
      <h1 class="text-heading-xl font-extrabold tracking-[-0.02em] text-ink">{copy.pages.worship.title}</h1>
      <p class="text-label font-semibold text-muted">
        <span class="whitespace-nowrap">{formatDayDate(date)}</span> ·
        <span class="whitespace-nowrap">{hijri.label}</span>
      </p>
    </div>
    {#if config}
      <button
        type="button"
        class="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line bg-card px-3.5 text-label font-bold text-ink"
        aria-label={copy.location.changeLabel(config.location.label)}
        onclick={() => (pickerOpen = true)}
      >
        <MapPin size={16} strokeWidth={2} aria-hidden="true" />
        <span class="max-w-[9rem] truncate">{config.location.label}</span>
      </button>
    {/if}
  </header>

  {#if !config || !times || !statuses || !grid}
    <section class="flex flex-col gap-4 rounded-xl border border-line bg-card p-5">
      <div class="flex flex-col gap-1">
        <h2 class="text-heading-md font-extrabold text-ink">{t.noLocationTitle}</h2>
        <p class="text-body text-muted">{t.noLocationBody}</p>
      </div>
      <Button onclick={() => (pickerOpen = true)}>{t.noLocationAction}</Button>
    </section>
  {:else}
    <section
      aria-labelledby="schedule-heading"
      class={[
        'flex flex-col gap-4 rounded-2xl p-5 text-sky-ink',
        sky === 'fajar' ? 'bg-sky-fajar' : 'bg-sky-senja'
      ]}
    >
      <div class="flex items-center justify-between">
        <h2 id="schedule-heading" class="text-caption font-bold tracking-[0.04em] text-sky-muted uppercase">
          {t.scheduleHeading}
        </h2>
        <p class="text-caption font-semibold text-sky-muted">{t.method}</p>
      </div>

      <div
        class="flex justify-between gap-2 rounded-md bg-sky-surface px-3.5 py-2.5 text-label font-semibold"
      >
        <span>{copy.prayer.imsak} {formatClock(times.imsak)}</span>
        <span>{copy.prayer.terbit} {formatClock(times.terbit)}</span>
        <span>{copy.prayer.dhuha} {formatClock(times.dhuha)}</span>
      </div>

      <ul class="flex flex-col">
        {#each PRAYERS as p (p)}
          {@const status = statuses[p]}
          {@const name = copy.prayer.names[p]}
          <li
            class="flex min-h-[60px] items-center gap-3 border-b border-sky-line last:border-b-0"
            data-prayer={p}
            data-status={status}
          >
            <div class="flex flex-1 flex-col gap-0.5">
              <span class="text-[17px] leading-[22px] font-extrabold">{name}</span>
              <span class="text-caption font-semibold text-sky-muted">{note(p, status)}</span>
            </div>
            <span class="text-[20px] font-extrabold tracking-[-0.02em] tabular-nums"
              >{formatClock(times[p])}</span
            >
            {#if status === 'done'}
              <button
                type="button"
                class="flex size-11 items-center justify-center rounded-full bg-brand text-on-brand"
                aria-label={t.doneLabel(name)}
                onclick={() => openLog(p)}
              >
                <Check size={20} strokeWidth={2.8} aria-hidden="true" />
              </button>
            {:else if status === 'now'}
              <button
                type="button"
                class="min-h-11 rounded-md border-2 border-brand bg-card px-3.5 text-label font-extrabold text-brand-ink"
                aria-label={t.markLabel(name)}
                onclick={() => mark(p)}
              >
                {t.mark}
              </button>
            {:else if status === 'missed'}
              <button
                type="button"
                class="min-h-11 rounded-md border-2 border-line bg-sunken px-3.5 text-label font-extrabold text-ink"
                aria-label={t.markLabel(name)}
                onclick={() => mark(p)}
              >
                {t.mark}
              </button>
            {/if}
          </li>
        {/each}
      </ul>
    </section>

    <section
      aria-labelledby="week-heading"
      class="flex flex-col gap-3.5 rounded-xl border border-line bg-card p-5"
    >
      <div class="flex items-baseline justify-between">
        <h2 id="week-heading" class="text-heading-md font-extrabold text-ink">{t.weekHeading}</h2>
        <p class="text-label font-bold text-brand-ink">{t.weekSummary(grid.done, grid.total)}</p>
      </div>
      <div class="grid grid-cols-7 gap-1.5" role="img" aria-label={t.weekAria(grid.done, grid.total)}>
        {#each grid.days as day (day.date)}
          {@const isToday = day.date === date}
          <div class={['flex flex-col items-center gap-1.5 rounded-[12px] py-2', isToday && 'bg-brand-soft']}>
            <span class={['text-caption font-bold', isToday ? 'text-brand-ink' : 'text-muted']}>
              {formatWeekdayShort(day.date)}
            </span>
            {#each PRAYERS as p (p)}
              <span class={['size-[18px] rounded-[6px] border-2', cellClass(day.statuses[p])]}></span>
            {/each}
          </div>
        {/each}
      </div>
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-caption font-semibold text-muted">
        <span class="flex items-center gap-1.5"
          ><span class="size-3 rounded-[4px] bg-brand"></span>{t.legendDone}</span
        >
        <span class="flex items-center gap-1.5"
          ><span class="size-3 rounded-[4px] border-2 border-brand"></span>{t.legendNow}</span
        >
        <span class="flex items-center gap-1.5"
          ><span class="size-3 rounded-[4px] border-2 border-line bg-sunken"></span>{t.legendOther}</span
        >
      </div>
    </section>

    <PrayerLogSheet bind:open={logSheetOpen} log={selectedLog} timeZone={config.location.timeZone} />
  {/if}
</div>

<CityPicker bind:open={pickerOpen} onselect={selectLocation} />

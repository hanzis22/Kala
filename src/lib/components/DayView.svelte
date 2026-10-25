<script lang="ts">
  /**
   * Tampilan Hari di /jadwal (PRD §3, §F5): kejadian kelas, rutin, dan kegiatan di satu tanggal.
   * Kegiatan sekali read-only sampai F7. Kejadian yang dilewati tampil redup dengan "Kembalikan".
   */
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import { Button } from '$lib/components/ui/button';
  import { copy } from '$lib/copy';
  import type { DayItem } from '$lib/domain/agenda';
  import type { LocalDate, RoutineKind } from '$lib/domain/types';
  import { formatClock, formatDayDate } from '$lib/format';

  let {
    date,
    today,
    items,
    onprev,
    onnext,
    ontoday,
    onselect,
    onrestore
  }: {
    date: LocalDate;
    today: LocalDate;
    items: readonly DayItem[];
    onprev: () => void;
    onnext: () => void;
    ontoday: () => void;
    /** Kejadian kelas/rutin diketuk. Tidak dipanggil untuk kegiatan sekali. */
    onselect?: (item: DayItem) => void;
    onrestore: (item: DayItem) => void;
  } = $props();

  const t = copy.schedule;
  const endClock = (end: number) => (end === 1440 ? '24.00' : formatClock(end));

  const tagClass: Record<RoutineKind, string> = {
    class: 'bg-class-soft text-class',
    routine: 'bg-sunken text-muted',
    event: 'bg-sunken text-muted'
  };
</script>

<section aria-labelledby="day-heading" class="flex flex-col gap-3 rounded-xl border border-line bg-card p-5">
  <div class="-mt-2 flex flex-col gap-1">
    <div class="-mr-2 flex items-center gap-1">
      <h2
        id="day-heading"
        data-date={date}
        class="min-w-0 flex-1 truncate text-heading-md font-extrabold text-ink"
        aria-live="polite"
      >
        {formatDayDate(date)}
      </h2>
      <Button variant="ghost" size="icon" aria-label={t.dayPrev} onclick={onprev}>
        <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
      </Button>
      <Button variant="ghost" size="icon" aria-label={t.dayNext} onclick={onnext}>
        <ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
      </Button>
    </div>
    {#if date !== today}
      <Button variant="outline" size="sm" class="self-start" onclick={ontoday}>{t.dayToday}</Button>
    {/if}
  </div>

  {#if items.length === 0}
    <p class="text-body text-muted">{t.dayEmpty}</p>
  {:else}
    <ul class="flex flex-col">
      {#each items as item (`${item.routine.id}:${item.skipped}`)}
        {@const time = `${formatClock(item.start)}–${endClock(item.end)}`}
        {@const editable = !item.skipped && item.routine.kind !== 'event' && onselect}
        <li
          class="border-b border-line last:border-b-0"
          data-routine={item.routine.id}
          data-skipped={item.skipped}
        >
          {#snippet body()}
            <span class="w-[92px] shrink-0 pt-0.5 text-label font-bold text-ink tabular-nums">{time}</span>
            <span class="flex min-w-0 flex-1 flex-col gap-1">
              <span class={['truncate text-body font-extrabold', item.skipped ? 'text-muted' : 'text-ink']}
                >{item.title}</span
              >
              <span class="flex flex-wrap items-center gap-1.5 text-caption font-semibold text-muted">
                <span class={['rounded-sm px-1.5 py-0.5 font-bold', tagClass[item.routine.kind]]}
                  >{t.kindTag[item.routine.kind]}</span
                >
                {#if item.skipped}
                  <span>{t.skipped}</span>
                {:else}
                  {#if item.overridden}
                    <span class="rounded-full border border-line px-2 py-0.5 font-bold text-ink"
                      >{t.overridden}</span
                    >
                  {/if}
                  {#if item.routine.location}
                    <span class="truncate">{item.routine.location}</span>
                  {/if}
                {/if}
              </span>
            </span>
          {/snippet}

          {#if editable}
            <button
              type="button"
              class="-mx-2 flex min-h-[60px] w-[calc(100%+16px)] items-start gap-3 rounded-md px-2 py-2.5 text-left hover:bg-sunken"
              aria-label={t.dayItemLabel(item.title, time, item.overridden)}
              onclick={() => onselect?.(item)}
            >
              {@render body()}
            </button>
          {:else if item.skipped}
            <div class="flex flex-col gap-2 py-2.5">
              <div class="flex min-w-0 items-start gap-3 opacity-60">{@render body()}</div>
              <!-- Sejajar kolom judul (92 px kolom jam + 12 px jarak). -->
              <Button
                variant="outline"
                size="sm"
                class="ml-[104px] self-start"
                aria-label={t.restoreLabel(item.title)}
                onclick={() => onrestore(item)}>{t.restore}</Button
              >
            </div>
          {:else}
            <div class="flex min-h-[60px] items-start gap-3 py-2.5">{@render body()}</div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

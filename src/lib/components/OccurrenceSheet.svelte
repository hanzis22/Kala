<script lang="ts" module>
  import type { LocalDate, LocalTime, Routine } from '$lib/domain/types';

  export interface OccurrenceTarget {
    routine: Routine;
    /** Nama mapel untuk kelas, judul untuk rutin. */
    name: string;
    date: LocalDate;
    startTime: LocalTime;
    durationMin: number;
    overridden: boolean;
  }
</script>

<script lang="ts">
  /**
   * Sheet pilihan edit satu kejadian rutin/kelas (PRD §F5.3–4): "Hanya tanggal ini" (jam/durasi,
   * kembalikan jam semula, lewati) atau "Tanggal ini dan seterusnya" (membuka sheet dari-tanggal).
   */
  import { untrack } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Sheet from '$lib/components/ui/sheet';
  import { copy } from '$lib/copy';
  import { ValidationError } from '$lib/data/repo/errors';
  import { clearOverride, moveOccurrence, skipOccurrence } from '$lib/data/repo/routines';
  import { isValidLocalTime, toMinutes } from '$lib/domain/dates';
  import { MAX_DURATION, MIN_DURATION, validateTimeSlot } from '$lib/domain/recurrence';
  import { formatClock, formatDayDate } from '$lib/format';

  let {
    open = $bindable(false),
    target,
    onfromdate
  }: {
    open?: boolean;
    target: OccurrenceTarget | null;
    onfromdate: (routine: Routine, date: LocalDate) => void;
  } = $props();

  const t = copy.occurrence;

  let startTime = $state('');
  let durationMin = $state<number | null>(null);
  let error = $state<string | null>(null);
  let busy = $state(false);

  $effect(() => {
    if (!open) return;
    const current = target;
    untrack(() => {
      error = null;
      startTime = current?.startTime ?? '';
      durationMin = current?.durationMin ?? null;
    });
  });

  const endLabel = $derived.by(() => {
    if (!isValidLocalTime(startTime) || durationMin === null || !Number.isInteger(durationMin)) return null;
    const end = toMinutes(startTime) + durationMin;
    if (durationMin < MIN_DURATION || end > 1440) return null;
    return end === 1440 ? '24.00' : formatClock(end);
  });

  async function run(action: (target: OccurrenceTarget, now: string) => Promise<unknown>) {
    if (busy || !target) return;
    busy = true;
    try {
      await action(target, new Date().toISOString());
      open = false;
    } catch (err) {
      if (err instanceof ValidationError) error = t.errors[err.code] ?? copy.error.body;
      else throw err;
    } finally {
      busy = false;
    }
  }

  function save(event: SubmitEvent) {
    event.preventDefault();
    const slot = { startTime, durationMin: durationMin ?? Number.NaN };
    const code = validateTimeSlot(slot.startTime, slot.durationMin);
    if (code) {
      error = t.errors[code];
      return;
    }
    void run((x, now) => moveOccurrence(x.routine.id, x.date, slot, now));
  }

  function fromDate() {
    if (!target) return;
    open = false;
    onfromdate(target.routine, target.date);
  }

  const inputClass =
    'min-h-11 w-full rounded-md border border-line bg-ground px-4 text-field text-ink placeholder:text-muted';
</script>

<Sheet.Root bind:open>
  <Sheet.Content>
    <Sheet.Header>
      <Sheet.Title>{target ? t.title(target.name, formatDayDate(target.date)) : ''}</Sheet.Title>
      <Sheet.Description>{t.description}</Sheet.Description>
    </Sheet.Header>

    {#if target}
      <form class="flex flex-col gap-4" onsubmit={save} novalidate aria-labelledby="occurrence-only">
        <div class="flex flex-col gap-1">
          <h3 id="occurrence-only" class="text-body font-extrabold text-ink">{t.onlyThis}</h3>
          <p class="text-caption font-semibold text-muted">{t.onlyThisNote}</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label class="flex min-w-0 flex-col gap-1.5">
            <span class="text-label font-bold text-ink">{copy.session.startTime}</span>
            <input type="time" class={inputClass} bind:value={startTime} required />
          </label>
          <label class="flex min-w-0 flex-col gap-1.5">
            <span class="text-label font-bold text-ink">{copy.session.duration}</span>
            <input
              type="number"
              inputmode="numeric"
              class={inputClass}
              bind:value={durationMin}
              min={MIN_DURATION}
              max={MAX_DURATION}
              step="5"
              aria-describedby="occurrence-end"
            />
          </label>
        </div>
        <p id="occurrence-end" class="-mt-2 text-caption font-semibold text-muted" aria-live="polite">
          {endLabel ? copy.session.endsAt(endLabel) : ''}
        </p>

        {#if error}
          <p class="text-label font-semibold text-danger" role="alert">{error}</p>
        {/if}

        <Button type="submit" disabled={busy}>{t.save}</Button>
        {#if target.overridden}
          <Button
            variant="outline"
            disabled={busy}
            onclick={() => run((x, now) => clearOverride(x.routine.id, x.date, now))}>{t.clear}</Button
          >
        {/if}
        <Button
          variant="outline"
          disabled={busy}
          onclick={() => run((x, now) => skipOccurrence(x.routine.id, x.date, now))}>{t.skip}</Button
        >
      </form>

      <div class="flex flex-col gap-3 border-t border-line pt-4">
        <p class="text-caption font-semibold text-muted">{t.fromThisNote}</p>
        <Button variant="outline" onclick={fromDate}>{t.fromThis}</Button>
      </div>
    {/if}
  </Sheet.Content>
</Sheet.Root>

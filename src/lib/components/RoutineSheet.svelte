<script lang="ts" module>
  import type { LocalDate, Routine } from '$lib/domain/types';

  /** Tambah baru, ubah seri penuh, atau ubah mulai satu tanggal ("Tanggal ini dan seterusnya"). */
  export type RoutineSheetMode =
    | { kind: 'add'; dtstart: LocalDate }
    | { kind: 'edit'; routine: Routine }
    | { kind: 'from'; routine: Routine; date: LocalDate };
</script>

<script lang="ts">
  /** Bottom sheet rutin umum (PRD §F5.1–2): pola harian/mingguan/bulanan, jam, tanggal mulai/akhir. */
  import { untrack } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Sheet from '$lib/components/ui/sheet';
  import { copy } from '$lib/copy';
  import { ValidationError } from '$lib/data/repo/errors';
  import { createRoutine, editFromDate, updateRoutine } from '$lib/data/repo/routines';
  import { isValidLocalTime, toMinutes } from '$lib/domain/dates';
  import {
    describeRule,
    MAX_DURATION,
    MAX_INTERVAL,
    MIN_DURATION,
    parseRule,
    ruleSpecError,
    WEEKDAYS,
    weekdayOf,
    type RuleSpec,
    type Weekday
  } from '$lib/domain/recurrence';
  import {
    defaultMonthlyOptions,
    MAX_TITLE_LENGTH,
    validateRoutineInput,
    type RoutineInput
  } from '$lib/domain/routines';
  import { formatClock, formatDayMonth } from '$lib/format';

  let {
    open = $bindable(false),
    mode,
    weekStartsOn,
    ondelete,
    onend
  }: {
    open?: boolean;
    mode: RoutineSheetMode;
    weekStartsOn: 0 | 1;
    /** "Hapus rutin" (mode edit): seluruh seri. */
    ondelete: (routine: Routine) => void;
    /** "Hapus mulai tanggal ini" (mode from). */
    onend: (routine: Routine, date: LocalDate) => void;
  } = $props();

  const t = copy.routine;
  // Rutin = kegiatan di luar jam sekolah (PRD §F5), jadi bawaannya sore; sesi kelas tetap 07.00.
  const DEFAULT_START = '16:00';
  const DEFAULT_DURATION = 60;
  const FREQS = ['daily', 'weekly', 'monthly'] as const;
  type Freq = (typeof FREQS)[number];
  type MonthlyKind = 'monthday' | 'nth' | 'last';

  let title = $state('');
  let freq = $state<Freq>('weekly');
  let interval = $state<number | null>(1);
  let days = $state<Weekday[]>([]);
  let monthlyKind = $state<MonthlyKind>('monthday');
  let monthday = $state(1);
  let nth = $state(1);
  let nthWeekday = $state<Weekday>('MO');
  let startTime = $state(DEFAULT_START);
  let durationMin = $state<number | null>(DEFAULT_DURATION);
  let dtstart = $state('');
  let until = $state('');
  let error = $state<string | null>(null);
  let saving = $state(false);

  const order = $derived(weekStartsOn === 0 ? (['SU', ...WEEKDAYS.slice(0, 6)] as Weekday[]) : [...WEEKDAYS]);
  const routine = $derived(mode.kind === 'add' ? null : mode.routine);
  const sheetTitle = $derived(
    mode.kind === 'add'
      ? t.sheetAddTitle
      : mode.kind === 'edit'
        ? t.sheetEditTitle
        : t.sheetFromTitle(formatDayMonth(mode.date))
  );

  $effect(() => {
    if (!open) return;
    const current = mode;
    untrack(() => reset(current));
  });

  function reset(m: RoutineSheetMode) {
    error = null;
    const start = m.kind === 'add' ? m.dtstart : m.kind === 'from' ? m.date : m.routine.dtstart;
    const monthly = defaultMonthlyOptions(start);
    monthlyKind = 'monthday';
    monthday = monthly.monthday.kind === 'monthday' ? monthly.monthday.day : 1;
    if (monthly.nth.kind === 'nth') {
      nth = monthly.nth.nth;
      nthWeekday = monthly.nth.weekday;
    }
    dtstart = start;

    if (m.kind === 'add') {
      title = '';
      freq = 'weekly';
      interval = 1;
      days = [weekdayOf(start)];
      startTime = DEFAULT_START;
      durationMin = DEFAULT_DURATION;
      until = '';
      return;
    }

    const r = m.routine;
    const spec = r.rrule ? parseRule(r.rrule) : null;
    title = r.title;
    startTime = r.startTime;
    durationMin = r.durationMin;
    until = r.until ?? '';
    freq = spec?.freq ?? 'weekly';
    interval = spec?.interval ?? 1;
    days = spec?.freq === 'weekly' ? [...spec.days] : [weekdayOf(start)];
    if (spec?.freq === 'monthly') {
      const by = spec.by;
      if (by.kind === 'monthday' && by.day === -1) monthlyKind = 'last';
      else if (by.kind === 'monthday') {
        monthlyKind = 'monthday';
        monthday = by.day;
      } else {
        monthlyKind = 'nth';
        nth = by.nth;
        nthWeekday = by.weekday;
      }
    }
  }

  function toggleDay(day: Weekday) {
    days = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
  }

  const spec = $derived.by((): RuleSpec => {
    const n = interval ?? Number.NaN;
    if (freq === 'daily') return { freq, interval: n };
    if (freq === 'weekly') return { freq, interval: n, days };
    if (monthlyKind === 'last') return { freq, interval: n, by: { kind: 'monthday', day: -1 } };
    if (monthlyKind === 'nth') return { freq, interval: n, by: { kind: 'nth', nth, weekday: nthWeekday } };
    return { freq, interval: n, by: { kind: 'monthday', day: monthday } };
  });

  const preview = $derived(ruleSpecError(spec) ? '' : describeRule(spec));

  const endLabel = $derived.by(() => {
    if (!isValidLocalTime(startTime) || durationMin === null || !Number.isInteger(durationMin)) return null;
    const end = toMinutes(startTime) + durationMin;
    if (durationMin < MIN_DURATION || end > 1440) return null;
    return end === 1440 ? '24.00' : formatClock(end);
  });

  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (saving) return;
    const input: RoutineInput = {
      title,
      spec,
      startTime,
      durationMin: durationMin ?? Number.NaN,
      dtstart: mode.kind === 'from' ? mode.date : dtstart,
      until: until || null,
      location: routine?.location ?? null
    };
    const code = validateRoutineInput(input);
    if (code) {
      error = t.errors[code];
      return;
    }
    saving = true;
    try {
      const now = new Date().toISOString();
      if (mode.kind === 'add') await createRoutine(input, now);
      else if (mode.kind === 'edit') await updateRoutine(mode.routine.id, input, now);
      else {
        const fromInput = {
          title: input.title,
          spec: input.spec,
          startTime: input.startTime,
          durationMin: input.durationMin,
          until: input.until,
          location: input.location
        };
        await editFromDate(mode.routine.id, mode.date, { kind: 'routine', routine: fromInput }, now);
      }
      open = false;
    } catch (err) {
      if (err instanceof ValidationError) error = t.errors[err.code] ?? copy.error.body;
      else throw err;
    } finally {
      saving = false;
    }
  }

  function requestDelete() {
    open = false;
    if (mode.kind === 'edit') ondelete(mode.routine);
    else if (mode.kind === 'from') onend(mode.routine, mode.date);
  }

  const fieldClass =
    'min-h-11 rounded-md border border-line bg-ground px-4 text-field text-ink placeholder:text-muted';
  const inputClass = `${fieldClass} w-full`;
  const segmentClass = (on: boolean) => [
    'min-h-11 rounded-md text-label font-extrabold',
    on ? 'bg-sunken text-ink' : 'text-muted hover:bg-sunken'
  ];
</script>

<Sheet.Root bind:open>
  <Sheet.Content>
    <Sheet.Header>
      <Sheet.Title>{sheetTitle}</Sheet.Title>
      <Sheet.Description>{mode.kind === 'from' ? t.dtstartLocked : t.sheetDescription}</Sheet.Description>
    </Sheet.Header>

    <form class="flex flex-col gap-4" onsubmit={save} novalidate>
      <label class="flex flex-col gap-1.5">
        <span class="text-label font-bold text-ink">{t.title}</span>
        <input
          class={inputClass}
          bind:value={title}
          maxlength={MAX_TITLE_LENGTH}
          placeholder={t.titlePlaceholder}
          autocomplete="off"
        />
      </label>

      <fieldset class="flex flex-col gap-2">
        <legend class="mb-1.5 text-label font-bold text-ink">{t.pattern}</legend>
        <div class="grid grid-cols-3 gap-1 rounded-lg border border-line bg-card p-1">
          {#each FREQS as f (f)}
            <button
              type="button"
              aria-pressed={freq === f}
              class={segmentClass(freq === f)}
              onclick={() => (freq = f)}>{t.freq[f]}</button
            >
          {/each}
        </div>
        <div class="flex items-center gap-2 text-body text-ink">
          <span>{t.every}</span>
          <input
            type="number"
            inputmode="numeric"
            class={[fieldClass, 'w-20 text-center']}
            bind:value={interval}
            min="1"
            max={MAX_INTERVAL}
            aria-label={t.interval}
          />
          <span>{t.unit[freq]}</span>
        </div>
      </fieldset>

      {#if freq === 'weekly'}
        <fieldset class="flex flex-col gap-1.5">
          <legend class="mb-1.5 text-label font-bold text-ink">{t.days}</legend>
          <div class="grid grid-cols-7 gap-1.5">
            {#each order as day (day)}
              {@const on = days.includes(day)}
              <button
                type="button"
                aria-pressed={on}
                aria-label={copy.weekdays.long[day]}
                class={[
                  'min-h-11 rounded-md border text-label font-extrabold',
                  on ? 'border-ink bg-sunken text-ink' : 'border-line bg-ground text-muted'
                ]}
                onclick={() => toggleDay(day)}
              >
                {copy.weekdays.short[day]}
              </button>
            {/each}
          </div>
        </fieldset>
      {:else if freq === 'monthly'}
        <fieldset class="flex flex-col gap-2">
          <legend class="mb-1.5 text-label font-bold text-ink">{t.monthly}</legend>
          <div class="flex min-h-11 items-center gap-3">
            <input
              type="radio"
              id="monthly-monthday"
              name="monthly"
              value="monthday"
              class="size-5 accent-brand"
              bind:group={monthlyKind}
            />
            <label for="monthly-monthday" class="text-body text-ink">{t.monthday}</label>
            <select
              class={[fieldClass, 'w-24']}
              bind:value={monthday}
              aria-label={t.monthdaySelect}
              onfocus={() => (monthlyKind = 'monthday')}
            >
              {#each Array.from({ length: 31 }, (_, i) => i + 1) as d (d)}
                <option value={d}>{d}</option>
              {/each}
            </select>
          </div>
          <div class="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2">
            <input
              type="radio"
              id="monthly-nth"
              name="monthly"
              value="nth"
              class="size-5 accent-brand"
              bind:group={monthlyKind}
            />
            <label for="monthly-nth" class="text-body text-ink">{t.nth}</label>
            <div class="flex min-w-0 basis-full gap-2 pl-8">
              <select
                class={[fieldClass, 'min-w-0 flex-1 px-3']}
                bind:value={nth}
                aria-label={t.nthSelect}
                onfocus={() => (monthlyKind = 'nth')}
              >
                {#each t.nthOptions as [value, label] (value)}
                  <option {value}>{label}</option>
                {/each}
              </select>
              <select
                class={[fieldClass, 'min-w-0 flex-1 px-3']}
                bind:value={nthWeekday}
                aria-label={t.nthWeekdaySelect}
                onfocus={() => (monthlyKind = 'nth')}
              >
                {#each order as day (day)}
                  <option value={day}>{copy.weekdays.long[day]}</option>
                {/each}
              </select>
            </div>
          </div>
          <div class="flex min-h-11 items-center gap-3">
            <input
              type="radio"
              id="monthly-last"
              name="monthly"
              value="last"
              class="size-5 accent-brand"
              bind:group={monthlyKind}
            />
            <label for="monthly-last" class="text-body text-ink">{t.lastDay}</label>
          </div>
          {#if monthlyKind === 'monthday' && monthday >= 29}
            <p class="text-caption font-semibold text-muted">{t.monthdayHint(monthday)}</p>
          {/if}
        </fieldset>
      {/if}

      <div class="grid grid-cols-2 gap-3">
        <label class="flex min-w-0 flex-col gap-1.5">
          <span class="text-label font-bold text-ink">{t.startTime}</span>
          <input type="time" class={inputClass} bind:value={startTime} required />
        </label>
        <label class="flex min-w-0 flex-col gap-1.5">
          <span class="text-label font-bold text-ink">{t.duration}</span>
          <input
            type="number"
            inputmode="numeric"
            class={inputClass}
            bind:value={durationMin}
            min={MIN_DURATION}
            max={MAX_DURATION}
            step="5"
            aria-describedby="routine-end"
          />
        </label>
      </div>
      <p id="routine-end" class="-mt-2 text-caption font-semibold text-muted" aria-live="polite">
        {endLabel ? t.endsAt(endLabel) : ''}
      </p>

      <div class="grid grid-cols-2 gap-3">
        <label class="flex min-w-0 flex-col gap-1.5">
          <span class="text-label font-bold text-ink">{t.dtstart}</span>
          {#if mode.kind === 'from'}
            <input type="date" class={inputClass} value={mode.date} disabled />
          {:else}
            <input type="date" class={inputClass} bind:value={dtstart} required />
          {/if}
        </label>
        <label class="flex min-w-0 flex-col gap-1.5">
          <span class="text-label font-bold text-ink"
            >{t.until} <span class="font-semibold text-muted">· {t.optional}</span></span
          >
          <input type="date" class={inputClass} bind:value={until} />
        </label>
      </div>

      <p class="rounded-md bg-sunken px-4 py-3 text-label font-semibold text-ink" aria-live="polite">
        <span class="text-muted">{t.preview}:</span>
        {preview}
      </p>

      {#if error}
        <p class="text-label font-semibold text-danger" role="alert">{error}</p>
      {/if}

      <Button type="submit" disabled={saving}>{copy.common.save}</Button>
      {#if mode.kind === 'edit'}
        <Button variant="destructive" onclick={requestDelete}>{t.delete}</Button>
      {:else if mode.kind === 'from'}
        <Button variant="destructive" onclick={requestDelete}>{t.deleteFrom}</Button>
      {/if}
    </form>
  </Sheet.Content>
</Sheet.Root>

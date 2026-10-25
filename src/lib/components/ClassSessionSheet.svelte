<script lang="ts">
  /**
   * Bottom sheet tambah/ubah sesi kelas mingguan (PRD §F4.2). Tanpa `fromDate`, mengubah = seluruh seri;
   * dengan `fromDate`, perubahan berlaku mulai tanggal itu ("Tanggal ini dan seterusnya", PRD §F5.4).
   */
  import { untrack } from 'svelte';
  import { resolve } from '$app/paths';
  import { Button } from '$lib/components/ui/button';
  import * as Sheet from '$lib/components/ui/sheet';
  import { copy } from '$lib/copy';
  import { ValidationError } from '$lib/data/repo/errors';
  import { createClassRoutine, editFromDate, updateClassRoutine } from '$lib/data/repo/routines';
  import { isValidLocalTime, toMinutes } from '$lib/domain/dates';
  import { MAX_DURATION, MIN_DURATION, WEEKDAYS, weeklyDays, type Weekday } from '$lib/domain/recurrence';
  import { MAX_LOCATION_LENGTH, validateClassSession } from '$lib/domain/timetable';
  import type { LocalDate, Routine } from '$lib/domain/types';
  import { formatClock, formatDayMonth } from '$lib/format';
  import { schedule } from '$lib/stores/schedule.svelte';

  let {
    open = $bindable(false),
    routine,
    dtstart,
    weekStartsOn,
    showSunday,
    fromDate,
    ondelete,
    onend
  }: {
    open?: boolean;
    /** null = tambah baru. */
    routine: Routine | null;
    /** dtstart untuk sesi baru: hari pertama minggu yang sedang tampil. */
    dtstart: LocalDate;
    weekStartsOn: 0 | 1;
    showSunday: boolean;
    /** Diisi = mode "Tanggal ini dan seterusnya" untuk `routine`. */
    fromDate?: LocalDate;
    ondelete: (routine: Routine) => void;
    /** "Hapus mulai tanggal ini" (mode fromDate). */
    onend?: (routine: Routine, date: LocalDate) => void;
  } = $props();

  const t = copy.session;
  const DEFAULT_START = '07:00';
  const DEFAULT_DURATION = 90;

  let subjectId = $state('');
  let days = $state<Weekday[]>([]);
  let startTime = $state(DEFAULT_START);
  let durationMin = $state<number | null>(DEFAULT_DURATION);
  let location = $state('');
  /** Ruang sudah diubah user: berhenti mengikuti ruang mapel. */
  let locationTouched = $state(false);
  let error = $state<string | null>(null);
  let saving = $state(false);

  const order = $derived(weekStartsOn === 0 ? (['SU', ...WEEKDAYS.slice(0, 6)] as Weekday[]) : [...WEEKDAYS]);

  // Isi ulang form setiap kali sheet dibuka.
  $effect(() => {
    if (!open) return;
    const current = routine;
    untrack(() => reset(current));
  });

  function reset(routine: Routine | null) {
    error = null;
    if (routine) {
      subjectId = routine.subjectId ?? '';
      days = routine.rrule ? weeklyDays(routine.rrule) : [];
      startTime = routine.startTime;
      durationMin = routine.durationMin;
      location = routine.location ?? '';
      locationTouched = true;
    } else {
      subjectId = schedule.subjects[0]?.id ?? '';
      days = [];
      startTime = DEFAULT_START;
      durationMin = DEFAULT_DURATION;
      locationTouched = false;
      location = schedule.subjectById(subjectId)?.room ?? '';
    }
  }

  function selectSubject(id: string) {
    subjectId = id;
    if (!locationTouched) location = schedule.subjectById(id)?.room ?? '';
  }

  function toggleDay(day: Weekday) {
    days = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
  }

  const endLabel = $derived.by(() => {
    if (!isValidLocalTime(startTime) || durationMin === null || !Number.isInteger(durationMin)) return null;
    const end = toMinutes(startTime) + durationMin;
    if (durationMin < MIN_DURATION || end > 1440) return null;
    return end === 1440 ? '24.00' : formatClock(end);
  });

  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (saving) return;
    const input = {
      subjectId: subjectId || null,
      days,
      startTime,
      durationMin: durationMin ?? Number.NaN,
      location: location.trim() || null
    };
    const code = validateClassSession(input);
    if (code) {
      error = t.errors[code];
      return;
    }
    saving = true;
    try {
      const now = new Date().toISOString();
      if (routine && fromDate)
        await editFromDate(routine.id, fromDate, { kind: 'class', session: input }, now);
      else if (routine) await updateClassRoutine(routine.id, input, now);
      else await createClassRoutine(input, dtstart, now);
      open = false;
    } catch (err) {
      if (err instanceof ValidationError) error = t.errors[err.code] ?? copy.error.body;
      else throw err;
    } finally {
      saving = false;
    }
  }

  function requestDelete() {
    if (!routine) return;
    open = false;
    if (fromDate) onend?.(routine, fromDate);
    else ondelete(routine);
  }

  const inputClass =
    'min-h-11 w-full rounded-md border border-line bg-ground px-4 text-field text-ink placeholder:text-muted';
</script>

<Sheet.Root bind:open>
  <Sheet.Content>
    <Sheet.Header>
      <Sheet.Title>{routine ? t.sheetEditTitle : t.sheetAddTitle}</Sheet.Title>
      <Sheet.Description
        >{fromDate ? t.fromDescription(formatDayMonth(fromDate)) : t.sheetDescription}</Sheet.Description
      >
    </Sheet.Header>

    {#if schedule.subjects.length === 0}
      <p class="text-body text-muted">{t.noSubjects}</p>
      <Button href={resolve('/jadwal/mapel')} onclick={() => (open = false)}>{t.addSubject}</Button>
    {:else}
      <form class="flex flex-col gap-4" onsubmit={save} novalidate>
        <label class="flex flex-col gap-1.5">
          <span class="text-label font-bold text-ink">{t.subject}</span>
          <select
            class={inputClass}
            value={subjectId}
            onchange={(e) => selectSubject((e.currentTarget as HTMLSelectElement).value)}
          >
            {#each schedule.subjects as s (s.id)}
              <option value={s.id}>{s.name}</option>
            {/each}
          </select>
        </label>

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
                  on ? 'border-class bg-class-soft text-class' : 'border-line bg-ground text-muted'
                ]}
                onclick={() => toggleDay(day)}
              >
                {copy.weekdays.short[day]}
              </button>
            {/each}
          </div>
          {#if days.includes('SU') && !showSunday}
            <p class="text-caption font-semibold text-muted">{t.sundayHidden}</p>
          {/if}
        </fieldset>

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
              aria-describedby="session-end"
            />
          </label>
        </div>
        <p id="session-end" class="-mt-2 text-caption font-semibold text-muted" aria-live="polite">
          {endLabel ? t.endsAt(endLabel) : ''}
        </p>

        <label class="flex flex-col gap-1.5">
          <span class="text-label font-bold text-ink"
            >{t.room} <span class="font-semibold text-muted">· {copy.subjects.optional}</span></span
          >
          <input
            class={inputClass}
            value={location}
            maxlength={MAX_LOCATION_LENGTH}
            autocomplete="off"
            aria-describedby="session-room-hint"
            oninput={(e) => {
              location = (e.currentTarget as HTMLInputElement).value;
              locationTouched = true;
            }}
          />
          <span id="session-room-hint" class="text-caption font-semibold text-muted">{t.roomHint}</span>
        </label>

        {#if error}
          <p class="text-label font-semibold text-danger" role="alert">{error}</p>
        {/if}

        <Button type="submit" disabled={saving}>{copy.common.save}</Button>
        {#if routine}
          <Button variant="destructive" onclick={requestDelete}>{fromDate ? t.deleteFrom : t.delete}</Button>
        {/if}
      </form>
    {/if}
  </Sheet.Content>
</Sheet.Root>

<script lang="ts" module>
  import type { Task } from '$lib/domain/types';

  export type TaskSheetMode = { kind: 'add' } | { kind: 'edit'; task: Task };
</script>

<script lang="ts">
  /**
   * Bottom sheet tugas (PRD §F6.1): tenggat dan jadwal pengerjaan terpisah. Jadwal diisi lengkap
   * (tanggal + jam + durasi) atau dikosongkan semua. Hapus tanpa konfirmasi karena ada Urungkan.
   */
  import { untrack } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Sheet from '$lib/components/ui/sheet';
  import { copy } from '$lib/copy';
  import { ValidationError } from '$lib/data/repo/errors';
  import { createTask, updateTask } from '$lib/data/repo/tasks';
  import { isValidLocalTime, toMinutes } from '$lib/domain/dates';
  import { MAX_DURATION, MIN_DURATION } from '$lib/domain/recurrence';
  import {
    DEFAULT_SCHEDULE,
    MAX_TASK_NOTES,
    MAX_TASK_TITLE,
    normalizeTaskInput,
    PRIORITIES,
    TASK_TYPES,
    validateTaskInput,
    type TaskError,
    type TaskInput
  } from '$lib/domain/tasks';
  import type { Id, LocalDate, Priority, Subject, TaskType } from '$lib/domain/types';
  import { formatClock } from '$lib/format';
  import type { SubjectName } from '$lib/stores/tasks.svelte';

  let {
    open = $bindable(false),
    mode,
    today,
    subjects,
    subjectNames,
    ondelete,
    onsettled
  }: {
    open?: boolean;
    mode: TaskSheetMode;
    today: LocalDate;
    /** Mapel aktif. */
    subjects: readonly Subject[];
    subjectNames: ReadonlyMap<Id, SubjectName>;
    /** "Hapus tugas": halaman menghapus, menampilkan toast, dan mengatur fokus. */
    ondelete: (task: Task) => Promise<void>;
    /** Sheet sudah tertutup dan perangkap fokusnya lepas; halaman boleh memindah fokus. */
    onsettled?: () => void;
  } = $props();

  const t = copy.tasks;
  const s = copy.tasks.sheet;

  type Field =
    | 'title'
    | 'type'
    | 'priority'
    | 'due'
    | 'dueTime'
    | 'schedule'
    | 'scheduledDate'
    | 'startTime'
    | 'duration'
    | 'notes';

  const fieldOf = {
    'title-required': 'title',
    'title-too-long': 'title',
    'notes-too-long': 'notes',
    'invalid-type': 'type',
    'invalid-priority': 'priority',
    'invalid-due-date': 'due',
    'due-time-without-date': 'due',
    'invalid-due-time': 'dueTime',
    'schedule-incomplete': 'schedule',
    'invalid-scheduled-date': 'scheduledDate',
    'invalid-time': 'startTime',
    'duration-range': 'duration',
    'past-midnight': 'duration'
  } satisfies Record<TaskError, Field>;

  let title = $state('');
  let type = $state<TaskType>('tugas');
  let subjectId = $state<Id | null>(null);
  let priority = $state<Priority>('medium');
  let dueDate = $state('');
  let dueTime = $state('');
  let scheduleOn = $state(false);
  let scheduledDate = $state('');
  let startTime = $state('');
  let durationMin = $state<number | null>(null);
  let notes = $state('');
  let fieldError = $state<{ field: Field; message: string } | null>(null);
  let formError = $state<string | null>(null);
  let saving = $state(false);
  let deleting = $state(false);
  /** Sheet ditutup karena hapus: halaman yang memindah fokus, bukan Bits (trigger-nya sudah hilang). */
  let closedByDelete = false;

  const task = $derived(mode.kind === 'edit' ? mode.task : null);
  /** Mapel tugas ini sudah dihapus (atau tidak ada): tampil sebagai opsi tambahan "(dihapus)" (§F4.4). */
  const deletedSubject = $derived.by(() => {
    const id = task?.subjectId ?? null;
    if (id === null || subjects.some((x) => x.id === id)) return null;
    return { id, label: t.meta.subjectDeleted(subjectNames.get(id)?.name ?? null) };
  });

  $effect(() => {
    if (!open) return;
    const current = mode;
    untrack(() => reset(current));
  });

  function reset(m: TaskSheetMode) {
    fieldError = null;
    formError = null;
    const x = m.kind === 'edit' ? m.task : null;
    title = x?.title ?? '';
    type = x?.type ?? 'tugas';
    subjectId = x?.subjectId ?? null;
    priority = x?.priority ?? 'medium';
    dueDate = x?.dueDate ?? '';
    dueTime = x?.dueTime ?? '';
    scheduleOn = x?.scheduledDate != null;
    scheduledDate = x?.scheduledDate ?? '';
    startTime = x?.startTime ?? '';
    durationMin = x?.durationMin ?? null;
    notes = x?.notes ?? '';
  }

  function toggleSchedule() {
    scheduleOn = !scheduleOn;
    if (!scheduleOn) return;
    if (!scheduledDate) scheduledDate = today;
    if (!startTime) startTime = DEFAULT_SCHEDULE.startTime;
    if (durationMin === null) durationMin = DEFAULT_SCHEDULE.durationMin;
  }

  const endLabel = $derived.by(() => {
    if (!isValidLocalTime(startTime) || durationMin === null || !Number.isInteger(durationMin)) return null;
    const end = toMinutes(startTime) + durationMin;
    if (durationMin < MIN_DURATION || end > 1440) return null;
    return end === 1440 ? '24.00' : formatClock(end);
  });

  /** Atribut aksesibel galat untuk input field `f` (dan `also`, misal galat grup jadwal). */
  function errorAttrs(f: Field, also?: Field) {
    const hit = fieldError && (fieldError.field === f || fieldError.field === also) ? fieldError.field : null;
    return hit ? { 'aria-invalid': true, 'aria-describedby': `task-err-${hit}` } : {};
  }

  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (saving) return;
    const raw: TaskInput = {
      title,
      notes,
      type,
      subjectId,
      dueDate,
      dueTime,
      scheduledDate: scheduleOn ? scheduledDate : null,
      startTime: scheduleOn ? startTime : null,
      // Durasi kosong saat jadwal menyala = jadwal belum lengkap (schedule-incomplete).
      durationMin: scheduleOn ? durationMin : null,
      priority
    };
    const input = normalizeTaskInput(raw);
    const code = validateTaskInput(input);
    if (code) {
      fieldError = { field: fieldOf[code], message: t.errors[code] };
      formError = null;
      return;
    }
    fieldError = null;
    formError = null;
    saving = true;
    try {
      const now = new Date().toISOString();
      if (mode.kind === 'add') await createTask(input, now);
      else await updateTask(mode.task.id, input, now);
      open = false;
    } catch (err) {
      if (err instanceof ValidationError) {
        formError = t.errors[err.code as keyof typeof t.errors] ?? copy.error.body;
      } else {
        console.error('[tasks] simpan gagal', err);
        formError = copy.error.body;
      }
    } finally {
      saving = false;
    }
  }

  async function remove() {
    if (deleting || mode.kind !== 'edit') return;
    deleting = true;
    try {
      await ondelete(mode.task);
      closedByDelete = true;
      open = false;
    } catch (err) {
      console.error('[tasks] hapus gagal', err);
      formError = copy.error.body;
    } finally {
      deleting = false;
    }
  }

  const fieldClass =
    'min-h-11 rounded-md border border-line bg-ground px-4 text-field text-ink placeholder:text-muted';
  const inputClass = `${fieldClass} w-full`;
  const segmentClass = (on: boolean) => [
    'min-h-11 rounded-md text-label font-extrabold',
    on ? 'bg-sunken text-ink' : 'text-muted hover:bg-sunken'
  ];
  const errorClass = 'text-label font-semibold text-danger';
</script>

{#snippet fieldErrorText(f: Field)}
  {#if fieldError?.field === f}
    <p id="task-err-{f}" class={errorClass}>{fieldError.message}</p>
  {/if}
{/snippet}

<Sheet.Root bind:open>
  <Sheet.Content
    onCloseAutoFocus={(e) => {
      if (closedByDelete) {
        e.preventDefault();
        closedByDelete = false;
      }
      onsettled?.();
    }}
  >
    <Sheet.Header>
      <Sheet.Title>{mode.kind === 'add' ? s.addTitle : s.editTitle}</Sheet.Title>
      <Sheet.Description>{s.description}</Sheet.Description>
    </Sheet.Header>

    <form class="flex flex-col gap-4" onsubmit={save} novalidate>
      <label class="flex flex-col gap-1.5">
        <span class="text-label font-bold text-ink">{s.title}</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input
          class={inputClass}
          bind:value={title}
          maxlength={MAX_TASK_TITLE}
          placeholder={s.titlePlaceholder}
          autocomplete="off"
          autofocus={mode.kind === 'add'}
          {...errorAttrs('title')}
        />
        {@render fieldErrorText('title')}
      </label>

      <div class="grid grid-cols-2 gap-3">
        <label class="flex min-w-0 flex-col gap-1.5">
          <span class="text-label font-bold text-ink">{s.type}</span>
          <select class={[inputClass, 'px-3']} bind:value={type} {...errorAttrs('type')}>
            {#each TASK_TYPES as value (value)}
              <option {value}>{t.types[value]}</option>
            {/each}
          </select>
        </label>
        <label class="flex min-w-0 flex-col gap-1.5">
          <span class="text-label font-bold text-ink">{s.subject}</span>
          <select class={[inputClass, 'px-3']} bind:value={subjectId}>
            <option value={null}>{s.noSubject}</option>
            {#each subjects as subject (subject.id)}
              <option value={subject.id}>{subject.name}</option>
            {/each}
            {#if deletedSubject}
              <option value={deletedSubject.id}>{deletedSubject.label}</option>
            {/if}
          </select>
        </label>
      </div>
      {@render fieldErrorText('type')}

      <fieldset
        class="flex flex-col gap-1.5"
        aria-describedby={fieldError?.field === 'priority' ? 'task-err-priority' : undefined}
      >
        <legend class="mb-1.5 text-label font-bold text-ink">{s.priority}</legend>
        <div class="grid grid-cols-3 gap-1 rounded-lg border border-line bg-card p-1">
          {#each PRIORITIES as value (value)}
            <button
              type="button"
              aria-pressed={priority === value}
              class={segmentClass(priority === value)}
              onclick={() => (priority = value)}>{t.priorities[value]}</button
            >
          {/each}
        </div>
        {@render fieldErrorText('priority')}
      </fieldset>

      <fieldset class="flex flex-col gap-1.5">
        <legend class="mb-1.5 text-label font-bold text-ink"
          >{s.due} <span class="font-semibold text-muted">· {s.optional}</span></legend
        >
        <div class="grid grid-cols-2 gap-3">
          <label class="flex min-w-0 flex-col gap-1.5">
            <span class="text-caption font-semibold text-muted">{s.dueDate}</span>
            <input type="date" class={inputClass} bind:value={dueDate} {...errorAttrs('due')} />
          </label>
          <label class="flex min-w-0 flex-col gap-1.5">
            <span class="text-caption font-semibold text-muted">{s.dueTime}</span>
            <input type="time" class={inputClass} bind:value={dueTime} {...errorAttrs('dueTime')} />
          </label>
        </div>
        {#if dueTime}
          <Button variant="ghost" size="sm" class="self-end" onclick={() => (dueTime = '')}
            >{s.clearDueTime}</Button
          >
        {/if}
        {@render fieldErrorText('due')}
        {@render fieldErrorText('dueTime')}
      </fieldset>

      <div class="flex flex-col gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={scheduleOn}
          class="flex min-h-11 items-center justify-between gap-3 rounded-md text-left"
          onclick={toggleSchedule}
        >
          <span class="text-label font-bold text-ink">{s.schedule}</span>
          <span
            class={[
              'relative h-7 w-12 shrink-0 rounded-full border border-line transition-colors motion-reduce:transition-none',
              scheduleOn ? 'bg-brand' : 'bg-sunken'
            ]}
            aria-hidden="true"
          >
            <span
              class={[
                'absolute top-0.5 left-0.5 size-[22px] rounded-full bg-card transition-transform motion-reduce:transition-none',
                scheduleOn && 'translate-x-5'
              ]}
            ></span>
          </span>
        </button>
        {@render fieldErrorText('schedule')}

        {#if scheduleOn}
          <label class="flex min-w-0 flex-col gap-1.5">
            <span class="text-label font-bold text-ink">{s.scheduledDate}</span>
            <input
              type="date"
              class={inputClass}
              bind:value={scheduledDate}
              {...errorAttrs('scheduledDate', 'schedule')}
            />
          </label>
          {@render fieldErrorText('scheduledDate')}
          <div class="grid grid-cols-2 gap-3">
            <label class="flex min-w-0 flex-col gap-1.5">
              <span class="text-label font-bold text-ink">{s.startTime}</span>
              <input
                type="time"
                class={inputClass}
                bind:value={startTime}
                {...errorAttrs('startTime', 'schedule')}
              />
            </label>
            <label class="flex min-w-0 flex-col gap-1.5">
              <span class="text-label font-bold text-ink">{s.duration}</span>
              <input
                type="number"
                inputmode="numeric"
                class={inputClass}
                bind:value={durationMin}
                min={MIN_DURATION}
                max={MAX_DURATION}
                step="5"
                {...errorAttrs('duration', 'schedule')}
              />
            </label>
          </div>
          {@render fieldErrorText('startTime')}
          {@render fieldErrorText('duration')}
          <p class="-mt-2 text-caption font-semibold text-muted" aria-live="polite">
            {endLabel ? s.endsAt(endLabel) : ''}
          </p>
        {/if}
      </div>

      <label class="flex flex-col gap-1.5">
        <span class="text-label font-bold text-ink"
          >{s.notes} <span class="font-semibold text-muted">· {s.optional}</span></span
        >
        <textarea
          class={[inputClass, 'py-2.5']}
          rows="3"
          bind:value={notes}
          maxlength={MAX_TASK_NOTES}
          {...errorAttrs('notes')}></textarea>
        {@render fieldErrorText('notes')}
      </label>

      <Button type="submit" disabled={saving}>{copy.common.save}</Button>
      {#if formError}
        <p class={errorClass} role="alert">{formError}</p>
      {/if}
      {#if mode.kind === 'edit'}
        <Button variant="destructive" disabled={deleting} onclick={remove}>{s.delete}</Button>
      {/if}
    </form>
  </Sheet.Content>
</Sheet.Root>

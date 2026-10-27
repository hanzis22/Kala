<script lang="ts">
  /**
   * Daftar tugas (PRD §F6.3): centang asli di kiri, tombol ubah di kanan.
   * "Lewat tenggat" berupa pill netral dengan ikon + teks, tidak pernah merah.
   */
  import Clock from '@lucide/svelte/icons/clock';
  import { copy } from '$lib/copy';
  import { toLocalDate, toMinutes } from '$lib/domain/dates';
  import { isOverdue } from '$lib/domain/tasks';
  import type { Id, LocalDate, LocalTime, Minutes, Task } from '$lib/domain/types';
  import { formatClock, formatDayMonth, formatWeekdayShort } from '$lib/format';
  import type { SubjectName } from '$lib/stores/tasks.svelte';

  let {
    items,
    today,
    nowMin,
    subjectNames,
    showDone = false,
    onedit,
    ontoggle
  }: {
    items: readonly Task[];
    today: LocalDate;
    nowMin: Minutes;
    subjectNames: ReadonlyMap<Id, SubjectName>;
    /** Filter Selesai: tampilkan tanggal selesai. */
    showDone?: boolean;
    onedit: (task: Task) => void;
    ontoggle: (task: Task, checked: boolean) => void;
  } = $props();

  const t = copy.tasks;

  const clock = (time: LocalTime) => formatClock(toMinutes(time));
  const endClock = (end: number) => (end === 1440 ? '24.00' : formatClock(end));

  function dueParts(task: Task): { day: string; time: string | null } | null {
    if (task.dueDate === null) return null;
    const day = `${formatWeekdayShort(task.dueDate)}, ${formatDayMonth(task.dueDate)}`;
    return { day, time: task.dueTime ? clock(task.dueTime) : null };
  }

  function scheduledText(task: Task): string | null {
    if (task.scheduledDate === null || task.startTime === null || task.durationMin === null) return null;
    const start = toMinutes(task.startTime);
    const day = `${formatWeekdayShort(task.scheduledDate)} ${formatDayMonth(task.scheduledDate)}`;
    return t.meta.scheduled(day, formatClock(start), endClock(start + task.durationMin));
  }

  function doneText(task: Task): string | null {
    // Data impor rusak tidak boleh membuat filter Selesai crash.
    if (!showDone || task.completedAt === null || !Number.isFinite(Date.parse(task.completedAt))) return null;
    return t.meta.doneOn(formatDayMonth(toLocalDate(new Date(task.completedAt))));
  }
</script>

<ul class="flex flex-col">
  {#each items as task (task.id)}
    {@const done = task.status === 'done'}
    {@const overdue = isOverdue(task, today, nowMin)}
    {@const due = dueParts(task)}
    {@const scheduled = scheduledText(task)}
    {@const doneOn = doneText(task)}
    {@const subject = task.subjectId === null ? null : subjectNames.get(task.subjectId)}
    <li data-task-id={task.id} class="flex items-start gap-1 border-b border-line last:border-b-0">
      <label class="flex size-11 shrink-0 cursor-pointer items-center justify-center self-center">
        <input
          type="checkbox"
          data-part="check"
          class="size-5 accent-brand"
          checked={done}
          aria-label={done ? t.aria.markUndone(task.title) : t.aria.markDone(task.title)}
          onchange={(e) => ontoggle(task, e.currentTarget.checked)}
        />
      </label>
      <button
        type="button"
        data-part="edit"
        class="flex min-h-[60px] min-w-0 flex-1 flex-col justify-center gap-1 rounded-md px-2 py-2 text-left hover:bg-sunken"
        aria-label={t.aria.row(
          task.title,
          due ? `${due.day}${due.time ? ` · ${due.time}` : ''}` : null,
          overdue,
          done
        )}
        onclick={() => onedit(task)}
      >
        <span class={['text-body font-extrabold break-words text-ink', done && 'text-muted line-through']}
          >{task.title}</span
        >
        <span class="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption font-semibold text-muted">
          <span class="rounded-sm bg-teal-soft px-1.5 py-0.5 font-bold text-teal">{t.types[task.type]}</span>
          {#if task.subjectId !== null}
            {#if subject && !subject.deleted}
              <span class="rounded-sm bg-class-soft px-1.5 py-0.5 font-bold text-class">{subject.name}</span>
            {:else}
              <span class="text-muted">{t.meta.subjectDeleted(subject?.name ?? null)}</span>
            {/if}
          {/if}
          {#if overdue}
            <span
              class="inline-flex items-center gap-1 rounded-full border border-line bg-sunken px-2 py-0.5 font-bold text-ink"
            >
              <Clock size={16} strokeWidth={2} aria-hidden="true" />
              {t.meta.overdue}
            </span>
          {/if}
          {#if due}
            <span class="tabular-nums">{t.meta.due(due.day, due.time)}</span>
          {/if}
          {#if scheduled}
            <span class="tabular-nums">{scheduled}</span>
          {/if}
          {#if task.priority === 'high'}
            <span>{t.meta.priorityHigh}</span>
          {/if}
          {#if doneOn}
            <span>{doneOn}</span>
          {/if}
        </span>
      </button>
    </li>
  {/each}
</ul>

<script lang="ts">
  /**
   * Jadwal (PRD §3, §F4.3, §F5): toggle Hari / Minggu (selalu dibuka di Minggu, tidak disimpan).
   * Aksi utama (brand) satu-satunya: FAB "+" untuk menambah sesi kelas.
   * Tugas di Hari read-only (§F6.2); hapus dari sheet → fokus ke baris tugas berikutnya → sebelumnya →
   * heading hari (urutan tampil: Tenggat lalu blok). Urungkan → baris yang dipulihkan. Tanpa timer.
   */
  import BookOpen from '@lucide/svelte/icons/book-open';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Plus from '@lucide/svelte/icons/plus';
  import { resolve } from '$app/paths';
  import ClassSessionSheet from '$lib/components/ClassSessionSheet.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import DayView from '$lib/components/DayView.svelte';
  import OccurrenceSheet, { type OccurrenceTarget } from '$lib/components/OccurrenceSheet.svelte';
  import RoutineList from '$lib/components/RoutineList.svelte';
  import RoutineSheet, { type RoutineSheetMode } from '$lib/components/RoutineSheet.svelte';
  import TaskSheet, { type TaskSheetMode } from '$lib/components/TaskSheet.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Sheet from '$lib/components/ui/sheet';
  import { copy } from '$lib/copy';
  import { deleteRoutine, endFromDate, restoreOccurrence } from '$lib/data/repo/routines';
  import { deleteTask, restoreTask } from '$lib/data/repo/tasks';
  import { dayAgenda, dayTasks, mergeDay, type DayItem } from '$lib/domain/agenda';
  import { addDays, minutesSinceMidnight } from '$lib/domain/dates';
  import { occurrencesBetween, weekdayOf, weeklyDays } from '$lib/domain/recurrence';
  import { buildWeekTimetable, weekStart, type TimetableSlot } from '$lib/domain/timetable';
  import type { Id, LocalDate, Routine, Task } from '$lib/domain/types';
  import { formatClock, formatDateRange, formatDayMonth } from '$lib/format';
  import { now } from '$lib/stores/now.svelte';
  import { schedule } from '$lib/stores/schedule.svelte';
  import { settings } from '$lib/stores/settings.svelte';
  import { tasks } from '$lib/stores/tasks.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { today } from '$lib/stores/today.svelte';
  import WeekTimetable from '$lib/components/WeekTimetable.svelte';

  const t = copy.schedule;

  const weekStartsOn = $derived(settings.current?.weekStartsOn ?? 1);
  const showSunday = $derived(settings.current?.showSundayInTimetable ?? false);
  const timetable = $derived(
    buildWeekTimetable(schedule.classRoutines, today.current, { weekStartsOn, showSunday })
  );
  const range = $derived(
    formatDateRange(timetable.days[0].date, timetable.days[timetable.days.length - 1].date)
  );
  const hasSessions = $derived(timetable.days.some((d) => d.slots.length > 0));

  let view = $state<'week' | 'day'>('week');
  /** Tanggal tampilan Hari; diisi hari ini setiap kali beralih ke Hari. */
  let selectedDate = $state<LocalDate>(today.current);

  function showView(next: 'week' | 'day') {
    if (next === 'day' && view !== 'day') selectedDate = today.current;
    pendingFocus = null;
    view = next;
  }

  function showDate(next: LocalDate) {
    pendingFocus = null;
    selectedDate = next;
  }

  const dayTaskGroups = $derived(dayTasks(selectedDate, tasks.all, today.current));
  const dayRows = $derived(
    mergeDay(
      dayAgenda(selectedDate, {
        routines: [...schedule.classRoutines, ...schedule.routines, ...schedule.events],
        subjects: schedule.subjects
      }),
      dayTaskGroups.scheduled
    )
  );
  /** Baris tugas hari itu dalam urutan tampil: Tenggat lalu blok (rutin dilewati). */
  const dayTaskIds = $derived([
    ...dayTaskGroups.due.map((x) => x.id),
    ...dayRows.flatMap((row) => (row.type === 'task' ? [row.item.task.id] : []))
  ]);

  async function restore(item: DayItem) {
    await restoreOccurrence(item.routine.id, item.date, new Date().toISOString());
  }

  // ---------- Tugas (read-only, sheet ubah) ----------

  let taskOpen = $state(false);
  /** Sheet terbuka atau belum selesai menutup (perangkap fokus masih aktif). */
  let taskSheetActive = $state(false);
  let taskMode = $state<TaskSheetMode>({ kind: 'add' });

  function editTask(task: Task) {
    taskMode = { kind: 'edit', task };
    taskSheetActive = true;
    taskOpen = true;
  }

  let dayRoot = $state<HTMLElement | null>(null);

  type PendingFocus = {
    /** Tugas yang dihapus; target baru diproses setelah barisnya hilang dari hari itu. */
    awaitGone: Id | null;
    target: Id | 'heading';
  };
  let pendingFocus = $state<PendingFocus | null>(null);

  function neighborOf(id: Id): Id | 'heading' {
    const i = dayTaskIds.indexOf(id);
    return dayTaskIds[i + 1] ?? dayTaskIds[i - 1] ?? 'heading';
  }

  const editPartOf = (id: Id) =>
    dayRoot?.querySelector<HTMLElement>(`[data-task-id="${CSS.escape(id)}"] [data-part="edit"]`) ?? null;

  $effect(() => {
    const p = pendingFocus;
    const ids = dayTaskIds;
    if (!p || taskSheetActive) return;
    if (p.awaitGone !== null && ids.includes(p.awaitGone)) return;

    let el: HTMLElement | null = null;
    if (p.target !== 'heading') el = editPartOf(p.target);
    if (!el) {
      // Urungkan: tunggu baris yang dipulihkan muncul.
      if (p.target !== 'heading' && p.awaitGone === null) return;
      el =
        ids.length === 0 ? (dayRoot?.querySelector<HTMLElement>('#day-heading') ?? null) : editPartOf(ids[0]);
    }
    if (!el) return;
    el.focus();
    pendingFocus = null;
  });

  async function removeTask(task: Task) {
    const neighbor = neighborOf(task.id);
    const token = await deleteTask(task.id, nowIso());
    pendingFocus = { awaitGone: task.id, target: neighbor };
    toast.show({
      message: copy.tasks.deleted,
      action: {
        label: copy.toast.undo,
        run: async () => {
          const ok = await restoreTask(task.id, token, nowIso());
          if (ok) pendingFocus = { awaitGone: null, target: task.id };
          return ok;
        }
      }
    });
  }

  // ---------- Sesi kelas ----------

  let sheetOpen = $state(false);
  let editing = $state<Routine | null>(null);
  /** Diisi = ClassSessionSheet dalam mode "Tanggal ini dan seterusnya". */
  let classFromDate = $state<LocalDate | undefined>(undefined);

  function addSession() {
    editing = null;
    classFromDate = undefined;
    sheetOpen = true;
  }

  /** Sesi bentrok yang sedang dipilih (sheet "Pilih sesi"). */
  let picking = $state<{ slot: TimetableSlot; date: LocalDate } | null>(null);
  let pickOpen = $state(false);

  function pickSession(slot: TimetableSlot, date: LocalDate) {
    picking = { slot, date };
    pickOpen = true;
  }

  const pickItems = $derived(
    (picking?.slot.items ?? []).flatMap((occurrence) => {
      const routine = schedule.classRoutines.find((r) => r.id === occurrence.routineId);
      const subject = routine ? schedule.subjectById(routine.subjectId) : undefined;
      return routine && subject ? [{ occurrence, routine, subject }] : [];
    })
  );

  function choose(routine: Routine) {
    pickOpen = false;
    if (picking) openOccurrence(routine, picking.date);
  }

  const endClock = (end: number) => (end === 1440 ? '24.00' : formatClock(end));

  // ---------- Pilihan edit satu kejadian ----------

  let occurrenceOpen = $state(false);
  let occurrenceTarget = $state<OccurrenceTarget | null>(null);

  const nameOf = (routine: Routine) =>
    routine.kind === 'class' ? (schedule.subjectById(routine.subjectId)?.name ?? '') : routine.title;

  function openOccurrence(routine: Routine, date: LocalDate) {
    const occurrence = occurrencesBetween(routine, date, date)[0];
    if (!occurrence) return;
    occurrenceTarget = {
      routine,
      name: nameOf(routine),
      date,
      startTime: occurrence.startTime,
      durationMin: occurrence.durationMin,
      overridden: occurrence.overridden
    };
    occurrenceOpen = true;
  }

  function editFrom(routine: Routine, date: LocalDate) {
    if (routine.kind === 'class') {
      editing = routine;
      classFromDate = date;
      sheetOpen = true;
    } else {
      routineMode = { kind: 'from', routine, date };
      routineOpen = true;
    }
  }

  // ---------- Rutin ----------

  let routineOpen = $state(false);
  let routineMode = $state<RoutineSheetMode>({ kind: 'add', dtstart: today.current });

  function addRoutine() {
    routineMode = { kind: 'add', dtstart: view === 'day' ? selectedDate : today.current };
    routineOpen = true;
  }

  function editRoutine(routine: Routine) {
    routineMode = { kind: 'edit', routine };
    routineOpen = true;
  }

  // ---------- Konfirmasi hapus ----------

  let confirmOpen = $state(false);
  let confirm = $state<{ title: string; body: string; action: string; run: () => Promise<unknown> } | null>(
    null
  );

  function ask(next: NonNullable<typeof confirm>) {
    confirm = next;
    confirmOpen = true;
  }

  const nowIso = () => new Date().toISOString();

  function askDeleteSession(routine: Routine) {
    const days = routine.rrule ? weeklyDays(routine.rrule).map((d) => copy.weekdays.long[d]) : [];
    ask({
      title: copy.session.confirmTitle,
      body: copy.session.confirmBody(nameOf(routine), days.join(', ')),
      action: copy.session.confirmAction,
      run: () => deleteRoutine(routine.id, nowIso())
    });
  }

  function askDeleteRoutine(routine: Routine, name = routine.title) {
    ask({
      title: copy.routine.confirmTitle(name),
      body: copy.routine.confirmBody,
      action: copy.routine.confirmAction,
      run: () => deleteRoutine(routine.id, nowIso())
    });
  }

  function askEndFrom(routine: Routine, date: LocalDate) {
    const day = formatDayMonth(date);
    ask({
      title: copy.routine.confirmFromTitle(day),
      body: copy.routine.confirmFromBody(nameOf(routine), day),
      action: copy.routine.confirmAction,
      run: () => endFromDate(routine.id, date, nowIso())
    });
  }

  async function runConfirm() {
    await confirm?.run();
  }
</script>

<svelte:head><title>{copy.pages.schedule.title} · {copy.appName}</title></svelte:head>

<div class="flex flex-col gap-5 pt-6">
  <header class="flex items-center justify-between gap-3">
    <h1 class="text-heading-xl font-extrabold tracking-[-0.02em] text-ink">{copy.pages.schedule.title}</h1>
    <a
      href={resolve('/jadwal/mapel')}
      class="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line bg-card px-3.5 text-label font-bold text-ink"
      aria-label={t.subjectsLinkLabel}
    >
      <BookOpen size={16} strokeWidth={2} aria-hidden="true" />
      {t.subjectsLink}
    </a>
  </header>

  <div
    role="group"
    aria-label={t.viewGroupLabel}
    class="grid grid-cols-2 gap-1 rounded-lg border border-line bg-card p-1"
  >
    {#each [['day', t.viewDay], ['week', t.viewWeek]] as const as [value, label] (value)}
      <button
        type="button"
        aria-pressed={view === value}
        class={[
          'min-h-11 rounded-md text-label font-extrabold',
          view === value ? 'bg-sunken text-ink' : 'text-muted hover:bg-sunken'
        ]}
        onclick={() => showView(value)}>{label}</button
      >
    {/each}
  </div>

  {#if view === 'day'}
    {#if schedule.loaded && tasks.loaded}
      <div bind:this={dayRoot} class="contents">
        <DayView
          date={selectedDate}
          today={today.current}
          rows={dayRows}
          due={dayTaskGroups.due}
          nowMin={minutesSinceMidnight(now.current)}
          subjectNames={tasks.subjectNames}
          onprev={() => showDate(addDays(selectedDate, -1))}
          onnext={() => showDate(addDays(selectedDate, 1))}
          ontoday={() => showDate(today.current)}
          onselect={(item) => openOccurrence(item.routine, item.date)}
          onselecttask={editTask}
          onrestore={restore}
        />
      </div>
    {/if}
  {:else if schedule.loaded && schedule.subjects.length === 0}
    <section class="flex flex-col gap-4 rounded-xl border border-line bg-card p-5">
      <div class="flex flex-col gap-1">
        <h2 class="text-heading-md font-extrabold text-ink">{t.noSubjectsTitle}</h2>
        <p class="text-body text-muted">{t.noSubjectsBody}</p>
      </div>
      <Button variant="outline" href={resolve('/jadwal/mapel')}>{t.noSubjectsAction}</Button>
    </section>
  {:else if schedule.loaded}
    <section
      aria-labelledby="week-heading"
      class="flex flex-col gap-3 rounded-xl border border-line bg-card px-1 pt-5 pb-3"
    >
      <div class="flex items-baseline justify-between px-4">
        <h2 id="week-heading" class="text-heading-md font-extrabold text-ink">{t.weekHeading}</h2>
        <p class="text-label font-semibold text-muted">{range}</p>
      </div>
      {#if !hasSessions}
        <p class="px-4 text-body text-muted">{t.noSessionsBody}</p>
      {/if}
      <WeekTimetable
        {timetable}
        today={today.current}
        routines={schedule.classRoutines}
        subjects={schedule.subjects}
        onselect={openOccurrence}
        onpick={pickSession}
      />
    </section>
  {/if}

  {#if schedule.loaded}
    <RoutineList
      routines={schedule.routines}
      unsupported={schedule.unsupported}
      subjects={schedule.subjects}
      today={today.current}
      onadd={addRoutine}
      onedit={editRoutine}
      ondelete={askDeleteRoutine}
    />
  {/if}
  <!-- Ruang setinggi FAB (60 px + jarak) agar jam terakhir grid bisa digulir ke atas FAB. -->
  <div class="h-[76px] shrink-0" aria-hidden="true"></div>
</div>

<div
  class="pointer-events-none fixed inset-x-0 bottom-[calc(104px+env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-lg justify-end px-5"
>
  <button
    type="button"
    class="pointer-events-auto flex size-[60px] items-center justify-center rounded-xl bg-brand text-on-brand shadow-fab hover:bg-brand-pressed"
    aria-label={t.addSession}
    onclick={addSession}
  >
    <Plus size={24} strokeWidth={2} aria-hidden="true" />
  </button>
</div>

<ClassSessionSheet
  bind:open={sheetOpen}
  routine={editing}
  dtstart={weekStart(today.current, weekStartsOn)}
  {weekStartsOn}
  {showSunday}
  fromDate={classFromDate}
  ondelete={askDeleteSession}
  onend={askEndFrom}
/>

<TaskSheet
  bind:open={taskOpen}
  mode={taskMode}
  today={today.current}
  subjects={schedule.subjects}
  subjectNames={tasks.subjectNames}
  ondelete={removeTask}
  onsettled={() => (taskSheetActive = false)}
/>

<OccurrenceSheet bind:open={occurrenceOpen} target={occurrenceTarget} onfromdate={editFrom} />

<RoutineSheet
  bind:open={routineOpen}
  mode={routineMode}
  {weekStartsOn}
  ondelete={(routine) => askDeleteRoutine(routine)}
  onend={askEndFrom}
/>

<Sheet.Root bind:open={pickOpen}>
  <Sheet.Content>
    <Sheet.Header>
      <Sheet.Title>{t.pickTitle}</Sheet.Title>
      <Sheet.Description
        >{picking ? t.pickDescription(copy.weekdays.long[weekdayOf(picking.date)]) : ''}</Sheet.Description
      >
    </Sheet.Header>
    <ul class="flex flex-col">
      {#each pickItems as { occurrence, routine, subject } (routine.id)}
        <li class="border-b border-line last:border-b-0">
          <button
            type="button"
            class="-mx-2 flex min-h-[60px] w-[calc(100%+16px)] items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-sunken"
            aria-label={t.pickItemLabel(
              subject.name,
              formatClock(occurrence.start),
              endClock(occurrence.end)
            )}
            onclick={() => choose(routine)}
          >
            <span class="size-2.5 shrink-0 rounded-full bg-class" aria-hidden="true"></span>
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="truncate text-body font-extrabold text-ink">{subject.name}</span>
              <span class="truncate text-caption font-semibold text-muted tabular-nums"
                >{formatClock(occurrence.start)}–{endClock(occurrence.end)}{routine.location
                  ? ` · ${routine.location}`
                  : ''}</span
              >
            </span>
            <ChevronRight size={20} strokeWidth={2} class="shrink-0 text-muted" aria-hidden="true" />
          </button>
        </li>
      {/each}
    </ul>
  </Sheet.Content>
</Sheet.Root>

<ConfirmDialog
  bind:open={confirmOpen}
  title={confirm?.title ?? ''}
  body={confirm?.body ?? ''}
  action={confirm?.action ?? ''}
  onconfirm={runConfirm}
/>

<script lang="ts">
  /**
   * Jadwal (PRD §F4.3): tampilan Minggu. Tampilan Hari dan daftar Rutin = F5.
   * Aksi utama (brand) satu-satunya: FAB "+" untuk menambah sesi kelas.
   */
  import BookOpen from '@lucide/svelte/icons/book-open';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Plus from '@lucide/svelte/icons/plus';
  import { resolve } from '$app/paths';
  import ClassSessionSheet from '$lib/components/ClassSessionSheet.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Sheet from '$lib/components/ui/sheet';
  import { copy } from '$lib/copy';
  import { deleteRoutine } from '$lib/data/repo/routines';
  import { weekdayOf, weeklyDays } from '$lib/domain/recurrence';
  import { buildWeekTimetable, weekStart, type TimetableSlot } from '$lib/domain/timetable';
  import type { LocalDate, Routine } from '$lib/domain/types';
  import { formatClock, formatDateRange } from '$lib/format';
  import { schedule } from '$lib/stores/schedule.svelte';
  import { settings } from '$lib/stores/settings.svelte';
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

  let sheetOpen = $state(false);
  let editing = $state<Routine | null>(null);
  let confirmOpen = $state(false);
  let toDelete = $state<Routine | null>(null);

  function addSession() {
    editing = null;
    sheetOpen = true;
  }

  function editSession(routine: Routine) {
    editing = routine;
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
    editSession(routine);
  }

  const endClock = (end: number) => (end === 1440 ? '24.00' : formatClock(end));

  function askDelete(routine: Routine) {
    toDelete = routine;
    confirmOpen = true;
  }

  const deleteBody = $derived.by(() => {
    if (!toDelete) return '';
    const name = schedule.subjectById(toDelete.subjectId)?.name ?? '';
    const days = toDelete.rrule ? weeklyDays(toDelete.rrule).map((d) => copy.weekdays.long[d]) : [];
    return copy.session.confirmBody(name, days.join(', '));
  });

  async function confirmDelete() {
    if (toDelete) await deleteRoutine(toDelete.id, new Date().toISOString());
    toDelete = null;
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

  {#if schedule.loaded && schedule.subjects.length === 0}
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
        onselect={editSession}
        onpick={pickSession}
      />
    </section>
  {/if}
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
  ondelete={askDelete}
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
  title={copy.session.confirmTitle}
  body={deleteBody}
  action={copy.session.confirmAction}
  onconfirm={confirmDelete}
/>

<script lang="ts">
  /**
   * Grid timetable mingguan (PRD §F4.3). Kolom = hari, sumbu tegak = jam (minimal 06–18).
   * Sesi memakai token class/class-soft. Sesi bentrok digabung jadi satu blok selebar kolom
   * berlabel "N sesi"; mengetuknya membuka pilihan sesi (onpick), bukan lane berdampingan yang
   * hanya ±21 px di layar 360 px. Lebar acuan 360 px: kolom jam 24 px, enam kolom hari ±45 px.
   */
  import { copy } from '$lib/copy';
  import type { TimetableSlot, WeekTimetable } from '$lib/domain/timetable';
  import type { LocalDate, Routine, Subject } from '$lib/domain/types';
  import { formatClock } from '$lib/format';

  let {
    timetable,
    today,
    routines,
    subjects,
    onselect,
    onpick
  }: {
    timetable: WeekTimetable;
    today: LocalDate;
    routines: readonly Routine[];
    subjects: readonly Subject[];
    onselect: (routine: Routine) => void;
    /** Slot berisi lebih dari satu sesi yang bentrok. */
    onpick: (slot: TimetableSlot, date: LocalDate) => void;
  } = $props();

  /** Tinggi satu jam dalam px. 45 menit ≈ 42 px. */
  const HOUR = 56;
  /** Ruang di atas garis jam pertama agar labelnya tidak terpotong. */
  const PAD = 8;

  const hours = $derived(
    Array.from({ length: timetable.endHour - timetable.startHour + 1 }, (_, i) => timetable.startHour + i)
  );
  const height = $derived((timetable.endHour - timetable.startHour) * HOUR);
  const routineById = $derived(new Map(routines.map((r) => [r.id, r])));
  const subjectById = $derived(new Map(subjects.map((s) => [s.id, s])));
  const columns = $derived(`24px repeat(${timetable.days.length}, minmax(0, 1fr))`);

  const dayNumber = (date: LocalDate) => String(Number(date.slice(8, 10)));
  const endClock = (end: number) => (end === 1440 ? '24.00' : formatClock(end));

  function slotStyle(slot: TimetableSlot): string {
    const top = PAD + ((slot.start - timetable.startHour * 60) / 60) * HOUR;
    const slotHeight = Math.max(((slot.end - slot.start) / 60) * HOUR, 20);
    return `top:${top}px;height:${slotHeight}px`;
  }

  /** Tinggi satu baris text-caption. */
  const LINE = 16;

  /** Jumlah baris text-caption yang muat di blok setinggi `minutes`. */
  const linesFor = (minutes: number) =>
    Math.max(1, Math.floor((Math.max((minutes / 60) * HOUR, 20) - 6) / LINE));

  /** Sesi bentrok dengan mapelnya; sesi yang mapelnya tidak ditemukan dilewati. */
  function sessionsOf(slot: TimetableSlot) {
    return slot.items.flatMap((occurrence) => {
      const routine = routineById.get(occurrence.routineId);
      const subject = routine?.subjectId ? subjectById.get(routine.subjectId) : undefined;
      return routine && subject ? [{ occurrence, routine, subject }] : [];
    });
  }

  /**
   * Isi blok bentrok di bawah lencana jumlah sesi: satu baris per mapel (singkatan, atau kata
   * pertama nama), lalu jam mulai jika masih muat. Baris yang tidak muat dibuang.
   * Lencana dipakai karena "2 sesi" tidak muat di kolom ±45 px (sisa ±31 px setelah bingkai).
   */
  function clashLines(slot: TimetableSlot, subjects: Subject[]): { lines: string[]; time: boolean } {
    const max = Math.max(1, linesFor(slot.end - slot.start) - 1);
    const lines = subjects.map((s) => s.abbr ?? s.name.split(' ')[0]);
    if (lines.length < max) return { lines, time: true };
    if (lines.length === max) return { lines, time: false };
    const shown = lines.slice(0, max);
    shown[max - 1] = `${shown[max - 1]}…`;
    return { lines: shown, time: false };
  }

  /** Singkatan mapel jika ada (satu baris), jika tidak nama per kata. */
  function labelLines(subject: Subject, minutes: number, withTime: boolean): string[] {
    return subject.abbr ? [subject.abbr] : nameLines(subject.name, minutes, withTime);
  }

  /**
   * Nama mapel dipecah per kata, satu kata per baris (dipotong dengan elipsis jika lebih lebar
   * dari kolom). Lebih terbaca di kolom ±45 px daripada memotong di tengah kata.
   */
  function nameLines(name: string, minutes: number, withTime: boolean): string[] {
    const inner = Math.max((minutes / 60) * HOUR, 20) - 6;
    const max = Math.max(1, Math.floor((inner - (withTime ? LINE : 0)) / LINE));
    const words = name.split(' ');
    if (words.length <= max) return words;
    const shown = words.slice(0, max);
    shown[max - 1] = `${shown[max - 1]}…`;
    return shown;
  }
</script>

<div class="flex flex-col">
  <div class="grid gap-x-0.5" style:grid-template-columns={columns}>
    <span aria-hidden="true"></span>
    {#each timetable.days as day (day.date)}
      {@const isToday = day.date === today}
      <div
        class={[
          'flex flex-col items-center rounded-md py-1.5',
          isToday ? 'bg-brand-soft text-brand-ink' : 'text-muted'
        ]}
        aria-current={isToday ? 'date' : undefined}
      >
        <span class="text-caption font-bold">{copy.weekdays.short[day.weekday]}</span>
        <span class={['text-label', isToday ? 'font-extrabold' : 'font-semibold']}>{dayNumber(day.date)}</span
        >
        {#if isToday}<span class="sr-only">{copy.schedule.todayMarker}</span>{/if}
      </div>
    {/each}
  </div>

  <div class="relative mt-1" style:height="{height + PAD * 2}px">
    {#each hours as hour (hour)}
      <div
        class="absolute right-0 left-[24px] border-t border-line"
        style:top="{PAD + (hour - timetable.startHour) * HOUR}px"
        aria-hidden="true"
      ></div>
      {#if hour < timetable.endHour}
        <span
          class="absolute left-0 w-5 -translate-y-1/2 text-right text-caption font-semibold text-muted tabular-nums"
          style:top="{PAD + (hour - timetable.startHour) * HOUR}px"
          aria-hidden="true">{String(hour).padStart(2, '0')}</span
        >
      {/if}
    {/each}

    <div class="absolute inset-0 grid gap-x-0.5" style:grid-template-columns={columns}>
      <span aria-hidden="true"></span>
      {#each timetable.days as day (day.date)}
        <ul class="relative" aria-label={copy.weekdays.long[day.weekday]}>
          {#each day.slots as slot (slot.items[0].routineId)}
            {@const sessions = sessionsOf(slot)}
            {#if sessions.length === 1}
              {@const { routine, subject } = sessions[0]}
              {@const tall = slot.end - slot.start >= 40}
              <li class="absolute inset-x-0 p-px" style={slotStyle(slot)}>
                <button
                  type="button"
                  data-routine={routine.id}
                  data-date={day.date}
                  class="flex size-full flex-col items-start overflow-hidden rounded-sm border-l-2 border-class bg-class-soft px-[3px] py-0.5 text-left text-class"
                  aria-label={copy.schedule.blockLabel(
                    subject.name,
                    copy.weekdays.long[day.weekday],
                    formatClock(slot.start),
                    endClock(slot.end),
                    routine.location
                  )}
                  onclick={() => onselect(routine)}
                >
                  <span class="flex w-full min-w-0 flex-col" aria-hidden="true">
                    {#each labelLines(subject, slot.end - slot.start, tall) as word, i (i)}
                      <span class="block truncate text-caption font-bold tracking-[-0.01em]">{word}</span>
                    {/each}
                  </span>
                  {#if tall}
                    <span class="text-caption font-semibold tabular-nums" aria-hidden="true"
                      >{formatClock(slot.start)}</span
                    >
                  {/if}
                </button>
              </li>
            {:else if sessions.length > 1}
              {@const content = clashLines(
                slot,
                sessions.map((s) => s.subject)
              )}
              <li class="absolute inset-x-0 p-px" style={slotStyle(slot)}>
                <button
                  type="button"
                  data-clash={sessions.length}
                  data-date={day.date}
                  class="flex size-full flex-col items-start overflow-hidden rounded-sm border-2 border-class bg-class-soft px-[3px] py-0.5 text-left text-class"
                  aria-label={copy.schedule.clashLabel(
                    sessions.length,
                    copy.weekdays.long[day.weekday],
                    formatClock(slot.start),
                    endClock(slot.end),
                    sessions.map((s) => s.subject.name).join(', ')
                  )}
                  onclick={() => onpick(slot, day.date)}
                >
                  <span class="flex w-full min-w-0 flex-col items-start" aria-hidden="true">
                    <span
                      class="rounded-full bg-class px-1.5 text-caption leading-4 font-extrabold text-class-soft tabular-nums"
                      >{sessions.length}</span
                    >
                    {#each content.lines as line, i (i)}
                      <span class="block w-full truncate text-caption font-bold tracking-[-0.01em]"
                        >{line}</span
                      >
                    {/each}
                  </span>
                  {#if content.time}
                    <span class="text-caption font-semibold tabular-nums" aria-hidden="true"
                      >{formatClock(slot.start)}</span
                    >
                  {/if}
                </button>
              </li>
            {/if}
          {/each}
        </ul>
      {/each}
    </div>
  </div>
</div>

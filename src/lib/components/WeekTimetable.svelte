<script lang="ts">
  /**
   * Grid timetable mingguan (PRD §F4.3). Kolom = hari, sumbu tegak = jam (minimal 06–18).
   * Sesi memakai token class/class-soft; sesi bentrok tampil berdampingan (lane).
   * Lebar acuan 360 px: kolom jam 24 px, enam kolom hari ±45 px.
   */
  import { copy } from '$lib/copy';
  import type { TimetableBlock, WeekTimetable } from '$lib/domain/timetable';
  import type { LocalDate, Routine, Subject } from '$lib/domain/types';
  import { formatClock } from '$lib/format';

  let {
    timetable,
    today,
    routines,
    subjects,
    onselect
  }: {
    timetable: WeekTimetable;
    today: LocalDate;
    routines: readonly Routine[];
    subjects: readonly Subject[];
    onselect: (routine: Routine) => void;
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

  function blockStyle(block: TimetableBlock): string {
    const top = PAD + ((block.start - timetable.startHour * 60) / 60) * HOUR;
    const blockHeight = Math.max(((block.end - block.start) / 60) * HOUR, 20);
    const width = 100 / block.laneCount;
    return `top:${top}px;height:${blockHeight}px;left:${block.lane * width}%;width:${width}%`;
  }

  /** Tinggi satu baris text-caption. */
  const LINE = 16;

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
          {#each day.blocks as block (block.routineId)}
            {@const routine = routineById.get(block.routineId)}
            {@const subject = routine?.subjectId ? subjectById.get(routine.subjectId) : undefined}
            {#if routine && subject}
              {@const tall = block.end - block.start >= 40}
              <li class="absolute p-px" style={blockStyle(block)}>
                <button
                  type="button"
                  data-routine={routine.id}
                  data-date={block.date}
                  class="flex size-full flex-col items-start overflow-hidden rounded-sm border-l-2 border-class bg-class-soft px-[3px] py-0.5 text-left text-class"
                  aria-label={copy.schedule.blockLabel(
                    subject.name,
                    copy.weekdays.long[day.weekday],
                    formatClock(block.start),
                    endClock(block.end),
                    routine.location
                  )}
                  onclick={() => onselect(routine)}
                >
                  <span class="flex w-full min-w-0 flex-col" aria-hidden="true">
                    {#each labelLines(subject, block.end - block.start, tall) as word, i (i)}
                      <span class="block truncate text-caption font-bold tracking-[-0.01em]">{word}</span>
                    {/each}
                  </span>
                  {#if tall}
                    <span class="text-caption font-semibold tabular-nums" aria-hidden="true"
                      >{formatClock(block.start)}</span
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

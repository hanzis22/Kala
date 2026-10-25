<script lang="ts">
  /**
   * Daftar Rutin di /jadwal (PRD §F5). Seri tidak digabung: setelah "Tanggal ini dan seterusnya",
   * seri lama dan baru tampil berdampingan dengan label "Sampai …" / "Mulai …". Rutin dan sesi kelas
   * dengan pola tak dikenal tampil read-only dan bisa dihapus, agar tidak ada yang hilang diam-diam.
   */
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import { Button } from '$lib/components/ui/button';
  import { copy } from '$lib/copy';
  import { describeRule, parseRule } from '$lib/domain/recurrence';
  import type { LocalDate, Routine, Subject } from '$lib/domain/types';
  import { formatClock, formatDayMonth } from '$lib/format';
  import { toMinutes } from '$lib/domain/dates';

  let {
    routines,
    unsupported,
    subjects,
    today,
    onadd,
    onedit,
    ondelete
  }: {
    /** Rutin umum dengan pola yang didukung. */
    routines: readonly Routine[];
    unsupported: readonly Routine[];
    subjects: readonly Subject[];
    today: LocalDate;
    onadd: () => void;
    onedit: (routine: Routine) => void;
    ondelete: (routine: Routine, name: string) => void;
  } = $props();

  const t = copy.routine;

  const visible = $derived(
    routines
      .filter((r) => r.until === null || r.until >= today)
      .sort((a, b) => a.title.localeCompare(b.title, 'id') || a.dtstart.localeCompare(b.dtstart))
  );

  const nameOf = (r: Routine) =>
    (r.kind === 'class' ? subjects.find((s) => s.id === r.subjectId)?.name : r.title) || t.untitled;

  function timeRange(r: Routine): string {
    const start = toMinutes(r.startTime);
    const end = start + r.durationMin;
    return `${formatClock(start)}–${end === 1440 ? '24.00' : formatClock(end)}`;
  }

  function ruleText(r: Routine): string {
    const spec = r.rrule ? parseRule(r.rrule) : null;
    return spec ? describeRule(spec) : '';
  }

  function rangeLabels(r: Routine): string[] {
    const labels: string[] = [];
    if (r.dtstart > today) labels.push(t.fromLabel(formatDayMonth(r.dtstart)));
    if (r.until !== null) labels.push(t.untilLabel(formatDayMonth(r.until)));
    return labels;
  }
</script>

<section
  aria-labelledby="routine-heading"
  class="flex flex-col gap-3 rounded-xl border border-line bg-card p-5"
>
  <div class="flex items-center justify-between gap-3">
    <h2 id="routine-heading" class="text-heading-md font-extrabold text-ink">{t.heading}</h2>
    <Button variant="outline" size="sm" onclick={onadd}>{t.add}</Button>
  </div>

  {#if visible.length === 0 && unsupported.length === 0}
    <p class="text-body text-muted">{t.empty}</p>
  {:else}
    <ul class="flex flex-col">
      {#each visible as r (r.id)}
        {@const rule = ruleText(r)}
        {@const labels = rangeLabels(r)}
        <li class="border-b border-line last:border-b-0" data-routine={r.id}>
          <button
            type="button"
            class="-mx-2 flex min-h-[60px] w-[calc(100%+16px)] items-center gap-3 rounded-md px-2 py-2.5 text-left hover:bg-sunken"
            aria-label={t.editLabel(r.title, [rule, timeRange(r), ...labels].join(', '))}
            onclick={() => onedit(r)}
          >
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="truncate text-body font-extrabold text-ink">{r.title}</span>
              <span class="text-caption font-semibold text-muted">{rule}</span>
              <span class="flex flex-wrap items-center gap-1.5 text-caption font-semibold text-muted">
                <span class="tabular-nums">{timeRange(r)}</span>
                {#each labels as label (label)}
                  <span class="rounded-full border border-line px-2 py-0.5 font-bold text-ink">{label}</span>
                {/each}
              </span>
            </span>
            <ChevronRight size={20} strokeWidth={2} class="shrink-0 text-muted" aria-hidden="true" />
          </button>
        </li>
      {/each}
      {#each unsupported as r (r.id)}
        {@const name = nameOf(r)}
        <li
          class="flex min-h-[60px] items-center gap-3 border-b border-line py-2.5 last:border-b-0"
          data-routine={r.id}
        >
          <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span class="truncate text-body font-extrabold text-ink">{name}</span>
            <span class="text-caption font-semibold text-muted">{t.unsupported}</span>
          </span>
          <Button
            variant="destructive"
            size="sm"
            aria-label={t.deleteLabel(name)}
            onclick={() => ondelete(r, name)}>{copy.common.delete}</Button
          >
        </li>
      {/each}
    </ul>
  {/if}
</section>

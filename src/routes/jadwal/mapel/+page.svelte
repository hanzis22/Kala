<script lang="ts">
  /** Kelola mata pelajaran (PRD §F4.1, §F4.4). Aksi utama: "Tambah mapel". */
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import { resolve } from '$app/paths';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import SubjectSheet from '$lib/components/SubjectSheet.svelte';
  import { Button } from '$lib/components/ui/button';
  import { copy } from '$lib/copy';
  import { deleteSubject } from '$lib/data/repo/subjects';
  import { weeklyDays } from '$lib/domain/recurrence';
  import type { Subject } from '$lib/domain/types';
  import { schedule } from '$lib/stores/schedule.svelte';

  const t = copy.subjects;

  /** Jumlah sesi per minggu per mapel (satu Routine bisa berisi beberapa hari). */
  const sessionsBySubject = $derived.by(() => {
    const counts: Record<string, number> = {};
    for (const r of schedule.classRoutines) {
      if (!r.subjectId || !r.rrule) continue;
      counts[r.subjectId] = (counts[r.subjectId] ?? 0) + weeklyDays(r.rrule).length;
    }
    return counts;
  });

  let sheetOpen = $state(false);
  let editing = $state<Subject | null>(null);
  let confirmOpen = $state(false);
  let toDelete = $state<Subject | null>(null);

  function add() {
    editing = null;
    sheetOpen = true;
  }

  function edit(subject: Subject) {
    editing = subject;
    sheetOpen = true;
  }

  function askDelete(subject: Subject) {
    toDelete = subject;
    confirmOpen = true;
  }

  async function confirmDelete() {
    if (toDelete) await deleteSubject(toDelete.id, new Date().toISOString());
    toDelete = null;
  }

  const meta = (s: Subject) =>
    [s.abbr, s.teacher, s.room, t.sessions(sessionsBySubject[s.id] ?? 0)].filter(Boolean).join(' · ');
</script>

<svelte:head><title>{copy.pages.subjects.title} · {copy.appName}</title></svelte:head>

<div class="flex flex-col gap-5 pt-6">
  <header class="flex items-center gap-2">
    <a
      href={resolve('/jadwal')}
      class="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-sunken"
      aria-label={t.back}
    >
      <ArrowLeft size={22} strokeWidth={2} aria-hidden="true" />
    </a>
    <h1 class="text-heading-xl font-extrabold tracking-[-0.02em] text-ink">{copy.pages.subjects.title}</h1>
  </header>

  {#if schedule.loaded}
    {#if schedule.subjects.length === 0}
      <section class="flex flex-col gap-1 rounded-xl border border-line bg-card p-5">
        <h2 class="text-heading-md font-extrabold text-ink">{t.emptyTitle}</h2>
        <p class="text-body text-muted">{t.emptyBody}</p>
      </section>
    {:else}
      <section
        aria-labelledby="subjects-heading"
        class="flex flex-col rounded-xl border border-line bg-card p-5 pb-2"
      >
        <h2 id="subjects-heading" class="text-heading-md font-extrabold text-ink">{t.listHeading}</h2>
        <ul class="mt-2 flex flex-col">
          {#each schedule.subjects as subject (subject.id)}
            <li class="border-b border-line last:border-b-0">
              <button
                type="button"
                class="-mx-2 flex min-h-[60px] w-[calc(100%+16px)] items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-sunken"
                aria-label={t.editLabel(subject.name)}
                onclick={() => edit(subject)}
              >
                <span class="size-2.5 shrink-0 rounded-full bg-class" aria-hidden="true"></span>
                <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span class="truncate text-body font-extrabold text-ink">{subject.name}</span>
                  <span class="truncate text-caption font-semibold text-muted">{meta(subject)}</span>
                </span>
                <ChevronRight size={20} strokeWidth={2} class="shrink-0 text-muted" aria-hidden="true" />
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <Button size="lg" onclick={add}>{t.add}</Button>
  {/if}
</div>

<SubjectSheet bind:open={sheetOpen} subject={editing} ondelete={askDelete} />

<ConfirmDialog
  bind:open={confirmOpen}
  title={toDelete ? t.confirmTitle(toDelete.name) : ''}
  body={t.confirmBody(toDelete ? (sessionsBySubject[toDelete.id] ?? 0) : 0)}
  action={t.confirmAction}
  onconfirm={confirmDelete}
/>

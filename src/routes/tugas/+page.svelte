<script lang="ts">
  /**
   * Tugas (PRD §F6.3): filter Semua / Hari ini / Minggu ini / Selesai (selalu dibuka di Semua, tidak
   * disimpan). Hari ini punya grup kedua "Belum selesai sebelumnya". Aksi brand satu-satunya: FAB "+".
   * Fokus setelah hapus/centang: baris berikutnya → sebelumnya → heading (urutan tampil gabungan);
   * setelah Urungkan: baris yang dipulihkan. Tanpa timer: ditunggu sampai liveQuery merender ulang.
   */
  import Plus from '@lucide/svelte/icons/plus';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import TaskList from '$lib/components/TaskList.svelte';
  import TaskSheet, { type TaskSheetMode } from '$lib/components/TaskSheet.svelte';
  import { Button } from '$lib/components/ui/button';
  import { copy } from '$lib/copy';
  import {
    clearCompletedTasks,
    completeTask,
    deleteTask,
    reopenTask,
    restoreTask
  } from '$lib/data/repo/tasks';
  import { minutesSinceMidnight } from '$lib/domain/dates';
  import {
    filterTasks,
    isClearable,
    todayGroups,
    type TaskFilter,
    type TaskFilterContext,
    type TodayGroups
  } from '$lib/domain/tasks';
  import type { Id, Task } from '$lib/domain/types';
  import { now } from '$lib/stores/now.svelte';
  import { schedule } from '$lib/stores/schedule.svelte';
  import { settings } from '$lib/stores/settings.svelte';
  import { tasks } from '$lib/stores/tasks.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { today } from '$lib/stores/today.svelte';

  const t = copy.tasks;
  const FILTERS: readonly TaskFilter[] = ['all', 'today', 'week', 'done'];

  let filter = $state<TaskFilter>('all');

  const ctx = $derived<TaskFilterContext>({
    today: today.current,
    nowMin: minutesSinceMidnight(now.current),
    weekStartsOn: settings.current?.weekStartsOn ?? 1
  });

  function groupsFor(list: readonly Task[], f: TaskFilter, c: TaskFilterContext): TodayGroups {
    return f === 'today' ? todayGroups(list, c) : { main: filterTasks(list, f, c), carriedOver: [] };
  }

  const groups = $derived(groupsFor(tasks.all, filter, ctx));
  /** Urutan tampil gabungan (= filterTasks(…, 'today') untuk Hari ini). */
  const visible = $derived([...groups.main, ...groups.carriedOver]);
  const clearableCount = $derived(
    filter === 'done' ? tasks.all.filter((x) => isClearable(x, now.current.toISOString())).length : 0
  );
  const empty = $derived(
    filter === 'all'
      ? { title: copy.pages.tasks.emptyTitle, body: copy.pages.tasks.emptyBody }
      : t.empty[filter]
  );

  const nowIso = () => new Date().toISOString();

  function selectFilter(next: TaskFilter) {
    pendingFocus = null;
    filter = next;
  }

  // ---------- Fokus ----------

  let heading = $state<HTMLHeadingElement | null>(null);
  let listRoot = $state<HTMLElement | null>(null);

  type PendingFocus = {
    /** Baris yang dihapus/dicentang; target baru diproses setelah baris ini hilang dari `visible`. */
    awaitGone: Id | null;
    target: Id | 'heading';
    part: 'edit' | 'check';
  };
  let pendingFocus = $state<PendingFocus | null>(null);

  function neighborOf(id: Id): Id | 'heading' {
    const i = visible.findIndex((x) => x.id === id);
    return visible[i + 1]?.id ?? visible[i - 1]?.id ?? 'heading';
  }

  const partOf = (id: Id, part: PendingFocus['part']) =>
    listRoot?.querySelector<HTMLElement>(`[data-task-id="${CSS.escape(id)}"] [data-part="${part}"]`) ?? null;

  $effect(() => {
    const p = pendingFocus;
    const rows = visible;
    // Selama sheet masih memerangkap fokus, tunggu sampai tertutup (onsettled).
    if (!p || sheetActive) return;
    if (p.awaitGone !== null && rows.some((x) => x.id === p.awaitGone)) return;

    let el: HTMLElement | null = null;
    if (p.target !== 'heading') el = partOf(p.target, p.part);
    if (!el) {
      // Urungkan: tunggu baris yang dipulihkan muncul.
      if (p.target !== 'heading' && p.awaitGone === null) return;
      el = rows.length === 0 ? heading : partOf(rows[0].id, p.part);
    }
    if (!el) return;
    el.focus();
    pendingFocus = null;
  });

  // ---------- Sheet ----------

  let sheetOpen = $state(false);
  /** Sheet terbuka atau belum selesai menutup (perangkap fokus masih aktif). */
  let sheetActive = $state(false);
  let sheetMode = $state<TaskSheetMode>({ kind: 'add' });

  function openSheet(mode: TaskSheetMode) {
    sheetMode = mode;
    sheetActive = true;
    sheetOpen = true;
  }

  const addTask = () => openSheet({ kind: 'add' });
  const editTask = (task: Task) => openSheet({ kind: 'edit', task });

  async function removeTask(task: Task) {
    const neighbor = neighborOf(task.id);
    const token = await deleteTask(task.id, nowIso());
    pendingFocus = { awaitGone: task.id, target: neighbor, part: 'edit' };
    toast.show({
      message: t.deleted,
      action: {
        label: copy.toast.undo,
        run: async () => {
          const ok = await restoreTask(task.id, token, nowIso());
          if (ok) pendingFocus = { awaitGone: null, target: task.id, part: 'edit' };
          return ok;
        }
      }
    });
  }

  async function toggleTask(task: Task, checked: boolean) {
    const next: Task = { ...task, status: checked ? 'done' : 'todo', completedAt: checked ? nowIso() : null };
    const g = groupsFor([next], filter, ctx);
    const stays = g.main.length + g.carriedOver.length > 0;
    if (!stays) pendingFocus = { awaitGone: task.id, target: neighborOf(task.id), part: 'check' };
    try {
      if (checked) await completeTask(task.id, nowIso());
      else await reopenTask(task.id, nowIso());
    } catch (err) {
      pendingFocus = null;
      console.error('[tasks] centang gagal', err);
    }
  }

  // ---------- Bersihkan ----------

  let clearOpen = $state(false);

  async function clearDone() {
    const n = await clearCompletedTasks(nowIso());
    if (n > 0) toast.show({ message: t.cleared(n) });
  }
</script>

<svelte:head><title>{copy.pages.tasks.title} · {copy.appName}</title></svelte:head>

<header class="pt-6 pb-5">
  <h1 bind:this={heading} tabindex="-1" class="text-heading-xl font-extrabold tracking-[-0.02em] text-ink">
    {copy.pages.tasks.title}
  </h1>
</header>

<div class="flex flex-col gap-5">
  <div
    role="group"
    aria-label={t.filterLabel}
    class="grid grid-cols-4 gap-1 rounded-lg border border-line bg-card p-1"
  >
    {#each FILTERS as value (value)}
      <button
        type="button"
        aria-pressed={filter === value}
        class={[
          'min-h-11 rounded-md px-1 text-label font-extrabold',
          filter === value ? 'bg-sunken text-ink' : 'text-muted hover:bg-sunken'
        ]}
        onclick={() => selectFilter(value)}>{t.filters[value]}</button
      >
    {/each}
  </div>

  {#if tasks.loaded}
    <div class="flex items-center justify-between gap-3">
      <p class="text-label font-semibold text-muted" aria-live="polite">{t.count(visible.length)}</p>
      {#if clearableCount > 0}
        <Button variant="outline" size="sm" onclick={() => (clearOpen = true)}>{t.clear}</Button>
      {/if}
    </div>

    <div bind:this={listRoot} class="flex flex-col gap-5">
      {#if visible.length === 0}
        <EmptyState title={empty.title} body={empty.body} />
      {:else}
        {#if groups.main.length > 0}
          <section class="rounded-xl border border-line bg-card px-3 py-1">
            <TaskList
              items={groups.main}
              today={ctx.today}
              nowMin={ctx.nowMin}
              subjectNames={tasks.subjectNames}
              showDone={filter === 'done'}
              onedit={editTask}
              ontoggle={toggleTask}
            />
          </section>
        {/if}
        {#if groups.carriedOver.length > 0}
          <section aria-labelledby="carried-over-heading" class="flex flex-col gap-3">
            <h2 id="carried-over-heading" class="text-heading-md font-extrabold text-muted">
              {t.carriedOverHeading}
            </h2>
            <div class="rounded-xl border border-line bg-card px-3 py-1">
              <TaskList
                items={groups.carriedOver}
                today={ctx.today}
                nowMin={ctx.nowMin}
                subjectNames={tasks.subjectNames}
                onedit={editTask}
                ontoggle={toggleTask}
              />
            </div>
          </section>
        {/if}
      {/if}
    </div>
  {/if}
  <!-- Ruang setinggi FAB (60 px + jarak) agar baris terakhir bisa digulir ke atas FAB. -->
  <div class="h-[76px] shrink-0" aria-hidden="true"></div>
</div>

<div
  class="pointer-events-none fixed inset-x-0 bottom-[calc(104px+env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-lg justify-end px-5"
>
  <button
    type="button"
    class="pointer-events-auto flex size-[60px] items-center justify-center rounded-xl bg-brand text-on-brand shadow-fab hover:bg-brand-pressed"
    aria-label={t.add}
    onclick={addTask}
  >
    <Plus size={24} strokeWidth={2} aria-hidden="true" />
  </button>
</div>

<TaskSheet
  bind:open={sheetOpen}
  mode={sheetMode}
  today={today.current}
  subjects={schedule.subjects}
  subjectNames={tasks.subjectNames}
  ondelete={removeTask}
  onsettled={() => (sheetActive = false)}
/>

<ConfirmDialog
  bind:open={clearOpen}
  title={t.clearTitle(clearableCount)}
  body={t.clearBody}
  action={t.clearAction}
  onconfirm={clearDone}
/>

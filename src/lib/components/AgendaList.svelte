<script lang="ts">
  /**
   * Agenda Hari Ini (PRD §F2, rencana F2 §7, Usulan #5/#11/#17/#35–#39). Tenggat, timeline gabungan
   * (`agendaFor` di zona perangkat) dengan centang, lalu grup "Belum selesai sebelumnya" (tertutup).
   * Centang dikendalikan data store: tulis gagal → toast galat dan DOM dikembalikan ke nilai store.
   * Fokus yang bergantung pada data menunggu liveQuery lewat `$effect`, tanpa timer.
   */
  import Plus from '@lucide/svelte/icons/plus';
  import TaskList from '$lib/components/TaskList.svelte';
  import TaskSheet, { type TaskSheetMode } from '$lib/components/TaskSheet.svelte';
  import { copy } from '$lib/copy';
  import { setCompletion } from '$lib/data/repo/completions';
  import { logPrayer, removePrayerLog, restorePrayerLog } from '$lib/data/repo/prayerLogs';
  import { completeTask, deleteTask, reopenTask, restoreTask } from '$lib/data/repo/tasks';
  import {
    agendaFor,
    agendaPrayerStatuses,
    agendaWindow,
    dayTasks,
    isFaded,
    type AgendaSources
  } from '$lib/domain/agenda';
  import { toZoned } from '$lib/domain/dates';
  import { canLogPrayer, parsePrayerLogId, type PrayerConfig } from '$lib/domain/prayer';
  import type { AgendaItem, Id, LocalDate, PrayerName, PrayerStatus, Task } from '$lib/domain/types';
  import { formatClock } from '$lib/format';
  import { day } from '$lib/stores/day.svelte';
  import { now } from '$lib/stores/now.svelte';
  import { prayerLogs } from '$lib/stores/prayerLogs.svelte';
  import { schedule } from '$lib/stores/schedule.svelte';
  import { tasks } from '$lib/stores/tasks.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { today } from '$lib/stores/today.svelte';

  let { config }: { config: PrayerConfig | null } = $props();

  const t = copy.today.agenda;
  const names = copy.prayer.names;

  const date = $derived(today.current);
  const sources = $derived<AgendaSources>({
    routines: [...schedule.classRoutines, ...schedule.routines, ...schedule.events],
    subjects: schedule.subjects,
    tasks: tasks.all,
    // Completion tanggal lain (sisa sebelum tengah malam) tidak boleh mencentang item hari ini.
    completions: day.date === date ? day.completions : [],
    prayerLogs: prayerLogs.items,
    prayer: config,
    deviceTimeZone: now.timeZone,
    today: date
  });
  const items = $derived(agendaFor(date, sources, now.current));
  const nowMin = $derived(toZoned(now.current, now.timeZone).minutes);
  const win = $derived(agendaWindow(items, nowMin));
  const prayerStatuses = $derived(
    config
      ? agendaPrayerStatuses(items, prayerLogs.items, now.current, config)
      : new Map<string, PrayerStatus>()
  );
  const dt = $derived(dayTasks(date, tasks.all, date));

  /** Expand dan grup terbuka hanya untuk tanggal saat dibuka: otomatis tertutup saat hari berganti. */
  let expandedFor = $state<LocalDate | null>(null);
  let carriedOpenFor = $state<LocalDate | null>(null);
  const expanded = $derived(expandedFor === date);
  const carriedOpen = $derived(carriedOpenFor === date && dt.carriedOver.length > 0);
  const shown = $derived(expanded || !win.expandable ? items : win.visible);

  const nowIso = () => new Date().toISOString();
  const endClock = (end: number) => (end === 1440 ? '24.00' : formatClock(end));
  const kindOf = (item: AgendaItem) => (item.source === 'habit' ? 'routine' : item.source);
  const timeOf = (item: AgendaItem) =>
    item.source === 'prayer' ? formatClock(item.start) : `${formatClock(item.start)}–${endClock(item.end)}`;
  const prayerOf = (item: AgendaItem) => parsePrayerLogId(item.sourceId);

  function titleOf(item: AgendaItem): string {
    return item.source === 'prayer' ? names[item.title as PrayerName] : item.title;
  }

  function checkLabel(item: AgendaItem): string {
    const done = item.status === 'done';
    if (item.source === 'prayer') return t.prayerCheck(titleOf(item), timeOf(item), done);
    return t.check(titleOf(item), t.kindTag[kindOf(item)].toLowerCase(), timeOf(item), done);
  }

  function metaOf(item: AgendaItem): string {
    if (item.source === 'prayer') return t.kindTag.prayer;
    return t.meta(t.kindTag[kindOf(item)], item.meta, endClock(item.end));
  }

  /** Sholat belum masuk dan belum dicatat: tidak bisa dicentang. */
  const prayerLocked = (item: AgendaItem) =>
    item.source === 'prayer' && item.status !== 'done' && prayerStatuses.get(item.sourceId) === 'upcoming';

  const tagClass: Record<ReturnType<typeof kindOf>, string> = {
    prayer: 'bg-brand-soft text-brand-ink',
    class: 'bg-class-soft text-class',
    task: 'bg-teal-soft text-teal',
    routine: 'bg-sunken text-muted',
    event: 'bg-sunken text-muted'
  };

  // ---------- Elemen + fokus ----------

  let root = $state<HTMLElement | null>(null);
  let heading = $state<HTMLHeadingElement | null>(null);
  let expandBtn = $state<HTMLButtonElement | null>(null);
  let carriedToggle = $state<HTMLButtonElement | null>(null);

  const itemCheck = (key: string) =>
    root?.querySelector<HTMLInputElement>(`li[data-key="${CSS.escape(key)}"] [data-part="check"]`) ?? null;
  const taskPart = (id: Id, part: 'edit' | 'check') =>
    root?.querySelector<HTMLElement>(`li[data-task-id="${CSS.escape(id)}"] [data-part="${part}"]`) ?? null;

  /** Baris TaskList yang tampil, urutan Tenggat lalu grup. */
  const taskRows = $derived([...dt.due, ...(carriedOpen ? dt.carriedOver : [])]);

  type PendingFocus = {
    /** Baris yang dicentang/dihapus; target diproses setelah baris ini hilang. null = Urungkan. */
    awaitGone: Id | null;
    target: Id | null;
    part: 'edit' | 'check';
    /** Cadangan setelah target: tombol grup (jika masih ada) lalu heading, atau langsung heading. */
    viaGroup: boolean;
  };
  let taskFocus = $state<PendingFocus | null>(null);

  function neighborIn(list: readonly Task[], id: Id): Id | null {
    const i = list.findIndex((x) => x.id === id);
    return list[i + 1]?.id ?? list[i - 1]?.id ?? null;
  }

  $effect(() => {
    const p = taskFocus;
    const rows = taskRows;
    // Selama sheet masih memerangkap fokus, tunggu sampai tertutup (onsettled).
    if (!p || sheetActive) return;
    if (p.awaitGone !== null && rows.some((x) => x.id === p.awaitGone)) return;

    let el: HTMLElement | null = p.target === null ? null : taskPart(p.target, p.part);
    if (!el) {
      // Urungkan: tunggu baris yang dipulihkan muncul.
      if (p.target !== null && p.awaitGone === null) return;
      // bind:this bisa basi saat grup baru saja dilepas dari DOM.
      el = (p.viaGroup && carriedToggle?.isConnected ? carriedToggle : null) ?? heading;
    }
    if (!el) return;
    el.focus();
    taskFocus = null;
  });

  /** Usulan #31: fokus ke checkbox sholat setelah Urungkan, saat liveQuery sudah memuat log yang dipulihkan. */
  let prayerFocus = $state<string | null>(null);

  $effect(() => {
    const key = prayerFocus;
    if (!key) return;
    const item = items.find((x) => x.key === key);
    if (!item) {
      prayerFocus = null;
      return;
    }
    if (item.status !== 'done') return;
    prayerFocus = null;
    const active = document.activeElement;
    const inToast = active instanceof HTMLElement && active.closest('[role="status"]') !== null;
    // Jangan mencuri fokus jika user sudah pindah ke elemen lain.
    if (active === null || active === document.body || inToast) itemCheck(key)?.focus();
  });

  function toggleExpand() {
    if (!expanded) {
      expandedFor = date;
      return;
    }
    const active = document.activeElement;
    const row = active instanceof HTMLElement ? active.closest<HTMLElement>('li[data-key]') : null;
    const hides = row !== null && !win.visible.some((x) => x.key === row.dataset.key);
    expandedFor = null;
    // Usulan #1: fokus di item yang ikut tersembunyi pindah ke tombol (tombol tetap ada).
    if (hides) expandBtn?.focus();
  }

  // ---------- Centang ----------

  /** Guard per key item selama tulis berjalan. */
  let pending = $state<string[]>([]);

  const begin = (key: string) => (pending = [...pending, key]);
  const end = (key: string) => (pending = pending.filter((k) => k !== key));

  function failed(err: unknown) {
    console.error('[AgendaList] centang gagal', err);
    toast.show({ message: copy.error.body });
  }

  async function toggleItem(item: AgendaItem, el: HTMLInputElement) {
    const checked = el.checked;
    const key = item.key;
    begin(key);
    try {
      if (item.source === 'prayer') {
        await togglePrayer(item, checked, el);
      } else if (item.source === 'task') {
        if (checked) await completeTask(item.sourceId, nowIso());
        else await reopenTask(item.sourceId, nowIso());
      } else {
        await setCompletion(item.sourceId, item.date, checked, nowIso());
      }
    } catch (err) {
      failed(err);
      // State Svelte tidak berubah, jadi `checked` tidak disetel ulang sendiri.
      el.checked = items.find((x) => x.key === key)?.status === 'done';
    } finally {
      end(key);
    }
  }

  async function togglePrayer(item: AgendaItem, checked: boolean, el: HTMLInputElement) {
    const id = prayerOf(item);
    if (!id) throw new Error(`ID catatan sholat tidak valid: ${item.sourceId}`);
    // Tanggal lokasi (sourceId), bukan tanggal perangkat.
    if (checked) {
      if (config && canLogPrayer(id.date, id.prayer, now.current, config)) {
        await logPrayer(id.date, id.prayer, nowIso());
      } else {
        el.checked = false;
      }
      return;
    }
    const snapshot = prayerLogs.items.find((l) => l.id === item.sourceId);
    await removePrayerLog(id.date, id.prayer);
    if (!snapshot) return;
    const key = item.key;
    toast.show({
      message: copy.today.chips.removed(names[id.prayer]),
      action: {
        label: copy.toast.undo,
        // Usulan #2: restore tanpa canLogPrayer. Galat tidak ditangkap: toast tetap untuk dicoba lagi.
        run: async () => {
          await restorePrayerLog(snapshot);
          prayerFocus = key;
        }
      }
    });
  }

  function setTaskCheck(id: Id, value: boolean) {
    const el = taskPart(id, 'check');
    if (el instanceof HTMLInputElement) el.checked = value;
  }

  /** Centang dari TaskList (Tenggat dan grup). TaskList tidak membawa elemen, jadi DOM dicari lewat id. */
  async function toggleTask(task: Task, checked: boolean) {
    const key = `task:${task.id}`;
    if (pending.includes(key)) {
      setTaskCheck(task.id, !checked);
      return;
    }
    if (checked && carriedOpen && dt.carriedOver.some((x) => x.id === task.id)) {
      // Usulan #38: baris hilang dari grup → berikutnya → sebelumnya → tombol grup → heading.
      taskFocus = {
        awaitGone: task.id,
        target: neighborIn(dt.carriedOver, task.id),
        part: 'check',
        viaGroup: true
      };
    }
    begin(key);
    try {
      if (checked) await completeTask(task.id, nowIso());
      else await reopenTask(task.id, nowIso());
    } catch (err) {
      taskFocus = null;
      failed(err);
      setTaskCheck(task.id, tasks.all.find((x) => x.id === task.id)?.status === 'done');
    } finally {
      end(key);
    }
  }

  // ---------- Sheet (Usulan #35) ----------

  let sheetOpen = $state(false);
  /** Sheet terbuka atau belum selesai menutup (perangkap fokus masih aktif). */
  let sheetActive = $state(false);
  let sheetMode = $state<TaskSheetMode>({ kind: 'add' });

  function openSheet(mode: TaskSheetMode) {
    sheetMode = mode;
    sheetActive = true;
    sheetOpen = true;
  }

  /** FAB (Usulan #8): mode tambah lewat instance yang sama; fokus kembali ke FAB saat sheet tertutup. */
  const addTask = () => openSheet({ kind: 'add' });
  const editTask = (task: Task) => openSheet({ kind: 'edit', task });

  async function removeTask(task: Task) {
    const neighbor = neighborIn(taskRows, task.id);
    const token = await deleteTask(task.id, nowIso());
    taskFocus = { awaitGone: task.id, target: neighbor, part: 'edit', viaGroup: false };
    toast.show({
      message: copy.tasks.deleted,
      action: {
        label: copy.toast.undo,
        run: async () => {
          const ok = await restoreTask(task.id, token, nowIso());
          if (ok) taskFocus = { awaitGone: null, target: task.id, part: 'edit', viaGroup: false };
          return ok;
        }
      }
    });
  }
</script>

{#if schedule.loaded && tasks.loaded}
  <section
    bind:this={root}
    aria-labelledby="agenda-heading"
    class="flex flex-col gap-4 rounded-xl border border-line bg-card p-5"
  >
    <div class="flex items-center justify-between gap-3">
      <h2
        bind:this={heading}
        id="agenda-heading"
        tabindex="-1"
        class="text-heading-md font-extrabold text-ink"
      >
        {t.heading}
      </h2>
      {#if win.expandable && items.length > 0}
        <button
          bind:this={expandBtn}
          type="button"
          aria-expanded={expanded}
          aria-controls="agenda-list"
          class="-mr-2 min-h-11 rounded-md px-2 text-label font-bold text-brand-ink hover:bg-sunken"
          onclick={toggleExpand}>{expanded ? t.showLess : t.showAll}</button
        >
      {/if}
    </div>

    {#if dt.due.length > 0}
      <div role="group" aria-labelledby="agenda-due-heading" class="flex flex-col gap-1">
        <h3 id="agenda-due-heading" class="text-label font-extrabold text-ink">{t.dueHeading}</h3>
        <TaskList
          items={dt.due}
          today={date}
          {nowMin}
          subjectNames={tasks.subjectNames}
          onedit={editTask}
          ontoggle={toggleTask}
        />
      </div>
    {/if}

    {#if items.length === 0}
      <p class="text-body text-muted">{t.empty}</p>
    {:else}
      <ol id="agenda-list" class="flex flex-col">
        {#each shown as item (item.key)}
          {@const faded = isFaded(item, prayerStatuses)}
          {@const done = item.status === 'done'}
          {@const live = item.status === 'now' || item.status === 'next'}
          {@const kind = kindOf(item)}
          <li
            data-key={item.key}
            data-source={item.source}
            data-status={item.status}
            data-faded={faded || undefined}
            class="flex gap-3"
          >
            <span class="w-11 shrink-0 pt-4 text-label font-bold text-muted tabular-nums"
              >{formatClock(item.start)}</span
            >
            <span aria-hidden="true" class="flex w-3 shrink-0 flex-col items-center">
              <span class="h-4 w-0.5 bg-line"></span>
              <span
                class={[
                  'size-2.5 rounded-full border-2',
                  faded
                    ? 'border-disabled bg-disabled opacity-70'
                    : live
                      ? 'border-brand bg-brand'
                      : 'border-muted bg-card'
                ]}
              ></span>
              <span class="w-0.5 flex-1 bg-line"></span>
            </span>
            <div
              class={[
                'my-1 flex min-w-0 flex-1 items-start gap-1 rounded-lg border-[1.5px] py-1 pr-3',
                live && !faded ? 'border-brand bg-card' : 'border-line',
                faded ? 'bg-transparent' : 'bg-card'
              ]}
            >
              <label class="flex size-11 shrink-0 cursor-pointer items-center justify-center">
                <input
                  type="checkbox"
                  data-part="check"
                  class="size-5 accent-brand"
                  checked={done}
                  disabled={prayerLocked(item)}
                  aria-label={checkLabel(item)}
                  onclick={(e) => {
                    if (pending.includes(item.key)) e.preventDefault();
                  }}
                  onchange={(e) => toggleItem(item, e.currentTarget)}
                />
              </label>
              <div class="flex min-w-0 flex-1 flex-col gap-1 py-2">
                <div class="flex items-start justify-between gap-2">
                  <span
                    data-part="title"
                    class={[
                      'min-w-0 text-body font-bold break-words',
                      faded ? 'text-muted' : 'text-ink',
                      done && item.source !== 'prayer' && 'line-through'
                    ]}>{titleOf(item)}</span
                  >
                  <span
                    data-part="tag"
                    class={[
                      'shrink-0 rounded-sm px-2 py-0.5 text-caption font-extrabold tracking-[0.03em] uppercase',
                      tagClass[kind]
                    ]}>{t.kindTag[kind]}</span
                  >
                </div>
                <span data-part="meta" class="text-caption font-semibold text-muted">{metaOf(item)}</span>
                {#if item.status === 'now' || item.status === 'next' || item.overlapsPrayer || item.conflict}
                  <span class="flex flex-wrap gap-1.5 text-caption font-bold">
                    {#if item.status === 'now'}
                      <span class="rounded-full bg-brand px-2.5 py-0.5 text-on-brand">{t.now}</span>
                    {:else if item.status === 'next'}
                      {@const next = t.next(item.start - nowMin)}
                      <span class="rounded-full bg-brand px-2.5 py-0.5 text-on-brand"
                        ><span aria-hidden="true">{next.visual}</span><span class="sr-only"
                          >{next.spoken}</span
                        ></span
                      >
                    {/if}
                    {#if item.overlapsPrayer}
                      <span class="rounded-full border border-line px-2.5 py-0.5 text-ink"
                        >{t.overlapsPrayer(names[item.overlapsPrayer])}</span
                      >
                    {/if}
                    {#if item.conflict}
                      <span class="rounded-full border border-line px-2.5 py-0.5 text-ink">{t.conflict}</span>
                    {/if}
                  </span>
                {/if}
              </div>
            </div>
          </li>
        {/each}
      </ol>
    {/if}

    {#if dt.carriedOver.length > 0}
      <div class="flex flex-col gap-1">
        <button
          bind:this={carriedToggle}
          id="agenda-carried-toggle"
          type="button"
          aria-expanded={carriedOpen}
          aria-controls="agenda-carried-panel"
          class="-mx-2 flex min-h-11 items-center rounded-md px-2 text-left text-label font-extrabold text-muted hover:bg-sunken"
          onclick={() => (carriedOpenFor = carriedOpen ? null : date)}
          >{t.carriedOver(dt.carriedOver.length)}</button
        >
        {#if carriedOpen}
          <div id="agenda-carried-panel" role="group" aria-labelledby="agenda-carried-toggle">
            <TaskList
              items={dt.carriedOver}
              today={date}
              {nowMin}
              subjectNames={tasks.subjectNames}
              onedit={editTask}
              ontoggle={toggleTask}
            />
          </div>
        {/if}
      </div>
    {/if}
  </section>

  <!-- Ruang setinggi FAB (60 px + jarak) agar baris terakhir bisa digulir ke atas FAB. -->
  <div class="h-[76px] shrink-0" aria-hidden="true"></div>

  <div
    class="pointer-events-none fixed inset-x-0 bottom-[calc(104px+env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-lg justify-end px-5"
  >
    <button
      type="button"
      class="pointer-events-auto flex size-[60px] items-center justify-center rounded-xl bg-brand text-on-brand shadow-fab hover:bg-brand-pressed"
      aria-label={copy.tasks.add}
      onclick={addTask}
    >
      <Plus size={24} strokeWidth={2} aria-hidden="true" />
    </button>
  </div>

  <TaskSheet
    bind:open={sheetOpen}
    mode={sheetMode}
    today={date}
    subjects={schedule.subjects}
    subjectNames={tasks.subjectNames}
    ondelete={removeTask}
    onsettled={() => (sheetActive = false)}
  />
{/if}

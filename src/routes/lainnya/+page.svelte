<script lang="ts">
  import EmptyState from '$lib/components/EmptyState.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { copy } from '$lib/copy';
  import { updateSettings } from '$lib/data/repo/settings';
  import { settings } from '$lib/stores/settings.svelte';

  const t = copy.pages.more;
  const s = copy.moreSettings;

  // Bagian minimal dari Pengaturan (F8.5) agar kolom Minggu di timetable F4 bisa diaktifkan.
  // Pindah ke /lainnya/pengaturan saat F8 dikerjakan.
  async function toggleSunday(event: Event) {
    await updateSettings({ showSundayInTimetable: (event.currentTarget as HTMLInputElement).checked });
  }
</script>

<svelte:head><title>{t.title} · {copy.appName}</title></svelte:head>

<PageHeader title={t.title} />
<div class="flex flex-col gap-5">
  {#if settings.current}
    <section
      aria-labelledby="schedule-settings-heading"
      class="flex flex-col gap-3 rounded-xl border border-line bg-card p-5"
    >
      <h2 id="schedule-settings-heading" class="text-heading-md font-extrabold text-ink">
        {s.scheduleHeading}
      </h2>
      <label class="flex min-h-12 items-center justify-between gap-4 rounded-md border border-line px-4 py-2">
        <span class="flex flex-col">
          <span class="text-body font-bold text-ink">{s.showSunday}</span>
          <span class="text-caption font-semibold text-muted">{s.showSundayHint}</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={settings.current.showSundayInTimetable}
          onchange={toggleSunday}
          class="size-6 shrink-0 accent-brand"
        />
      </label>
    </section>
  {/if}
  <EmptyState title={t.emptyTitle} body={t.emptyBody} />
</div>

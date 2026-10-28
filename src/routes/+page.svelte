<script lang="ts">
  /**
   * Hari Ini (PRD §F2), mengikuti docs/design/mockups/hari-ini.mockup.html. Sapaan memakai jam perangkat;
   * kartu langit di zona lokasi; tanggal dari store `today`. Badge streak dan tombol profil tidak dibangun.
   */
  import AgendaList from '$lib/components/AgendaList.svelte';
  import CityPicker from '$lib/components/CityPicker.svelte';
  import PrayerChips from '$lib/components/PrayerChips.svelte';
  import PrioritiesCard from '$lib/components/PrioritiesCard.svelte';
  import SkyCard from '$lib/components/SkyCard.svelte';
  import ZoneBanner from '$lib/components/ZoneBanner.svelte';
  import { copy } from '$lib/copy';
  import { setLocation } from '$lib/data/repo/settings';
  import { toZoned } from '$lib/domain/dates';
  import { greetingFor } from '$lib/domain/day';
  import { toHijri } from '$lib/domain/hijri';
  import { toPrayerConfig } from '$lib/domain/prayer';
  import type { Location } from '$lib/domain/types';
  import { formatFullDate } from '$lib/format';
  import { day } from '$lib/stores/day.svelte';
  import { now } from '$lib/stores/now.svelte';
  import { settings } from '$lib/stores/settings.svelte';
  import { today } from '$lib/stores/today.svelte';

  let pickerOpen = $state(false);
  /** Kartu prioritas dirender setelah load pertama store `day` dan tetap terpasang saat tanggal berganti. */
  let dayReady = $state(false);
  $effect(() => {
    if (day.loaded) dayReady = true;
  });

  const date = $derived(today.current);
  const config = $derived(settings.current ? toPrayerConfig(settings.current) : null);
  const hijri = $derived(toHijri(date, settings.current?.hijriOffsetDays ?? 0));
  const greeting = $derived(copy.today.greeting[greetingFor(toZoned(now.current, now.timeZone).minutes)]);

  function selectLocation(location: Location) {
    void setLocation(location);
  }
</script>

<svelte:head><title>{copy.pages.today.title} · {copy.appName}</title></svelte:head>

<div class="flex flex-col gap-5 pt-6">
  <header class="flex flex-col gap-3">
    <div class="flex flex-col gap-0.5 text-label text-muted">
      <p class="font-semibold">{formatFullDate(date)}</p>
      <p class="font-medium">{hijri.label}</p>
    </div>
    <h1 class="text-heading-xl font-extrabold tracking-[-0.02em] text-ink">
      {copy.today.heading(greeting, settings.current?.userName ?? '')}
    </h1>
  </header>

  {#if config}
    <ZoneBanner location={config.location} onupdate={() => (pickerOpen = true)} />
  {/if}

  <SkyCard {config} onpicklocation={() => (pickerOpen = true)} />

  {#if config}
    <PrayerChips {config} />
  {/if}

  {#if dayReady}
    <PrioritiesCard />
    <AgendaList {config} />
  {/if}
</div>

<CityPicker bind:open={pickerOpen} onselect={selectLocation} />

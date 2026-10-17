<script lang="ts">
  /**
   * Pemilih lokasi (bottom sheet): cari kota/kabupaten atau "Pakai lokasi saya".
   * Dipakai ulang di F1 (onboarding) dan F8 (pengaturan). Komponen ini tidak menyimpan apa pun;
   * pemanggil menerima Location lewat `onselect` (koordinat GPS sudah dibulatkan, lihat locationFromGps).
   * Izin lokasi hanya diminta saat tombol diketuk, tidak pernah otomatis (PRD §7.10).
   */
  import LocateFixed from '@lucide/svelte/icons/locate-fixed';
  import { Button } from '$lib/components/ui/button';
  import * as Sheet from '$lib/components/ui/sheet';
  import { copy } from '$lib/copy';
  import { locationFromCity, locationFromGps } from '$lib/domain/geo';
  import type { City, Location } from '$lib/domain/types';

  let {
    open = $bindable(false),
    onselect
  }: {
    open?: boolean;
    onselect: (location: Location) => void;
  } = $props();

  const t = copy.location;
  const MAX_RESULTS = 50;

  let cities = $state<readonly City[] | null>(null);
  let capitalIds = $state<readonly string[]>([]);
  let loadError = $state(false);
  let query = $state('');
  let gpsState = $state<'idle' | 'locating' | 'denied' | 'unavailable'>('idle');

  // Daftar kota (~95 KB) dimuat saat sheet pertama kali dibuka; potongan file ini ikut di-precache SW.
  $effect(() => {
    if (!open || cities) return;
    import('$lib/data/cities')
      .then((m) => {
        cities = m.CITIES;
        capitalIds = m.PROVINCE_CAPITAL_IDS;
      })
      .catch(() => (loadError = true));
  });

  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/^kab\.\s*/, '')
      .trim();

  const results = $derived.by(() => {
    if (!cities) return [];
    const q = normalize(query);
    if (!q) {
      const ids = new Set(capitalIds);
      return cities.filter((c) => ids.has(c.id)).toSorted((a, b) => a.name.localeCompare(b.name, 'id'));
    }
    const scored: { city: City; score: number }[] = [];
    for (const city of cities) {
      const name = normalize(city.name);
      const score = name.startsWith(q)
        ? 0
        : name.includes(q)
          ? 1
          : normalize(city.province).includes(q)
            ? 2
            : -1;
      if (score >= 0) scored.push({ city, score });
    }
    return scored
      .sort((a, b) => a.score - b.score || a.city.name.localeCompare(b.city.name, 'id'))
      .slice(0, MAX_RESULTS)
      .map((s) => s.city);
  });

  function choose(location: Location) {
    onselect(location);
    open = false;
    query = '';
    gpsState = 'idle';
  }

  function useMyLocation() {
    if (!('geolocation' in navigator) || !cities) {
      gpsState = 'unavailable';
      return;
    }
    const list = cities;
    gpsState = 'locating';
    navigator.geolocation.getCurrentPosition(
      (pos) => choose(locationFromGps(pos.coords.latitude, pos.coords.longitude, list)),
      (err) => (gpsState = err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 10 * 60_000 }
    );
  }
</script>

<Sheet.Root bind:open>
  <Sheet.Content>
    <Sheet.Header>
      <Sheet.Title>{t.pickTitle}</Sheet.Title>
      <Sheet.Description>{t.pickDescription}</Sheet.Description>
    </Sheet.Header>

    <Button variant="outline" onclick={useMyLocation} disabled={!cities || gpsState === 'locating'}>
      <LocateFixed aria-hidden="true" />
      {gpsState === 'locating' ? t.locating : t.useMyLocation}
    </Button>
    <p class="text-label font-semibold text-muted empty:hidden" role="status" aria-live="polite">
      {#if gpsState === 'denied'}{t.gpsDenied}{:else if gpsState === 'unavailable'}{t.gpsUnavailable}{/if}
    </p>

    <input
      type="search"
      bind:value={query}
      aria-label={t.searchLabel}
      placeholder={t.searchLabel}
      autocomplete="off"
      class="min-h-11 w-full rounded-md border border-line bg-ground px-4 text-field text-ink placeholder:text-muted"
    />

    {#if loadError}
      <p class="text-body text-muted" role="status">{t.loadFailed}</p>
    {:else if !cities}
      <p class="text-body text-muted" role="status">{t.loadingCities}</p>
    {:else}
      <section aria-labelledby="city-results-heading" class="flex flex-col">
        <h3 id="city-results-heading" class="text-caption font-bold tracking-[0.04em] text-muted uppercase">
          {query.trim() ? t.resultsHeading : t.capitalsHeading}
        </h3>
        {#if results.length === 0}
          <p class="py-3 text-body text-muted" role="status">{t.noResults}</p>
        {:else}
          <ul class="mt-1 flex flex-col">
            {#each results as city (city.id)}
              <li class="border-b border-line last:border-b-0">
                <button
                  type="button"
                  class="flex min-h-12 w-full flex-col items-start justify-center rounded-md px-1 py-2 text-left hover:bg-sunken"
                  onclick={() => choose(locationFromCity(city))}
                >
                  <span class="text-body font-bold text-ink">{city.name}</span>
                  <span class="text-caption font-semibold text-muted">{city.province}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}
  </Sheet.Content>
</Sheet.Root>

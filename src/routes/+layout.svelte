<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import UndoToast from '$lib/components/UndoToast.svelte';
  import UpdateToast from '$lib/components/UpdateToast.svelte';
  import { copy } from '$lib/copy';
  import { day } from '$lib/stores/day.svelte';
  import { now } from '$lib/stores/now.svelte';
  import { prayerLogs } from '$lib/stores/prayerLogs.svelte';
  import { schedule } from '$lib/stores/schedule.svelte';
  import { settings } from '$lib/stores/settings.svelte';
  import { tasks } from '$lib/stores/tasks.svelte';
  import { theme } from '$lib/stores/theme.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { today } from '$lib/stores/today.svelte';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();

  onMount(() => {
    const stops = [
      today.start(),
      now.start(),
      settings.start(),
      prayerLogs.start(),
      day.start(),
      schedule.start(),
      tasks.start(),
      theme.start()
    ];
    return () => stops.forEach((stop) => stop());
  });

  const onOnboarding = $derived(page.url.pathname === '/onboarding');
  /** undefined = Settings belum terbaca. */
  const onboarded = $derived(settings.current ? settings.current.onboardedAt !== null : undefined);
  /** Halaman hanya dirender setelah guard memutuskan, agar tidak berkedip sebelum redirect. */
  const allowed = $derived(onboarded !== undefined && onboarded !== onOnboarding);

  // Guard onboarding (PRD §F1.5): belum onboarding → /onboarding; sudah → keluar dari /onboarding.
  $effect(() => {
    if (onboarded === undefined) return;
    if (!onboarded && !onOnboarding) goto(resolve('/onboarding'), { replaceState: true });
    else if (onboarded && onOnboarding) goto(resolve('/'), { replaceState: true });
  });
</script>

{#if allowed}
  <div
    class={[
      'mx-auto min-h-dvh max-w-lg px-5',
      !onOnboarding &&
        (toast.current
          ? 'pb-[calc(248px+env(safe-area-inset-bottom))]'
          : 'pb-[calc(104px+env(safe-area-inset-bottom))]')
    ]}
  >
    {@render children()}
  </div>
{:else}
  <p class="sr-only" role="status">{copy.loading}</p>
{/if}

<!-- Urutan DOM = urutan Tab: toast sebelum nav agar Urungkan dekat dengan halaman (Usulan F6 #7).
     Posisi visual tetap (fixed). Toast di luar guard agar UpdateToast tetap muncul saat memuat. -->
<UndoToast aboveNav={!onOnboarding} />
<UpdateToast aboveNav={!onOnboarding} />
{#if allowed && !onOnboarding}
  <BottomNav />
{/if}

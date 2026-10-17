<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { copy } from '$lib/copy';
  import { completeOnboarding } from '$lib/data/repo/settings';

  const t = copy.onboarding;
  let busy = $state(false);

  // Placeholder Fase 0. Alur 3 langkah dibangun di F1.
  async function start() {
    busy = true;
    try {
      // PRD §F1.4: minta penyimpanan persisten agar browser tidak menghapus data.
      await navigator.storage?.persist?.();
    } catch {
      // Tidak wajib; lanjutkan.
    }
    // Root layout mengarahkan ke / begitu Settings berubah.
    await completeOnboarding(new Date().toISOString());
  }
</script>

<svelte:head><title>{t.title} · {copy.appName}</title></svelte:head>

<main class="flex min-h-dvh flex-col justify-center gap-8 py-10">
  <div>
    <p class="text-label font-bold tracking-[0.04em] text-brand-ink uppercase">{copy.appName}</p>
    <h1 class="mt-2 text-heading-xl font-extrabold tracking-[-0.02em] text-ink">{t.title}</h1>
    <p class="mt-3 text-body text-muted">{t.body}</p>
  </div>
  <Button size="lg" class="w-full" onclick={start} disabled={busy}>{t.start}</Button>
</main>

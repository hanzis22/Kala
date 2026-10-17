<script lang="ts">
  import { onMount } from 'svelte';
  import { dev } from '$app/env';
  import X from '@lucide/svelte/icons/x';
  import { Button } from '$lib/components/ui/button';
  import { copy } from '$lib/copy';

  let { aboveNav = true }: { aboveNav?: boolean } = $props();

  /** SW baru yang sudah terpasang dan menunggu diaktifkan. */
  let waiting = $state<ServiceWorker | null>(null);
  let dismissed = $state(false);

  onMount(() => {
    // Di dev SW tidak didaftarkan agar cache tidak mengganggu HMR.
    if (dev || !('serviceWorker' in navigator)) return;
    const sw = navigator.serviceWorker;

    const onWaiting = (worker: ServiceWorker) => {
      // Tanpa controller = kunjungan pertama; SW langsung aktif, tidak perlu toast.
      if (sw.controller) {
        waiting = worker;
        dismissed = false;
      }
    };

    let registration: ServiceWorkerRegistration | undefined;
    const checkForUpdate = () => {
      if (document.visibilityState === 'visible') void registration?.update().catch(() => {});
    };

    sw.register('/service-worker.js')
      .then((reg) => {
        registration = reg;
        if (reg.waiting) onWaiting(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          installing?.addEventListener('statechange', () => {
            if (installing.state === 'installed') onWaiting(installing);
          });
        });
      })
      .catch((err: unknown) => console.error('[sw] gagal mendaftar', err));

    document.addEventListener('visibilitychange', checkForUpdate);
    return () => document.removeEventListener('visibilitychange', checkForUpdate);
  });

  function reload() {
    if (!waiting) return;
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), {
      once: true
    });
    waiting.postMessage('SKIP_WAITING');
  }
</script>

{#if waiting && !dismissed}
  <div
    role="status"
    class={[
      'fixed inset-x-4 z-30 mx-auto flex max-w-md items-center gap-2 rounded-lg border border-line bg-card py-2 pr-2 pl-4',
      aboveNav ? 'bottom-[calc(96px+env(safe-area-inset-bottom))]' : 'bottom-4'
    ]}
  >
    <p class="flex-1 text-label font-bold text-ink">{copy.update.message}</p>
    <Button size="sm" onclick={reload}>{copy.update.reload}</Button>
    <Button variant="ghost" size="icon" aria-label={copy.update.dismiss} onclick={() => (dismissed = true)}>
      <X aria-hidden="true" />
    </Button>
  </div>
{/if}

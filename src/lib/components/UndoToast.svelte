<script lang="ts">
  import { tick } from 'svelte';
  import { fly } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';
  import X from '@lucide/svelte/icons/x';
  import { Button } from '$lib/components/ui/button';
  import { copy } from '$lib/copy';
  import { toast } from '$lib/stores/toast.svelte';

  let { aboveNav = true }: { aboveNav?: boolean } = $props();

  /** Elemen yang fokus sebelum user masuk ke toast; fokus dikembalikan ke sini saat ditutup. */
  let returnFocus: HTMLElement | null = null;
  let box = $state<HTMLElement>();

  function onfocusin(event: FocusEvent) {
    if (!box) return;
    const from = event.relatedTarget;
    if (from instanceof HTMLElement && !box.contains(from)) returnFocus = from;
  }

  function close() {
    const target = returnFocus;
    returnFocus = null;
    toast.dismiss();
    if (target?.isConnected) target.focus();
  }

  /** Escape hanya saat fokus di dalam toast, agar tidak bentrok dengan Escape milik sheet/dialog. */
  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && box?.contains(document.activeElement)) {
      event.preventDefault();
      close();
    }
  }

  function runAction() {
    // Fokus setelah aksi (misal ke baris yang dipulihkan) diatur oleh pemanggil.
    returnFocus = null;
    void toast.runAction();
  }

  /**
   * Toast berganti (Usulan F2 nomor 22b). Dicek sebelum DOM diperbarui, selagi box lama masih terpasang:
   * fokus di luar toast → asal fokus lama tidak berlaku lagi (reset); fokus di dalam → asal fokus dibawa
   * ke toast baru dan fokus pindah ke tombol aksinya (cadangan ✕), agar tidak jatuh ke body.
   */
  let shownId: number | null = null;
  $effect.pre(() => {
    const id = toast.current?.id ?? null;
    if (id === shownId) return;
    shownId = id;
    const wasInside = box?.contains(document.activeElement) ?? false;
    if (id === null) return;
    if (!wasInside) {
      returnFocus = null;
      return;
    }
    void tick().then(() => box?.querySelector('button')?.focus());
  });

  // Digantikan toast lain: keluar tanpa animasi agar live region tidak memuat dua pesan.
  const inParams = $derived({ y: 8, duration: prefersReducedMotion.current ? 0 : 150 });
  const outParams = $derived({
    y: 8,
    duration: prefersReducedMotion.current || toast.current !== null ? 0 : 150
  });
</script>

<svelte:window {onkeydown} />

<!-- Region live dirender kosong sejak awal agar isi barunya dibacakan. Fokus tidak dipindah ke sini. -->
<div role="status" aria-live="polite" aria-atomic="true">
  {#if toast.current}
    {#key toast.current.id}
      <div
        bind:this={box}
        class={[
          'fixed inset-x-4 z-30 mx-auto flex max-w-md items-center gap-2 rounded-lg border border-line bg-card py-2 pr-2 pl-4 text-ink',
          aboveNav ? 'bottom-[calc(176px+env(safe-area-inset-bottom))]' : 'bottom-4'
        ]}
        {onfocusin}
        in:fly={inParams}
        out:fly={outParams}
      >
        <p class="flex-1 text-label font-bold text-ink">{toast.current.message}</p>
        {#if toast.current.action}
          <Button variant="ghost" size="sm" class="text-brand-ink" onclick={runAction}>
            {toast.current.action.label}
          </Button>
        {/if}
        <Button variant="ghost" size="icon" aria-label={copy.toast.close} onclick={close}>
          <X aria-hidden="true" />
        </Button>
      </div>
    {/key}
  {/if}
</div>

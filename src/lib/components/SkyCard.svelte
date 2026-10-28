<script lang="ts">
  /**
   * Kartu langit Hari Ini (PRD §F2.2, rencana F2 §4), mengikuti hari-ini.mockup.html. Semua jam di zona
   * lokasi (sama dengan Ibadah). Tanpa lokasi = kartu ajakan memilih lokasi. Basmalah mockup tidak
   * dibangun (Usulan #9). Hitung mundur berubah tiap menit, jadi sengaja bukan live region.
   */
  import { tick } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { copy } from '$lib/copy';
  import { logPrayer } from '$lib/data/repo/prayerLogs';
  import { canLogPrayer, type PrayerConfig } from '$lib/domain/prayer';
  import { arcPoint, skyCard } from '$lib/domain/sky';
  import { PRAYERS, type LocalDate, type PrayerName } from '$lib/domain/types';
  import { formatClock } from '$lib/format';
  import { now } from '$lib/stores/now.svelte';
  import { prayerLogs } from '$lib/stores/prayerLogs.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  let {
    config,
    onpicklocation
  }: {
    config: PrayerConfig | null;
    onpicklocation: () => void;
  } = $props();

  const t = copy.today.sky;
  const names = copy.prayer.names;

  const card = $derived(config ? skyCard(now.current, config, prayerLogs.items) : null);
  const marker = $derived(card ? arcPoint(card.arc.marker) : null);

  let headingEl = $state<HTMLElement | null>(null);
  let ctaEl = $state<HTMLElement | null>(null);
  let pending = $state(false);
  /** Usulan #25: fokus pindah ke judul kartu setelah CTA berhasil, tapi baru saat kartu sudah keluar dari mode CTA. */
  let focusAfterLog = $state<{ prayer: PrayerName; date: LocalDate } | null>(null);
  let focusFrom: HTMLElement | null = null;

  $effect(() => {
    const target = focusAfterLog;
    if (!target || !card) return;
    if (card.mode === 'cta') {
      // Sholat aktif berganti tanpa melewati hitung mundur: batalkan tanpa memindah fokus.
      if (card.active && (card.active.prayer !== target.prayer || card.active.date !== target.date)) {
        focusAfterLog = null;
      }
      return;
    }
    focusAfterLog = null;
    const from = focusFrom;
    focusFrom = null;
    void tick().then(() => {
      const active = document.activeElement;
      // Jangan mencuri fokus jika user sudah pindah ke elemen lain.
      if (active === null || active === document.body || (active === from && from?.isConnected)) {
        headingEl?.focus();
      }
    });
  });

  async function markActive() {
    if (pending || !config || !card?.active || card.mode !== 'cta') return;
    const { prayer, date } = card.active;
    if (!canLogPrayer(date, prayer, now.current, config)) return;
    const wasFocused = ctaEl !== null && document.activeElement === ctaEl;
    pending = true;
    try {
      await logPrayer(date, prayer, new Date().toISOString());
      if (wasFocused) {
        focusFrom = ctaEl;
        focusAfterLog = { prayer, date };
      }
    } catch (err) {
      console.error('[SkyCard] gagal mencatat sholat', err);
      toast.show({ message: copy.error.body });
    } finally {
      pending = false;
    }
  }
</script>

{#if !config || !card || !marker}
  <section class="flex flex-col gap-4 rounded-xl border border-line bg-card p-5">
    <div class="flex flex-col gap-1">
      <h2 class="text-heading-md font-extrabold text-ink">{copy.worship.noLocationTitle}</h2>
      <p class="text-body text-muted">{copy.worship.noLocationBody}</p>
    </div>
    <Button onclick={onpicklocation}>{copy.worship.noLocationAction}</Button>
  </section>
{:else}
  {@const next = card.next}
  {@const nextAt = t.at(names[next.prayer], formatClock(next.time), next.tomorrow)}
  <section
    aria-labelledby="sky-heading"
    data-tone={card.tone}
    data-mode={card.mode}
    class={[
      'flex flex-col gap-3.5 rounded-2xl p-5 text-sky-ink',
      card.tone === 'fajar' ? 'bg-sky-fajar' : 'bg-sky-senja'
    ]}
  >
    <h2
      id="sky-heading"
      bind:this={headingEl}
      tabindex="-1"
      class="text-label font-bold tracking-[0.04em] text-sky-muted uppercase"
    >
      {card.mode === 'cta' && card.active
        ? t.active(names[card.active.prayer])
        : t.toward(names[next.prayer])}
    </h2>

    <div class="flex flex-col gap-1">
      {#if card.mode === 'cta'}
        {@const sub = t.sub(nextAt, next.minutesUntil)}
        <p class="text-display font-extrabold tracking-[-0.03em]">{t.entered}</p>
        <p class="text-body font-semibold text-sky-muted">
          <span aria-hidden="true">{sub.visual}</span><span class="sr-only">{sub.spoken}</span>
        </p>
      {:else}
        {@const countdown = t.countdown(next.minutesUntil)}
        <p class="text-display font-extrabold tracking-[-0.03em] tabular-nums">
          <span aria-hidden="true">{countdown.visual}</span><span class="sr-only">{countdown.spoken}</span>
        </p>
        <p class="text-body font-semibold text-sky-muted">{nextAt}</p>
      {/if}
    </div>

    <svg viewBox="0 0 350 92" aria-hidden="true" class="block h-auto w-full">
      <path
        d="M 8 86 Q 175 -14 342 86"
        fill="none"
        class="stroke-sky-muted opacity-50"
        stroke-width="2"
        stroke-dasharray="3 6"
        stroke-linecap="round"
      ></path>
      <line x1="0" y1="86" x2="350" y2="86" class="stroke-sky-line" stroke-width="1.5"></line>
      {#each PRAYERS as p (p)}
        {@const dot = arcPoint(card.arc.dots[p])}
        <circle
          cx={dot.x}
          cy={dot.y}
          r="4"
          class={['stroke-sky-muted', card.tone === 'fajar' ? 'fill-sky-fajar' : 'fill-sky-senja']}
          stroke-width="2"
        ></circle>
      {/each}
      <circle cx={marker.x} cy={marker.y} r="15" class="fill-sun opacity-20"></circle>
      <circle cx={marker.x} cy={marker.y} r="9" class="fill-sun"></circle>
      {#if card.body === 'moon'}
        <circle cx={marker.x + 5} cy={marker.y - 4} r="8" class="fill-sky-surface"></circle>
      {/if}
    </svg>

    <div class="flex flex-wrap justify-between gap-x-3 gap-y-1 text-caption font-semibold text-sky-muted">
      <span>{t.footerLocation(config.location.label)}</span>
      <span class="tabular-nums">{t.nowAt(formatClock(card.nowMinutes))}</span>
    </div>

    {#if card.mode === 'cta' && card.active}
      <Button
        bind:ref={ctaEl}
        size="lg"
        class="w-full"
        aria-disabled={pending || undefined}
        onclick={markActive}
      >
        {t.cta(names[card.active.prayer])}
      </Button>
    {/if}
  </section>
{/if}

<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { copy } from '$lib/copy';

  const t = $derived(page.status === 404 ? copy.notFound : copy.error);
</script>

<svelte:head><title>{t.title} · {copy.appName}</title></svelte:head>

<PageHeader title={t.title} />
<section class="rounded-xl border border-line bg-card p-5">
  <p class="text-body text-muted">{t.body}</p>
</section>
<Button href={resolve('/')} class="mt-5 w-full">{copy.notFound.back}</Button>

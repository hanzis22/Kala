<script lang="ts">
  import EmptyState from '$lib/components/EmptyState.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import { copy } from '$lib/copy';

  const t = copy.pages.worship;
</script>

<svelte:head><title>{t.title} · {copy.appName}</title></svelte:head>

<PageHeader title={t.title} />
<EmptyState title={t.emptyTitle} body={t.emptyBody} />

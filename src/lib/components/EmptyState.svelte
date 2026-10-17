<script lang="ts">
  let { title, body }: { title: string; body: string } = $props();
</script>

<section class="rounded-xl border border-line bg-card p-5">
  <h2 class="text-heading-md font-extrabold text-ink">{title}</h2>
  <p class="mt-1 text-body text-muted">{body}</p>
</section>

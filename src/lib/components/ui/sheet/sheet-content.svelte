<script lang="ts">
  import { Dialog as SheetPrimitive } from 'bits-ui';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '$lib/components/ui/button/index.js';
  import { copy } from '$lib/copy';
  import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
  import SheetOverlay from './sheet-overlay.svelte';
  import SheetPortal from './sheet-portal.svelte';
  import type { ComponentProps, Snippet } from 'svelte';

  // Disesuaikan ke Senja: hanya bottom sheet (PRD §3), kartu bg-card + line, tanpa bayangan.
  let {
    ref = $bindable(null),
    class: className,
    showCloseButton = true,
    portalProps,
    children,
    ...restProps
  }: WithoutChildrenOrChild<SheetPrimitive.ContentProps> & {
    portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SheetPortal>>;
    showCloseButton?: boolean;
    children: Snippet;
  } = $props();
</script>

<SheetPortal {...portalProps}>
  <SheetOverlay />
  <SheetPrimitive.Content
    bind:ref
    data-slot="sheet-content"
    class={cn(
      'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-2xl border-t border-line bg-card p-5 pb-[calc(20px+env(safe-area-inset-bottom))] text-ink',
      className
    )}
    {...restProps}
  >
    {@render children?.()}
    {#if showCloseButton}
      <SheetPrimitive.Close data-slot="sheet-close">
        {#snippet child({ props })}
          <Button
            variant="ghost"
            size="icon"
            class="absolute top-3 right-3"
            aria-label={copy.common.close}
            {...props}
          >
            <XIcon aria-hidden="true" />
          </Button>
        {/snippet}
      </SheetPrimitive.Close>
    {/if}
  </SheetPrimitive.Content>
</SheetPortal>

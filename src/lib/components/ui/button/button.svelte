<script lang="ts" module>
  import type { VariantProps } from 'tailwind-variants';
  import { cn, tv, type WithElementRef } from '$lib/utils.js';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

  // Disesuaikan ke token Senja. Fokus memakai :focus-visible global di app.css.
  export const buttonVariants = tv({
    base: "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent font-bold whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:text-disabled aria-disabled:pointer-events-none aria-disabled:text-disabled [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
    variants: {
      variant: {
        default: 'bg-brand text-on-brand hover:bg-brand-pressed active:bg-brand-pressed',
        outline: 'border-line bg-card text-ink hover:bg-sunken',
        secondary: 'bg-brand-soft text-brand-ink hover:bg-sunken',
        ghost: 'text-ink hover:bg-sunken',
        destructive: 'border-line bg-card text-danger hover:bg-sunken',
        link: 'text-brand-ink underline-offset-4 hover:underline'
      },
      size: {
        default: 'min-h-11 px-5 text-body',
        sm: 'min-h-11 px-4 text-label',
        lg: 'min-h-12 px-6 text-body',
        icon: 'size-11'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  });

  export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
  export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

  export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
    WithElementRef<HTMLAnchorAttributes> & {
      variant?: ButtonVariant;
      size?: ButtonSize;
    };
</script>

<script lang="ts">
  let {
    class: className,
    variant = 'default',
    size = 'default',
    ref = $bindable(null),
    href = undefined,
    type = 'button',
    disabled,
    children,
    ...restProps
  }: ButtonProps = $props();
</script>

{#if href}
  <!-- Pemanggil wajib meneruskan href yang sudah lewat resolve() dari $app/paths. -->
  <!-- eslint-disable svelte/no-navigation-without-resolve -->
  <a
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    href={disabled ? undefined : href}
    aria-disabled={disabled}
    role={disabled ? 'link' : undefined}
    tabindex={disabled ? -1 : undefined}
    {...restProps}
  >
    {@render children?.()}
  </a>
  <!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
  <button
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    {type}
    {disabled}
    {...restProps}
  >
    {@render children?.()}
  </button>
{/if}

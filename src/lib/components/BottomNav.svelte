<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import Sunrise from '@lucide/svelte/icons/sunrise';
  import CalendarDays from '@lucide/svelte/icons/calendar-days';
  import SquareCheckBig from '@lucide/svelte/icons/square-check-big';
  import Moon from '@lucide/svelte/icons/moon';
  import LayoutGrid from '@lucide/svelte/icons/layout-grid';
  import { copy } from '$lib/copy';

  const tabs = [
    { path: '/', label: copy.nav.today, icon: Sunrise },
    { path: '/jadwal', label: copy.nav.schedule, icon: CalendarDays },
    { path: '/tugas', label: copy.nav.tasks, icon: SquareCheckBig },
    { path: '/ibadah', label: copy.nav.worship, icon: Moon },
    { path: '/lainnya', label: copy.nav.more, icon: LayoutGrid }
  ] as const;

  function isActive(path: string, pathname: string): boolean {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(`${path}/`);
  }
</script>

<nav
  aria-label={copy.nav.label}
  class="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]"
>
  <ul class="mx-auto flex h-[84px] max-w-lg items-stretch px-2 pt-2 pb-3">
    {#each tabs as tab (tab.path)}
      {@const active = isActive(tab.path, page.url.pathname)}
      <li class="flex flex-1">
        <a
          href={resolve(tab.path)}
          aria-current={active ? 'page' : undefined}
          class={[
            'flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-caption font-bold',
            active ? 'text-brand-ink' : 'text-muted hover:text-ink'
          ]}
        >
          <span class={['flex h-7 w-14 items-center justify-center rounded-full', active && 'bg-brand-soft']}>
            <tab.icon size={22} strokeWidth={2} aria-hidden="true" />
          </span>
          {tab.label}
        </a>
      </li>
    {/each}
  </ul>
</nav>

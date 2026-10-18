<script lang="ts">
  /** Dialog konfirmasi aksi yang tidak bisa dibatalkan (hapus). Tombol aksi memakai varian destructive. */
  import { AlertDialog } from 'bits-ui';
  import { buttonVariants } from '$lib/components/ui/button';
  import { copy } from '$lib/copy';

  let {
    open = $bindable(false),
    title,
    body,
    action,
    onconfirm
  }: {
    open?: boolean;
    title: string;
    body: string;
    action: string;
    onconfirm: () => void | Promise<void>;
  } = $props();

  let busy = $state(false);

  async function confirm() {
    if (busy) return;
    busy = true;
    try {
      await onconfirm();
      open = false;
    } finally {
      busy = false;
    }
  }
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Portal>
    <AlertDialog.Overlay class="fixed inset-0 z-50 bg-scrim" />
    <AlertDialog.Content
      class="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-40px)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border border-line bg-card p-5 text-ink"
    >
      <div class="flex flex-col gap-1">
        <AlertDialog.Title class="text-heading-md font-extrabold text-ink">{title}</AlertDialog.Title>
        <AlertDialog.Description class="text-body text-muted">{body}</AlertDialog.Description>
      </div>
      <div class="flex flex-col-reverse gap-2 min-[360px]:flex-row min-[360px]:justify-end">
        <AlertDialog.Cancel class={buttonVariants({ variant: 'outline' })}
          >{copy.common.cancel}</AlertDialog.Cancel
        >
        <AlertDialog.Action
          class={buttonVariants({ variant: 'destructive' })}
          disabled={busy}
          onclick={confirm}
        >
          {action}
        </AlertDialog.Action>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>

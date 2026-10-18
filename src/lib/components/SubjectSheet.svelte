<script lang="ts">
  /** Bottom sheet tambah/ubah mata pelajaran (PRD §F4.1). */
  import { Button } from '$lib/components/ui/button';
  import * as Sheet from '$lib/components/ui/sheet';
  import { copy } from '$lib/copy';
  import { ValidationError } from '$lib/data/repo/errors';
  import { createSubject, updateSubject } from '$lib/data/repo/subjects';
  import {
    MAX_SUBJECT_DETAIL,
    MAX_SUBJECT_NAME,
    normalizeSubjectInput,
    validateSubjectInput
  } from '$lib/domain/subjects';
  import type { Subject } from '$lib/domain/types';
  import { schedule } from '$lib/stores/schedule.svelte';

  let {
    open = $bindable(false),
    subject,
    ondelete
  }: {
    open?: boolean;
    /** null = tambah baru. */
    subject: Subject | null;
    ondelete: (subject: Subject) => void;
  } = $props();

  const t = copy.subjects;

  let name = $state('');
  let teacher = $state('');
  let room = $state('');
  let error = $state<string | null>(null);
  let saving = $state(false);

  // Isi ulang form setiap kali sheet dibuka.
  $effect(() => {
    if (!open) return;
    name = subject?.name ?? '';
    teacher = subject?.teacher ?? '';
    room = subject?.room ?? '';
    error = null;
  });

  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (saving) return;
    const input = normalizeSubjectInput({ name, teacher, room });
    const code = validateSubjectInput(input, schedule.subjects, subject?.id ?? null);
    if (code) {
      error = t.errors[code];
      return;
    }
    saving = true;
    try {
      const now = new Date().toISOString();
      if (subject) await updateSubject(subject.id, input, now);
      else await createSubject(input, now);
      open = false;
    } catch (err) {
      if (err instanceof ValidationError) error = t.errors[err.code] ?? copy.error.body;
      else throw err;
    } finally {
      saving = false;
    }
  }

  function requestDelete() {
    if (!subject) return;
    open = false;
    ondelete(subject);
  }

  const inputClass =
    'min-h-11 w-full rounded-md border border-line bg-ground px-4 text-field text-ink placeholder:text-muted';
</script>

<Sheet.Root bind:open>
  <Sheet.Content>
    <Sheet.Header>
      <Sheet.Title>{subject ? t.sheetEditTitle : t.sheetAddTitle}</Sheet.Title>
      <Sheet.Description>{t.sheetDescription}</Sheet.Description>
    </Sheet.Header>

    <form class="flex flex-col gap-4" onsubmit={save} novalidate>
      <label class="flex flex-col gap-1.5">
        <span class="text-label font-bold text-ink">{t.name}</span>
        <input
          class={inputClass}
          bind:value={name}
          maxlength={MAX_SUBJECT_NAME}
          placeholder={t.namePlaceholder}
          autocomplete="off"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'subject-error' : undefined}
        />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-label font-bold text-ink"
          >{t.teacher} <span class="font-semibold text-muted">· {t.optional}</span></span
        >
        <input class={inputClass} bind:value={teacher} maxlength={MAX_SUBJECT_DETAIL} autocomplete="off" />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-label font-bold text-ink"
          >{t.room} <span class="font-semibold text-muted">· {t.optional}</span></span
        >
        <input class={inputClass} bind:value={room} maxlength={MAX_SUBJECT_DETAIL} autocomplete="off" />
      </label>

      {#if error}
        <p id="subject-error" class="text-label font-semibold text-danger" role="alert">{error}</p>
      {/if}

      <Button type="submit" disabled={saving}>{copy.common.save}</Button>
      {#if subject}
        <Button variant="destructive" onclick={requestDelete}>{t.delete}</Button>
      {/if}
    </form>
  </Sheet.Content>
</Sheet.Root>

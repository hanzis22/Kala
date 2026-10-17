import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { createTV } from 'tailwind-variants';

/**
 * Skala teks Senja (app.css). Tanpa ini tailwind-merge mengira `text-heading-md`
 * adalah warna dan membuang `text-ink` (atau sebaliknya).
 */
const twMergeConfig = {
  extend: {
    theme: {
      text: ['display', 'heading-xl', 'heading-md', 'body', 'field', 'label', 'caption', 'arabic']
    }
  }
};

const twMerge = extendTailwindMerge(twMergeConfig);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const tv = createTV({ twMergeConfig });

// Helper tipe dari shadcn-svelte.
export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

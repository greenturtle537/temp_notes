import { writable } from 'svelte/store';
import type { Editor } from '@tiptap/core';

// writable stores to hold variables, accessible from any component
export const editorInstance = writable<Editor | null>(null);
export const noteIdInstance = writable<string | null>(null);

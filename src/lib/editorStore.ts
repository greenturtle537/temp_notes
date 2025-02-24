import { writable } from 'svelte/store';
import type { Editor } from '@tiptap/core';

export const editorInstance = writable<Editor | null>(null);
export const noteIdInstance = writable<string | null>(null);

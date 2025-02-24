<script lang="ts">
	import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
	import { onDestroy, onMount, tick } from 'svelte';
	import { Editor } from '@tiptap/core';

	import { saveContent, loadContent } from '$lib/database';
	import { editorInstance, noteIdInstance } from '$lib/editorStore';

	import Document from '@tiptap/extension-document';
	import Paragraph from '@tiptap/extension-paragraph';
	import Text from '@tiptap/extension-text';
	import Heading from '@tiptap/extension-heading';
	import BulletList from '@tiptap/extension-bullet-list';
	import OrderedList from '@tiptap/extension-ordered-list';
	import ListItem from '@tiptap/extension-list-item';

	import Bold from '@tiptap/extension-bold';
	import Code from '@tiptap/extension-code';
	import Italic from '@tiptap/extension-italic';

	import HorizontalRule from '@tiptap/extension-horizontal-rule';

	import TextAlign from '@tiptap/extension-text-align';

	import { common, createLowlight } from 'lowlight';

	import 'highlight.js/styles/github-dark.css';

	const lowlight = createLowlight(common);

	let editorElement: HTMLDivElement;

	// Subscribe to noteId changes
	let noteIdValue = $state('');
	const unsubscribeNoteId = noteIdInstance.subscribe((value) => {
		if (value) {
			noteIdValue = value;
		}
	});

	onMount(() => {
		// Check local storage for a previously saved noteId
		if (typeof window !== 'undefined') {
			const storedNoteId = localStorage.getItem('noteId');
			if (storedNoteId) {
				noteIdInstance.set(storedNoteId);
			}
		}

		let editor = new Editor({
			element: editorElement,
			extensions: [
				Document,
				Paragraph,
				Text,
				Heading,
				HorizontalRule,
				Bold,
				Code.configure({
					HTMLAttributes: {
						class: 'p-1 bg-[#212325] rounded-md text-sm'
					}
				}),
				Italic,
				TextAlign.configure({
					defaultAlignment: 'left',
					types: ['heading', 'paragraph'] // Define which node types can be aligned
				}),
				CodeBlockLowlight.configure({
					lowlight,

					HTMLAttributes: {
						class: 'p-2 bg-[#212325] rounded-md'
					}
				}),
				BulletList.configure({
					itemTypeName: 'listItem'
				}),
				OrderedList,
				ListItem
			],
			content: '<p>Hello World!</p>', // Initial content
			onTransaction: () => {
				// force re-render so `editor.isActive` works as expected
				editorInstance.set(editor);
			}
		});

		editorInstance.set(editor);

		if ($noteIdInstance && editor) {
			loadContent(noteIdValue, editor);
		}

		return () => {
			editor.destroy();
			unsubscribeNoteId();
		};
	});

	onDestroy(() => {
		unsubscribeNoteId();
	});
</script>

<div class="sticky-container">
	<span>current note: {noteIdValue}</span>
	<div class="sticky top-0 m-2 grid rounded-full bg-gray-800 p-2">
		<div class="w-fit place-self-center">
			{#if $editorInstance}
				<button
					onclick={() => $editorInstance.chain().focus().toggleHeading({ level: 1 }).run()}
					class:active={$editorInstance.isActive('heading', { level: 1 })}
				>
					H1
				</button>
				<button
					onclick={() => $editorInstance.chain().focus().toggleHeading({ level: 2 }).run()}
					class:active={$editorInstance.isActive('heading', { level: 2 })}
				>
					H2
				</button>
				<button
					onclick={() => $editorInstance.chain().focus().setParagraph().run()}
					class:active={$editorInstance.isActive('paragraph')}
				>
					P
				</button>

				<button
					onclick={() => $editorInstance.chain().focus().setTextAlign('left').run()}
					class:active={$editorInstance.isActive({ textAlign: 'left' })}
				>
					Left
				</button>
				<button
					onclick={() => $editorInstance.chain().focus().setTextAlign('center').run()}
					class:active={$editorInstance.isActive({ textAlign: 'center' })}
				>
					Center
				</button>
				<button
					onclick={() => $editorInstance.chain().focus().setTextAlign('right').run()}
					class:active={$editorInstance.isActive({ textAlign: 'right' })}
				>
					Right
				</button>
				<button
					onclick={() => $editorInstance.chain().focus().setTextAlign('justify').run()}
					class:active={$editorInstance.isActive({ textAlign: 'justify' })}
				>
					Justify
				</button>
				<button
					onclick={async () =>
						$editorInstance &&
						noteIdValue &&
						(await saveContent(noteIdValue, $editorInstance, '/stuff/'))}
				>
					Save</button
				>
				<button
					onclick={async () =>
						$editorInstance && noteIdValue && (await loadContent(noteIdValue, $editorInstance))}
					disabled={!noteIdValue}
				>
					Load
				</button>
			{/if}
		</div>
	</div>

	<div
		class="container mx-auto rounded-md border-1 border-red-400 bg-[#121212] focus-within:border-green-400"
	>
		<div bind:this={editorElement}></div>
	</div>
</div>

<style>
	.sticky-container {
		display: flex;
		flex-direction: column; /* Ensure buttons are above the editor */
	}

	button {
		background-color: lightgray;
		color: black;
	}

	button.active {
		background-color: black;
		color: white;
	}

	button {
		margin-right: 5px; /* Add spacing between buttons */
		padding: 5px 10px;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
	}
</style>

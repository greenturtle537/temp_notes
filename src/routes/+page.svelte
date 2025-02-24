<script lang="ts">
	import Editor from '$lib/Editor.svelte';
	import FileTree from '$lib/FileTree.svelte';
	import type { SvelteComponent } from 'svelte';

	let editorComponent: SvelteComponent;
</script>

<div class="grid h-screen grid-flow-row grid-cols-[auto_1fr]">
	<FileTree />
	<Editor bind:this={editorComponent} />
</div>

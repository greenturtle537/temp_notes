<script lang="ts">
	import { onMount } from 'svelte';

	import { saveContent, loadContent } from '$lib/database';
	import { v4 as uuidv4 } from 'uuid';
	import { editorInstance, noteIdInstance } from '$lib/editorStore';

	const API_URL = 'http://localhost:5000';

	let fileTree: Array<{ id: string; path: string; type: string; children: any[] }> = $state([]);

	//TODO: newNotePath isn't used yet, somehow use it to tell where to make new notes (need to implement proper foldering first)
	let newNotePath: string = $state('/');

	//TODO: make this not pixels (define it in em or something)
	let componentWidth = $state(250); // Initial width

	let isResizing = $state(false); // Tracks whether FileTree is currently being resized (used to prevent selection weirdness)

	//TODO: let this create new notes not in the same place always
	async function createNewNote() {
		const noteId = uuidv4(); // Generate a new noteId
		if ($editorInstance) {
			$editorInstance.commands.setContent(''); // Clear the editor content
		}
		if (typeof window !== 'undefined') {
			localStorage.removeItem('noteId'); // Clear noteId from localStorage
		}
		noteIdInstance.set(noteId); // Set the new noteId
		console.log('Created a new note with ID:', noteId); // debug
		// After creating the new note, refresh the file tree
		await loadFileTree();
	}

	// updates the file tree
	async function loadFileTree() {
		const response = await fetch(`${API_URL}/list`);
		const data = await response.json();
		fileTree = buildFileTree(data.items);
	}

	onMount(async () => {
		await loadFileTree(); // fill in the file tree
	});

	// generates the file tree given data from the server
	function buildFileTree(
		items: Array<{ id: string; path: string; type: string; children: any[] }>
	) {
		const tree: { id: string; path: string; type: string; children: any[] }[] = [];
		const lookup: { [key: string]: { id: string; path: string; type: string; children: any[] } } =
			{};

		// Create a lookup table for easy access
		items.forEach((item) => {
			lookup[item.id] = { ...item, children: [] };
			item.children = [];
		});

		// Build the tree
		items.forEach((item) => {
			const pathParts = item.path.split('/');
			const parentPath = pathParts.join('/');

			if (parentPath) {
				const parent = items.find((i) => i.path === parentPath && i.type === 'directory');
				if (parent) {
					parent.children.push(item);
				} else {
					tree.push(item); // Add to root
				}
			} else {
				tree.push(item); // Add to root
			}
		});

		return tree;
	}

	// mousedown for the resize element
	function handleMouseDown(event: MouseEvent) {
		isResizing = true;
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}

	// moisemove for the resize element
	function handleMouseMove(event: MouseEvent) {
		if (isResizing) {
			componentWidth = event.clientX; // Update width based on mouse position
		}
	}

	// mouseup for the resize element
	function handleMouseUp() {
		isResizing = false;
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	}
</script>

<div class="flex">
	<div
		style="width: {componentWidth}px;"
		class=" grid grid-flow-row grid-cols-1 place-items-start content-start overflow-hidden bg-[#161616] p-4 text-nowrap"
	>
		<button onclick={() => console.log(fileTree)}>Log file tree</button>
		<button onclick={createNewNote}>New Note</button>

		<hr class="w-full py-2" />

		<div
			class=" grid w-full grid-flow-row grid-cols-1 place-items-start content-start overflow-hidden"
		>
			{#each fileTree as item}
				<button
					onclick={async () => {
						$editorInstance &&
							$noteIdInstance &&
							(await saveContent($noteIdInstance, $editorInstance, 'stuff/').then(() => {
								loadContent(item.id, $editorInstance);
							}));
						console.log('clicked', item.id);
						await loadFileTree();
					}}
					disabled={!$noteIdInstance}
					class="w-full cursor-pointer"
				>
					{item.path}{item.id}
				</button>
			{/each}
		</div>
	</div>
	<button
		onmousedown={handleMouseDown}
		style="width: 5px; cursor: ew-resize; user-select: none;"
		class="bg-gray-500"
		aria-label="Resize"
	></button>
</div>

import { tick } from 'svelte';
import { Editor } from '@tiptap/core';

import { noteIdInstance, notePathInstance } from './editorStore';

const API_URL = 'http://localhost:5000';

// Function to save the editor content to the server
export const saveContent = async (noteId: string, editor: Editor, path: string) => {
	if (editor) {
		try {
			const content = editor.getHTML(); // Get HTML content
			const response = await fetch(`${API_URL}/save`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ content, noteId, path }) // Send noteId in the request body
			});

			if (response.ok) {
				const data = await response.json();
				noteId = data.noteId; // Store the noteId
				console.log('saved ', noteId);
				// Save noteId to localStorage after successful save
				if (typeof window !== 'undefined') {
					localStorage.setItem('noteId', noteId);
				}
			} else {
				console.error('Error saving content:', response.statusText);
			}
		} catch (error) {
			console.error('Error saving content:', error);
		}
	}
};

// Function to load the editor content from the server
export const loadContent = async (noteId: string, editor: Editor) => {
	if (noteId) {
		try {
			const response = await fetch(`${API_URL}/load/${noteId}`);
			if (response.ok) {
				const data = await response.json();
				await tick(); // Wait for the editor to be fully initialized
				if (data.content && editor) {
					editor.commands.setContent(data.content);
					noteIdInstance.set(noteId); // Set noteId in the store
					notePathInstance.set(data.path); // Set notePath in the store
					console.log(`loaded ${noteId}.`);
				} else {
					console.log('No content found on server.');
				}
			} else {
				console.error('Error loading content:', response.statusText);
			}
		} catch (error) {
			console.error('Error loading content:', error);
		}
	} else {
		console.log('No note ID available.  Cannot load content.');
	}
};

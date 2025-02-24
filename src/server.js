import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import sqlite3 from 'sqlite3';

const app = express();
const PORT = 5000; // server listen port
const NOTES_DIR = 'notes'; // directory where notes db file is stored

// Add headers before the routes are defined
app.use(function (req, res, next) {
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', '*'); //LINE 5

	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', 'true');

	// Pass to next layer of middleware
	next();
});

// Initialize SQLite database
const db = new sqlite3.Database(NOTES_DIR + '/notes.db', (err) => {
	if (err) {
		console.error(err.message);
	}
	console.log('Connected to the notes database.');
});

// Create notes table if it doesn't exist
db.run(
	// each note has:
	// id:      TEXT   (unique note identifier)
	// path:    TEXT   (location of note)
	// content: TEXT   (content of note)
	// type:    TEXT   (note or directory)
	`
    CREATE TABLE IF NOT EXISTS notes (
		id TEXT PRIMARY KEY,
    	path TEXT,
    	content TEXT,
		\`type\` TEXT -- 'note' or 'directory'
	)
`,
	(err) => {
		if (err) {
			console.error(err.message);
		}
	}
);

app.use(bodyParser.json());
app.use(cors());

// Create '/save' dir, used to save a new note or update an existing one
app.post('/save', (req, res) => {
	const content = req.body.content; // Content is now HTML
	const noteId = req.body.noteId || uuidv4();
	const path = req.body.path || '/'; // Default path

	// Check if note exists
	db.get(`SELECT id FROM notes WHERE id = ?`, [noteId], (err, row) => {
		if (err) {
			console.error(err.message);
			return res.status(500).json({ error: 'Failed to check note existence' });
		}

		if (row) {
			// Update existing note
			db.run(
				`UPDATE notes SET content = ?, path = ? WHERE id = ? AND \`type\` = ?`,
				[content, path, noteId, 'note'],
				(err) => {
					if (err) {
						console.error(err.message);
						return res.status(500).json({ error: 'Failed to update note' });
					}
					res.json({ noteId: noteId });
					console.log(`Note ${noteId} updated`);
				}
			);
		} else {
			// Insert new note
			db.run(
				`INSERT INTO notes (id, content, path, \`type\`) VALUES (?, ?, ?, ?)`,
				[noteId, content, path, 'note'],
				(err) => {
					if (err) {
						console.error(err.message);
						return res.status(500).json({ error: 'Failed to save note' });
					}
					res.json({ noteId: noteId });
					console.log(`Note ${noteId} saved`);
				}
			);
		}
	});
});

//TODO: I dont know what this one is for
app.post('/createDirectory', (req, res) => {
	const path = req.body.path;
	const id = uuidv4();

	db.run(
		`INSERT INTO notes (id, path, content, \`type\`) VALUES (?, ?, ?, ?)`,
		[id, path, '', 'directory'],
		(err) => {
			if (err) {
				console.error(err.message);
				return res.status(500).json({ error: 'Failed to create directory' });
			}
			res.json({ id: id });
			console.log(`Directory ${path} created`);
		}
	);
});

// Creates '/load/:noteId' dir, used to load a specific note
app.get('/load/:noteId', (req, res) => {
	const noteId = req.params.noteId;
	db.get(`SELECT content, path FROM notes WHERE id = ?`, [noteId], (err, row) => {
		if (err) {
			console.error(err.message);
			return res.status(500).json({ error: 'Failed to load note' });
		}
		if (row) {
			res.json({ content: row.content, path: row.path });
		} else {
			res.status(404).json({ error: 'Note not found' });
		}
	});
});

// Created '/list' dir, used to list all notes
app.get('/list', (req, res) => {
	db.all(`SELECT id, path, \`type\` FROM notes`, [], (err, rows) => {
		if (err) {
			console.error(err.message);
			return res.status(500).json({ error: 'Failed to list notes' });
		}
		res.json({ items: rows });
	});
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});

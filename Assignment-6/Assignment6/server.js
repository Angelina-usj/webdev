import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

// ---------- Database (SQLite file, so data persists) ----------
const db = new Database(process.env.DB_FILE || 'notes.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    title     TEXT NOT NULL,
    body      TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL
  )
`);

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// ---------- Helpers ----------
function findNote(id) {
  return db.prepare('SELECT * FROM notes WHERE id = ?').get(Number(id));
}

// Validation middleware (POST and PUT): check, then next()
function requireTitle(req, res, next) {
  const title = req.body?.title;
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (req.body.body !== undefined && typeof req.body.body !== 'string') {
    return res.status(400).json({ error: 'body must be a string' });
  }
  next();
}

// ---------- Routes ----------

// READ ALL  (supports ?search= &sort= &limit=)
app.get('/api/notes', (req, res) => {
  const { search = '', sort = 'newest', limit = 20 } = req.query;

  let result = db.prepare('SELECT * FROM notes').all().filter(n =>
    n.title.toLowerCase().includes(String(search).toLowerCase()));

  if (sort === 'newest') {
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  res.json(result.slice(0, Number(limit) || 20));
});

// READ ONE
app.get('/api/notes/:id', (req, res) => {
  const note = findNote(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

// CREATE
app.post('/api/notes', requireTitle, (req, res) => {
  const createdAt = new Date().toISOString();
  const info = db
    .prepare('INSERT INTO notes (title, body, createdAt) VALUES (?, ?, ?)')
    .run(req.body.title.trim(), req.body.body ?? '', createdAt);
  res.status(201).json(findNote(info.lastInsertRowid));
});

// REPLACE (PUT) - whole note, missing body becomes ''
app.put('/api/notes/:id', requireTitle, (req, res) => {
  const note = findNote(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  db.prepare('UPDATE notes SET title = ?, body = ? WHERE id = ?')
    .run(req.body.title.trim(), req.body.body ?? '', note.id);
  res.json(findNote(note.id));
});

// UPDATE (PATCH) - only the fields you send
app.patch('/api/notes/:id', (req, res) => {
  const note = findNote(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  const { title, body } = req.body ?? {};
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ error: 'title must be a non-empty string' });
  }
  if (body !== undefined && typeof body !== 'string') {
    return res.status(400).json({ error: 'body must be a string' });
  }

  if (title !== undefined) note.title = title.trim();
  if (body !== undefined) note.body = body;

  db.prepare('UPDATE notes SET title = ?, body = ? WHERE id = ?')
    .run(note.title, note.body, note.id);
  res.json(note);
});

// DELETE - 204, no body
app.delete('/api/notes/:id', (req, res) => {
  const note = findNote(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  db.prepare('DELETE FROM notes WHERE id = ?').run(note.id);
  res.sendStatus(204);
});

// ---------- Unknown route -> 404 ----------
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- Error handler: server never crashes ----------
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON in request body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

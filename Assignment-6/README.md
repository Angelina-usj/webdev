# Notes REST API (Assignment 6)

A RESTful Express API for managing personal notes, backed by an SQLite database (`notes.db`, created automatically on first run, so data persists between restarts).

## Tech Stack

- Node.js + Express
- SQLite (`better-sqlite3`)
- `cors` and `dotenv`

## Project Structure

| File | Purpose |
|---|---|
| `server.js` | The whole API: database setup, validation, routes, error handling |
| `package.json` | Dependencies and the `npm start` / `npm run dev` scripts |
| `.env` / `.env.example` | Configuration (port, database file, allowed front-end origin) |
| `.gitignore` | Keeps `.env`, `node_modules/` and `*.db` out of Git |
| `postman/notes-api.postman_collection.json` | Postman / Thunder Client collection with every route |
| `notes.db` | SQLite database, created automatically on first run |

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root (a template is in `.env.example`):
   ```
   PORT=3000
   DB_FILE=notes.db
   CLIENT_ORIGIN=http://localhost:5173
   ```
   `.env` is listed in `.gitignore` and is not committed.
3. Start the server:
   ```bash
   npm start
   ```
   or, for development (auto-restarts when you save a file):
   ```bash
   npm run dev
   ```

The server starts on `http://localhost:3000`. Note that the root URL `/` has no route (it returns a 404 JSON error); all routes live under `/api/notes`.

## Note Object

```json
{
  "id": 1,
  "title": "Exam Topics",
  "body": "Study REST API design",
  "createdAt": "2026-11-07T09:30:00.000Z"
}
```

- `title`: required, non-empty string
- `body`: optional string (defaults to an empty string)
- `id` and `createdAt` are set by the server, never by the client

## API Endpoints

| Job | Method | Path | Success | Errors |
|---|---|---|---|---|
| Create | POST | `/api/notes` | 201 | 400 |
| Read all | GET | `/api/notes` | 200 | - |
| Read one | GET | `/api/notes/:id` | 200 | 404 |
| Replace | PUT | `/api/notes/:id` | 200 | 400, 404 |
| Update | PATCH | `/api/notes/:id` | 200 | 400, 404 |
| Delete | DELETE | `/api/notes/:id` | 204 | 404 |

### 1. Get All Notes
- **GET** `/api/notes`
- Query parameters (all optional):
  - `search`: filters notes whose title contains the text
  - `sort`: `newest` (default) or `oldest`
  - `limit`: maximum number of notes returned (default: no limit, all notes are returned)
- Response (200 OK):
```json
[
  { "id": 1, "title": "Exam Topics", "body": "Study REST API design", "createdAt": "2026-11-07T09:30:00.000Z" }
]
```

### 2. Get Note by ID
- **GET** `/api/notes/:id`
- Response (200 OK): note object
- Response (404 Not Found): `{"error": "Note not found"}`

### 3. Create Note
- **POST** `/api/notes`
- Request body:
```json
{ "title": "Exam Topics", "body": "Study REST API design" }
```
- Response (201 Created): created note with generated `id` and `createdAt`
- Response (400 Bad Request): `{"error": "title is required"}`

### 4. Replace Note (Full Update)
- **PUT** `/api/notes/:id`
- Request body: `{"title": "New Title", "body": "New Body"}`
- Response (200 OK): updated note
- Response (400 Bad Request): `{"error": "title is required"}`
- Response (404 Not Found): `{"error": "Note not found"}`

### 5. Update Note (Partial Update)
- **PATCH** `/api/notes/:id`
- Request body (only the fields to change): `{"body": "Updated text only"}`
- Response (200 OK): updated note
- Response (400 Bad Request): `{"error": "title must be a non-empty string"}` or `{"error": "body must be a string"}`
- Response (404 Not Found): `{"error": "Note not found"}`

### 6. Delete Note
- **DELETE** `/api/notes/:id`
- Response (204 No Content): no body
- Response (404 Not Found): `{"error": "Note not found"}`

## Error Handling

All errors are JSON in the form `{"error": "message"}`.

| Status | When |
|---|---|
| 400 | Missing or invalid input, or malformed JSON in the request body |
| 404 | Note not found, or unknown route |
| 500 | Unexpected server error (the server keeps running) |

## Testing the API

### Option A: Postman / Thunder Client (recommended)
Import `postman/notes-api.postman_collection.json`. It has 12 requests covering every route, including the 400 and 404 cases, and each request has an automated test script that checks the status code (and the response body where relevant). To run everything at once, use the collection **Runner** (Postman) or **Run All** (Thunder Client). The Create request saves the new note's id in a collection variable, so the collection works against any database state.

Screenshots of a full collection run (all tests passing) are in the `screenshots/` folder.

### Option B: PowerShell (Windows) with `Invoke-RestMethod`

Start the server first (`npm start`) and run these in a **second** terminal. Each run below is a separate execution, so the output of one can be checked against the others.

#### Run 1: Create a note (201)
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/notes -ContentType "application/json" -Body '{"title":"My first note","body":"hello"}'
```
Expected output:
```
id title         body  createdAt
-- -----         ----  ---------
 1 My first note hello 2026-11-08T12:08:01.385Z
```

#### Run 2: Create a second note
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/notes -ContentType "application/json" -Body '{"title":"Exam topics","body":"REST, CRUD, CORS"}'
```

#### Run 3: List all notes (200)
```powershell
Invoke-RestMethod http://localhost:3000/api/notes
```

#### Run 4: Search, sort and limit
```powershell
Invoke-RestMethod "http://localhost:3000/api/notes?search=exam"
Invoke-RestMethod "http://localhost:3000/api/notes?sort=oldest&limit=1"
```
The first returns only notes whose title contains "exam". The second returns only the oldest note.

#### Run 5: Get one note (200)
```powershell
Invoke-RestMethod http://localhost:3000/api/notes/1
```

#### Run 6: Replace a note with PUT (200)
```powershell
Invoke-RestMethod -Method Put -Uri http://localhost:3000/api/notes/1 -ContentType "application/json" -Body '{"title":"Replaced title","body":"Replaced body"}'
```

#### Run 7: Partial update with PATCH (200)
```powershell
Invoke-RestMethod -Method Patch -Uri http://localhost:3000/api/notes/1 -ContentType "application/json" -Body '{"title":"Only the title changed"}'
```
The `body` stays `Replaced body`, which proves PATCH changes only what you send.

#### Run 8: Delete a note (204)
`Invoke-RestMethod` prints nothing for a 204, so use `Invoke-WebRequest` to see the status code:
```powershell
(Invoke-WebRequest -UseBasicParsing -Method Delete -Uri http://localhost:3000/api/notes/2).StatusCode
```
Expected output: `204`

#### Seeing error responses (400 / 404)
PowerShell treats any 4xx response as an exception and prints a red error. Wrap the request in `try/catch` to see the status code and the JSON message clearly:

```powershell
# Run 9: missing title -> 400
try {
  Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/notes -ContentType "application/json" -Body '{"body":"no title"}'
} catch { $_.Exception.Response.StatusCode.value__; $_.ErrorDetails.Message }
```
Expected output: `400` and `{"error":"title is required"}`

```powershell
# Run 10: note does not exist -> 404
try {
  Invoke-RestMethod http://localhost:3000/api/notes/9999
} catch { $_.Exception.Response.StatusCode.value__; $_.ErrorDetails.Message }
```
Expected output: `404` and `{"error":"Note not found"}`

```powershell
# Run 11: delete the same note twice -> second time 404
try { Invoke-RestMethod -Method Delete -Uri http://localhost:3000/api/notes/2 } catch { $_.Exception.Response.StatusCode.value__; $_.ErrorDetails.Message }
```
Expected output: `404` and `{"error":"Note not found"}`

```powershell
# Run 12: PATCH with an empty title -> 400
try {
  Invoke-RestMethod -Method Patch -Uri http://localhost:3000/api/notes/1 -ContentType "application/json" -Body '{"title":""}'
} catch { $_.Exception.Response.StatusCode.value__; $_.ErrorDetails.Message }
```
Expected output: `400` and `{"error":"title must be a non-empty string"}`

```powershell
# Run 13: malformed JSON -> 400, and the server does not crash
try {
  Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/notes -ContentType "application/json" -Body '{"title": '
} catch { $_.Exception.Response.StatusCode.value__; $_.ErrorDetails.Message }
```
Expected output: `400` and `{"error":"Malformed JSON in request body"}`

#### Run 14: Check that data persists
Stop the server with `Ctrl+C`, start it again with `npm start`, then run:
```powershell
Invoke-RestMethod http://localhost:3000/api/notes
```
The notes created earlier are still there, because they are stored in `notes.db`.

### Option C: curl (macOS / Linux)
```bash
curl -i -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Exam Topics","body":"Study REST API design"}'
```

## Problems Encountered and How They Were Fixed

### 1. `npm install` blocked in PowerShell
**Error:** `npm.ps1 cannot be loaded because running scripts is disabled on this system` (`PSSecurityException`).
**Cause:** Windows PowerShell blocks scripts by default, and `npm` is a PowerShell script.
**Fix:** Allow scripts for the current user only, then reopen the terminal:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
Alternatives that also work: run `npm.cmd install`, or use Command Prompt instead of PowerShell.

### 2. `{"error":"Not found"}` when opening `http://localhost:3000/`
**Cause:** This is expected behavior. The API has no route at `/`, so the 404 handler answers.
**Fix:** Open a real route such as `http://localhost:3000/api/notes`.

### 3. `curl` fails in PowerShell (`Cannot bind parameter 'Headers'`)
**Cause:** In PowerShell, `curl` is an alias for `Invoke-WebRequest`, which has different options than real curl.
**Fix:** Call the real program with `curl.exe`, or use PowerShell's own `Invoke-RestMethod` (shown above).

### 4. `400 Malformed JSON in request body` when using `curl.exe`
**Error:** `{"error":"Malformed JSON in request body"}` followed by `curl: (6) Could not resolve host: first`.
**Cause:** PowerShell mangled the quotes in the `-d '{...}'` argument and split the JSON at the space in `My first note`, so the server received broken JSON. (This also confirmed that the server handles bad input with a clean 400 instead of crashing.)
**Fix:** Use `Invoke-RestMethod`, which takes the JSON body as a normal string:
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/notes -ContentType "application/json" -Body '{"title":"My first note","body":"hello"}'
```
This returned the created note (`id: 1`), confirming the API and database work.

### 5. Red errors for 400 / 404 in PowerShell
**Cause:** `Invoke-RestMethod` throws an exception for any 4xx/5xx status, so it looks like a failure even though the API answered correctly.
**Fix:** Wrap the call in `try/catch` and print `$_.Exception.Response.StatusCode.value__` and `$_.ErrorDetails.Message` (see Runs 9-13).

## CORS

`cors` is registered before the routes and allows the front end at `http://localhost:5173` (configurable with `CLIENT_ORIGIN` in `.env`). Note that `curl` and PowerShell never show CORS errors; only a browser page calling `fetch` does.

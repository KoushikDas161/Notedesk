# NoteDesk — Update 3: Backend Integration

Real Node/Express backend for the Notes Sharing Platform: real accounts, real file
storage, and real in-browser file preview — replacing the `localStorage` mock layer
from Update 2.

## About the framework choice

You said React/Angular/Vue were fair game if needed — I kept **plain HTML/CSS/JS**
instead. None of those frameworks solve a problem this app actually has: there's no
complex client-side state to manage, and adding one would mean a build step (Vite/webpack),
JSX compilation, and more moving parts for you to install and debug — the opposite of
"keep it simple." The backend is the part that needed real engineering (auth, sessions,
file storage), and that's plain Node + Express either way. If a future update calls for
heavier client state, React is worth revisiting then.

## What was actually wrong with registration

Registration was almost certainly failing because of **how the page was opened**. Update
3 needs a running server — if you open `index.html`/`login.html` directly by double-clicking
it (or via the Live Server extension you used for Updates 1–2), the page loads from
`file://` or `http://127.0.0.1:5500`, and there's no backend listening there to answer
`/api/auth/register`. The fetch call fails silently-ish with a generic network error.

Two things fixed it:
1. **`public/js/api.js`** now catches that exact failure and shows a clear message: *"Could
   not reach the NoteDesk server. Make sure you ran npm start... and are visiting
   http://localhost:3000..."* — instead of a confusing or silent failure.
2. **`server/routes/auth.js`** now explicitly calls `req.session.save()` before responding,
   so the session cookie is guaranteed to be written before the browser gets the response
   (a known express-session edge case where the response can beat the session store write).

**The fix that matters most for you:** run `npm start`, then open **http://localhost:3000**
in the browser — not any other port, and not the file directly.

## What's new for file handling (your other ask)

- **Upload** → real file saved to `server/uploads/` via `multer`.
- **View in the browser** → `GET /api/notes/:id/view` streams the file with
  `Content-Disposition: inline`. PDF and JPG/PNG render directly inside the note details
  page (an `<iframe>` for PDFs, an `<img>` for images) — no download needed.
- **Download** → `GET /api/notes/:id/download` streams the same file with
  `Content-Disposition: attachment` and counts as a download.
- DOC/DOCX files upload fine but browsers can't render them inline, so the preview pane
  shows a "use Download instead" message for those — that's a browser limitation, not
  a bug.

## Roadmap

1. **Update 1** — Static UI & layout
2. **Update 2** — Core interactivity (`localStorage`-backed)
3. **Update 3 (this one)** — Backend integration: real auth, database, file storage, in-browser preview
4. **Update 4** — Smart recommendations & polish

## Project structure

```
update-3-backend-integration/
├── package.json
├── .env.example              copy to .env
├── server.js                  Express entry point
│
├── server/
│   ├── data/
│   │   ├── db.js              read/write helper — swap this file for a real DB later
│   │   ├── notes.json         seeded with the same 12 sample notes
│   │   └── users.json         starts empty — register to add one
│   ├── middleware/auth.js      requireAuth()
│   ├── routes/
│   │   ├── auth.js             register / login / logout / me
│   │   ├── notes.js            list+filter+sort, get, upload, save, view, download
│   │   └── dashboard.js        uploaded/saved/recent/recommended + stats
│   └── uploads/                 real files land here
│
└── public/
    ├── index.html, browse.html, note-details.html, upload.html, dashboard.html, login.html
    ├── css/style.css, responsive.css
    └── js/
        ├── api.js               the only file that calls fetch() — now with clear network-error messages
        ├── app.js                 nav, toast, note-card rendering
        ├── search.js              browse page — queries the API on every filter change
        └── upload.js               requires login, submits a real file upload
```

## How to run

1. `npm install`
2. `cp .env.example .env` (Windows: `copy .env.example .env`)
3. `npm start`
4. Open **http://localhost:3000** — this exact URL, in the browser.

## Try it out

1. **Register** an account.
2. **Upload** a note — attach a real PDF or image. It's saved to `server/uploads/`.
3. Open that note's **details page** — the PDF/image renders right there in the page.
   Click "Open in new tab" for a full-page read, or "Download" to save it locally.
4. Check your **Dashboard** — your upload and stats are all real, server-side data.
5. **Save** a couple of other notes while browsing and confirm they show up under
   "Saved" on your dashboard.

## API reference

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create an account, starts a session |
| POST | `/api/auth/login` | – | Log in, starts a session |
| POST | `/api/auth/logout` | – | Destroy the session |
| GET | `/api/auth/me` | – | Current user, or `null` |
| GET | `/api/notes` | – | List; `q`, `subject`, `category`, `type`, `sort` |
| GET | `/api/notes/meta` | – | Distinct subjects/categories/types |
| GET | `/api/notes/:id` | – | Single note; increments view count |
| POST | `/api/notes` | ✅ | Create (`multipart/form-data`, field `file`) |
| POST | `/api/notes/:id/save` | ✅ | Toggle save |
| GET | `/api/notes/:id/view` | – | Streams file **inline** for browser preview (PDF/JPG/PNG only) |
| GET | `/api/notes/:id/download` | – | Forces a **download**; any file type; counts a download |
| GET | `/api/dashboard` | ✅ | Uploaded/saved/recent/recommended + stats |

## What's real vs. still simplified

**Real:** bcrypt password hashing, cookie sessions, server-side validation, real file
storage on disk, in-browser file preview, a persistent JSON database, server-computed
recommendations.

**Still simplified (this is Phase 3, not production):** JSON files instead of a real
database engine, local disk instead of cloud storage (S3/GCS) — swapping either later
only touches `server/data/db.js` or the `multer` storage config in `server/routes/notes.js`,
not the rest of the app. No email verification, password reset, or rate limiting yet.

## Next step (Update 4)

Replace the subject-overlap recommendation logic in `server/routes/dashboard.js` with a
stronger approach (tag similarity, collaborative filtering), plus a performance and
accessibility pass.

# NoteDesk — Cloud Notes Sharing Platform

NoteDesk is a modern, serverless-ready note-sharing platform for students. It features a Node.js/Express backend powered by a cloud-hosted **Supabase PostgreSQL database** and **Supabase Storage**, with secure user authentication, in-memory uploads, transparent file compression, and a robust view-tracking system.

---

## 🚀 Key Features

* **Supabase PostgreSQL Database**: Utilizes a relational database to store user credentials and note metadata securely.
* **In-Memory Cloud Storage**: File uploads (PDFs, Word documents, images) are processed in-memory and stored securely in a private Supabase Storage bucket, ensuring compatibility with Vercel's serverless environment.
* **Smart Image Optimization**: Image uploads (`.jpg`, `.jpeg`, `.png`) are automatically processed on-the-fly using the `sharp` library. They are resized to fit a `1600x1600` boundary (maintaining aspect ratio) and optimized (75% quality for JPEGs, compression level 8 for PNGs) to save storage.
* **Transparent Document Compression**: Document files (`.pdf`, `.doc`, `.docx`) are automatically compressed using `gzip` on upload. The server automatically decompresses (`gunzip`) files on-the-fly during inline views or downloads, keeping client operations completely transparent.
* **Robust View Counter**: Views are tracked per-user session. Repeatedly refreshing a note page will not inflate the view count. Additionally, authors viewing their own uploaded notes are automatically excluded from the count.
* **Secure User Sessions**: Authentication is handled via `bcryptjs` password hashing and secure cookies (`express-session`).
* **Vercel Serverless Ready**: Designed to deploy natively to Vercel. Static assets are served via Vercel's CDN, and the backend routes run in isolated Serverless Functions.

---

## 📂 Project Structure

```
Notedesk/
├── package.json               Dependencies & run scripts (sharp, @supabase/supabase-js, etc.)
├── vercel.json                Vercel routing & rewrite configuration
├── supabase_schema.sql        Supabase SQL script containing tables, RLS, and seed notes
├── SUPABASE_SETUP.md          Detailed guide for database and bucket setup
├── VERCEL_DEPLOYMENT.md       Detailed guide for deploying to Vercel
├── server.js                  Express application entry point
│
├── server/
│   ├── data/
│   │   └── db.js              Supabase client initialization & mapping helpers
│   ├── middleware/
│   │   └── auth.js            requireAuth() endpoint gateway middleware
│   └── routes/
│       ├── auth.js            Authentication endpoints (register, login, logout, me)
│       ├── notes.js           Notes API (search, create, save/unsave, stream inline, download)
│       └── dashboard.js       Dashboard statistics, uploaded, saved, and recommended notes
│
└── public/                    Static Frontend Files
    ├── index.html             Home landing page & notes browse dashboard
    ├── login.html             Register and login forms
    ├── upload.html            Note creation form (with drag-and-drop & size validation)
    ├── note-details.html      Note metadata display & interactive inline preview
    ├── dashboard.html         User profile metrics & history page
    ├── css/
    │   ├── style.css          Core application stylesheet
    │   └── responsive.css     Mobile & desktop layout breakpoints
    └── js/
        ├── api.js             Centralized client-side API fetch client
        ├── app.js             Common utilities, notifications, and card render components
        ├── search.js          Search query parser for browse.html
        └── upload.js          File upload handler (checks size validation <= 10MB)
```

---

## 🛠️ Getting Started Locally

### 1. Install Dependencies
Ensure you have Node.js installed, then run:
```bash
npm install
```

### 2. Set Up Supabase Database & Storage
Follow the step-by-step instructions in **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** to:
- Create a project on Supabase.
- Run [supabase_schema.sql](supabase_schema.sql) in the SQL Editor to create tables and load default seed notes.
- Set up a private storage bucket named `notes`.

### 3. Configure Environment Variables
Create a `.env` file in the root of the project by copying `.env.example`:
```bash
cp .env.example .env
```
Fill in the credentials you obtained from Supabase:
```env
PORT=3000
SESSION_SECRET=a-long-random-string-used-for-signing-cookies
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-secret-service-role-key
```

### 4. Run the Application
Start the local server using standard Node:
```bash
npm start
```
Or start in development mode with auto-reloads (requires `nodemon` installed):
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🌐 Deployment to Vercel

NoteDesk is fully configured for Vercel out of the box. To deploy the project:
1. Push your repository to GitHub.
2. Import the project into Vercel.
3. Configure the `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SESSION_SECRET` environment variables.
4. Follow the complete deploy instructions in **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)**.

---

## 📋 API Reference

| Method | Route | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| **POST** | `/api/auth/register` | No | Creates a user account and initializes a session. |
| **POST** | `/api/auth/login` | No | Logs in a user and initializes a session. |
| **POST** | `/api/auth/logout` | No | Clears the session cookie and destroys the session. |
| **GET** | `/api/auth/me` | No | Retrieves current session user info (or `null`). |
| **GET** | `/api/notes` | No | Queries notes. Supports `q`, `subject`, `category`, `type`, and `sort`. |
| **GET** | `/api/notes/meta` | No | Returns lists of distinct categories, subjects, and file types. |
| **GET** | `/api/notes/:id` | No | Retrieves metadata for a note. Safe view-counter tracks views. |
| **POST** | `/api/notes` | **Yes** | Uploads a file (`multipart/form-data`). Optimizes/compresses on-the-fly. |
| **POST** | `/api/notes/:id/save` | **Yes** | Toggles a note in the user's saved list. |
| **GET** | `/api/notes/:id/view` | No | Streams files inline (PDF/JPG/PNG only). Gunzips if compressed. |
| **GET** | `/api/notes/:id/download` | No | Triggers a download attachment, increments downloads, and gunzips. |
| **GET** | `/api/dashboard` | **Yes** | Gathers dashboard stats, uploads, saves, and recommendations. |

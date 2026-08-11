# Vercel Deployment Guide for NoteDesk

This guide walks you through deploying the NoteDesk application (Express backend + static HTML/JS frontend) to Vercel.

---

## Prerequisites
1. A **GitHub** account containing your NoteDesk repository.
2. A **Vercel** account (linked to your GitHub account).
3. A **Supabase** database and storage bucket configured (see [SUPABASE_SETUP.md](file:///home/m4hd1bd/Documents/GitHub/Notedesk/SUPABASE_SETUP.md)).

---

## Setup & Files Included
NoteDesk includes a `vercel.json` file in the root directory that handles routing automatically:
- `/api/*` requests are routed to the Express backend in `server.js` (which runs as a Serverless Function).
- All other requests (e.g. `/`, `/css/*`, `/js/*`, `/index.html`) serve the static client files inside the `public/` directory directly (fastest performance, zero cold starts for the frontend).

---

## Deployment Option 1: Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and log in.
2. Click the **Add New...** button and select **Project**.
3. Under **Import Git Repository**, find your `Notedesk` repository and click **Import**.
4. Configure your project settings:
   - **Framework Preset**: Leave as `Other` (Vercel will detect `vercel.json`).
   - **Root Directory**: `./` (default)
5. Expand the **Environment Variables** section and add the following keys and values:
   - `SUPABASE_URL`: (your Supabase URL, e.g., `https://xyz.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY`: (your Supabase service_role key)
   - `SESSION_SECRET`: (a long secure random string for user session signing)
6. Click **Deploy**.
7. Once the build finishes, Vercel will provide you with a production URL (e.g., `https://notedesk.vercel.app`).

---

## Deployment Option 2: Vercel CLI (Command Line)

If you prefer to deploy from your terminal, you can use the Vercel CLI:

1. **Install Vercel CLI globally**:
   ```bash
   npm install -g vercel
   ```
2. **Log in to Vercel**:
   ```bash
   vercel login
   ```
3. **Initialize and link the project**:
   Run the following command in the root of your NoteDesk repository:
   ```bash
   vercel
   ```
   Follow the prompts to link the project to your Vercel account.
4. **Add environment variables**:
   Set up the environment variables on Vercel:
   ```bash
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add SESSION_SECRET
   ```
5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

---

## Important Notes on Serverless Lifecycles
- **Stateless Serverless Functions**: Vercel's Node.js functions are stateless and spin down when idle. Because of this, NoteDesk uses **Supabase Storage** for uploaded documents and **Supabase Database** for metadata, rather than writing to the local server disk (which is read-only and ephemeral on Vercel).
- **Session Security**: Express sessions are stored in-memory on the serverless instance. For absolute production robustness, you can configure a session store (like Redis) or JWT-based cookie storage. However, standard express-session works out of the box for general usage.

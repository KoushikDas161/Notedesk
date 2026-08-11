# Supabase Setup Guide for NoteDesk

This guide walks you through setting up your Supabase database and storage bucket to run the NoteDesk backend.

---

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and click **Sign Up** or **Sign In**.
2. From the dashboard, click **New Project** (or select your organization and then click **New Project**).
3. Fill in the project details:
   - **Name**: `NoteDesk` (or any name you prefer)
   - **Database Password**: Generate a secure password and save it somewhere safe.
   - **Region**: Select the region closest to your users or hosting server (e.g., US East, Frankfurt, etc.).
   - **Pricing Plan**: Select the **Free Tier**.
4. Click **Create new project** and wait a couple of minutes for your database to provision.

---

## Step 2: Run the SQL Schema Script

Once your project is ready, you need to set up the database tables and populate the default notes:

1. In the Supabase sidebar, click on the **SQL Editor** tab (the icon looks like `>_` or a terminal prompt).
2. Click **New query** (or click **Quickstarts** -> **Blank query**).
3. Open the `supabase_schema.sql` file located in the root of your NoteDesk repository.
4. Copy the entire contents of `supabase_schema.sql` and paste them into the Supabase SQL editor.
5. Click the **Run** button (or press `Ctrl + Enter` / `Cmd + Enter`).
6. Verify that the output shows `Success. No rows returned` (or lists the queries run). You should now see the `users` and `notes` tables under the **Database** or **Table Editor** tab.

---

## Step 3: Create a Storage Bucket

NoteDesk stores note files (PDFs, images, documents) securely in Supabase Storage:

1. In the Supabase sidebar, click on the **Storage** tab (the bucket icon).
2. Click **New Bucket**.
3. Configure the bucket:
   - **Bucket Name**: `notes` (must be lowercase and exact)
   - **Allowed MIME types**: Leave blank to allow all types, or restrict to documents/images.
   - **Public Bucket**: Keep this **disabled** (Private).
     > **Why Private?** Because NoteDesk's Node/Express backend acts as a secure proxy. The server downloads the file from storage and streams it to the user's browser, preventing direct unsecured URLs to your files.
4. Click **Save**.

---

## Step 4: Get API Credentials

To connect your backend, you need your project's connection credentials:

1. From the **Project Overview** Tab, copy the Project URL.
2. In the Supabase sidebar, click on the **Project Settings** tab (the gear icon at the bottom).
3. Click on **API Keys** in the settings menu.
4. Locate the following values:
   - **service_role key**: Under the `Legacy anon, service_role API keys` section, click the **Reveal** button next to the `service_role` key (labeled `secret`) and copy it.
     > ⚠️ **CRITICAL WARNING**: The `service_role` key bypasses all Row Level Security (RLS) policies. **Never** share this key, commit it to GitHub, or use it in frontend client code. It should only exist on your secure Node/Express backend server.

---

## Step 5: Configure Environment Variables

1. In the root of your local NoteDesk directory, create a file named `.env`.
2. Open the file and configure your credentials as follows:
   - Paste the credentials you copied in Step 4:
     ```env
     PORT=3000
     SESSION_SECRET=change-this-to-a-long-random-string
     SUPABASE_URL=https://your-project-ref.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-revealed-service-role-key
     ```
3. Save the `.env` file.

Now your database and file storage are fully configured and ready to be used by the NoteDesk server!

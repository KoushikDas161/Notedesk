/* =========================================================
   DB.JS — Supabase Database Connection
   Connects to Supabase using the service_role key to bypass RLS 
   for administrative backend operations.
   ========================================================= */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("WARNING: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables!");
}

const supabase = createClient(supabaseUrl || "", supabaseServiceKey || "");

// ---------- Helpers for Field Mapping ----------

function mapUserFields(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    passwordHash: u.password_hash,
    savedNoteIds: u.saved_note_ids || [],
    recentNoteIds: u.recent_note_ids || [],
    createdAt: u.created_at
  };
}

function mapNoteFields(n, currentUser = null) {
  if (!n) return null;
  return {
    id: n.id,
    title: n.title,
    subject: n.subject,
    course: n.course,
    category: n.category,
    type: n.type,
    tags: n.tags || [],
    authorId: n.author_id,
    authorName: n.author_name,
    date: n.date,
    views: n.views,
    downloads: n.downloads,
    description: n.description,
    filename: n.filename,
    originalName: n.original_name,
    saved: !!(currentUser && currentUser.savedNoteIds && currentUser.savedNoteIds.includes(n.id))
  };
}

module.exports = {
  supabase,
  mapUserFields,
  mapNoteFields
};

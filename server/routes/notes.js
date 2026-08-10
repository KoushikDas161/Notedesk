/* =========================================================
   NOTES ROUTES — /api/notes/*
   Real persistence (Supabase) and real file storage (Supabase Storage)
   with Multer memory storage.

   Two ways to read an uploaded file back:
   - GET /:id/view      → streams inline (renders in the browser: PDF/JPG/PNG)
   - GET /:id/download  → forces a download (any file type), counts as a download
   ========================================================= */

const express = require("express");
const multer = require("multer");
const path = require("path");
const { supabase, mapUserFields, mapNoteFields } = require("../data/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const ALLOWED_EXT = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
const INLINE_VIEWABLE_EXT = [".pdf", ".jpg", ".jpeg", ".png"]; // browsers can render these directly

// Multer memory storage (doesn't write files to the server disk, which is perfect for serverless Vercel)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)){
      return cb(new Error("Unsupported file type. Use PDF, DOC, DOCX, JPG, or PNG."));
    }
    cb(null, true);
  }
});

async function getCurrentUser(req){
  if (!req.session || !req.session.userId) return null;
  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", req.session.userId)
    .maybeSingle();
  return mapUserFields(dbUser);
}

// ---------- GET /api/notes — list, search, filter, sort ----------
router.get("/", async (req, res) => {
  const { q, subject, category, type, sort } = req.query;
  const currentUser = await getCurrentUser(req);
  
  let query = supabase.from("notes").select("*");

  if (subject) query = query.eq("subject", subject);
  if (category) query = query.eq("category", category);
  if (type) query = query.eq("type", type);

  if (q){
    const keyword = `%${String(q).toLowerCase()}%`;
    query = query.or(`title.ilike.${keyword},subject.ilike.${keyword},course.ilike.${keyword},category.ilike.${keyword},author_name.ilike.${keyword},description.ilike.${keyword}`);
  }

  switch (sort){
    case "popular": query = query.order("views", { ascending: false }); break;
    case "downloads": query = query.order("downloads", { ascending: false }); break;
    case "oldest": query = query.order("date", { ascending: true }); break;
    case "recent":
    default: query = query.order("date", { ascending: false });
  }

  const { data: notes, error } = await query;
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(notes.map(n => mapNoteFields(n, currentUser)));
});

// ---------- GET /api/notes/meta — distinct filter option lists ----------
router.get("/meta", async (req, res) => {
  const { data: notes, error } = await supabase.from("notes").select("subject, category, type");
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.json({
    subjects: [...new Set(notes.map(n => n.subject))].sort(),
    categories: [...new Set(notes.map(n => n.category))].sort(),
    types: [...new Set(notes.map(n => n.type))].sort()
  });
});

// ---------- GET /api/notes/:id — single note, tracks a view ----------
router.get("/:id", async (req, res, next) => {
  try{
    const { data: note, error: queryError } = await supabase
      .from("notes")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (queryError) return next(queryError);
    if (!note) return res.status(404).json({ error: "Note not found." });

    // Increment views
    const { data: updatedNote, error: updateError } = await supabase
      .from("notes")
      .update({ views: (note.views || 0) + 1 })
      .eq("id", req.params.id)
      .select()
      .single();

    if (updateError) return next(updateError);

    const currentUser = await getCurrentUser(req);
    if (currentUser){
      const recentIds = [note.id, ...currentUser.recentNoteIds.filter(id => id !== note.id)].slice(0, 8);
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ recent_note_ids: recentIds })
        .eq("id", currentUser.id);

      if (userUpdateError) return next(userUpdateError);
      currentUser.recentNoteIds = recentIds;
    }

    res.json(mapNoteFields(updatedNote, currentUser));
  }catch(err){ next(err); }
});

// ---------- POST /api/notes — create a note (requires login) ----------
router.post("/", requireAuth, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { title, description, subject, course, category, type, tags } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: "Title is required." });
    if (!description || !description.trim()) return res.status(400).json({ error: "Description is required." });
    if (!subject) return res.status(400).json({ error: "Subject is required." });
    if (!category) return res.status(400).json({ error: "Category is required." });
    if (!type) return res.status(400).json({ error: "File type is required." });
    if (!req.file) return res.status(400).json({ error: "A file is required." });

    try {
      const { data: dbUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", req.session.userId)
        .single();
      
      if (userError) return res.status(400).json({ error: userError.message });
      const user = mapUserFields(dbUser);

      // Generate a unique filename and upload to Supabase Storage
      const safeExt = path.extname(req.file.originalname).toLowerCase();
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from("notes")
        .upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
          duplex: "half"
        });

      if (uploadError) {
        return res.status(500).json({ error: `File upload failed: ${uploadError.message}` });
      }

      const noteObj = {
        id: "n" + Date.now(),
        title: title.trim(),
        subject,
        course: (course || "General").trim(),
        category,
        type,
        tags: (tags || "").split(",").map(t => t.trim()).filter(Boolean),
        author_id: user.id,
        author_name: user.name,
        date: new Date().toISOString().slice(0, 10),
        views: 0,
        downloads: 0,
        description: description.trim(),
        filename: filename,
        original_name: req.file.originalname
      };

      const { error: dbError } = await supabase.from("notes").insert(noteObj);
      if (dbError) {
        // Cleanup file from storage if DB insert fails
        await supabase.storage.from("notes").remove([filename]);
        return res.status(500).json({ error: dbError.message });
      }

      res.status(201).json(mapNoteFields(noteObj, user));
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// ---------- POST /api/notes/:id/save — toggle save for current user ----------
router.post("/:id/save", requireAuth, async (req, res, next) => {
  try{
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("id")
      .eq("id", req.params.id)
      .maybeSingle();

    if (noteError) return next(noteError);
    if (!note) return res.status(404).json({ error: "Note not found." });

    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.session.userId)
      .single();

    if (userError) return next(userError);
    const user = mapUserFields(dbUser);

    const savedIds = [...user.savedNoteIds];
    const idx = savedIds.indexOf(note.id);
    if (idx > -1) {
      savedIds.splice(idx, 1);
    } else {
      savedIds.push(note.id);
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ saved_note_ids: savedIds })
      .eq("id", user.id);

    if (updateError) return next(updateError);

    res.json({ saved: savedIds.includes(note.id) });
  }catch(err){ next(err); }
});

// ---------- GET /api/notes/:id/view — stream inline so the browser renders it ----------
router.get("/:id/view", async (req, res) => {
  try {
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (noteError) return res.status(500).json({ error: noteError.message });
    if (!note) return res.status(404).json({ error: "Note not found." });
    if (!note.filename) return res.status(404).json({ error: "This is sample data — no file was ever attached." });

    const ext = path.extname(note.filename).toLowerCase();
    if (!INLINE_VIEWABLE_EXT.includes(ext)){
      return res.status(415).json({ error: "This file type can't be previewed in the browser — try Download instead." });
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("notes")
      .download(note.filename);

    if (downloadError || !fileData) {
      return res.status(404).json({ error: "File missing from storage." });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    res.setHeader("Content-Type", fileData.type || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${note.original_name || note.filename}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- GET /api/notes/:id/download — forces a real download ----------
router.get("/:id/download", async (req, res, next) => {
  try{
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (noteError) return next(noteError);
    if (!note) return res.status(404).json({ error: "Note not found." });
    if (!note.filename) return res.status(404).json({ error: "This is sample data — no file was ever attached." });

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("notes")
      .download(note.filename);

    if (downloadError || !fileData) {
      return res.status(404).json({ error: "File missing from storage." });
    }

    // Increment downloads count in database
    const { error: updateError } = await supabase
      .from("notes")
      .update({ downloads: (note.downloads || 0) + 1 })
      .eq("id", note.id);

    if (updateError) return next(updateError);

    const buffer = Buffer.from(await fileData.arrayBuffer());
    res.setHeader("Content-Type", fileData.type || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${note.original_name || note.filename}"`);
    res.send(buffer);
  }catch(err){ next(err); }
});

module.exports = router;

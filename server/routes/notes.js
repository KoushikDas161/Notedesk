/* =========================================================
   NOTES ROUTES — /api/notes/*
   Real persistence (server/data/notes.json) and real file
   storage (server/uploads/) via multer.

   Two ways to read an uploaded file back:
   - GET /:id/view      → streams inline (renders in the browser: PDF/JPG/PNG)
   - GET /:id/download  → forces a download (any file type), counts as a download
   ========================================================= */

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getNotes, saveNotes, getUsers, saveUsers } = require("../data/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const ALLOWED_EXT = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
const INLINE_VIEWABLE_EXT = [".pdf", ".jpg", ".jpeg", ".png"]; // browsers can render these directly

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB, matches the UI copy
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)){
      return cb(new Error("Unsupported file type. Use PDF, DOC, DOCX, JPG, or PNG."));
    }
    cb(null, true);
  }
});

function withSavedFlag(note, currentUser){
  return { ...note, saved: !!(currentUser && currentUser.savedNoteIds.includes(note.id)) };
}

function getCurrentUser(req){
  if (!req.session || !req.session.userId) return null;
  return getUsers().find(u => u.id === req.session.userId) || null;
}

// ---------- GET /api/notes — list, search, filter, sort ----------
router.get("/", (req, res) => {
  const { q, subject, category, type, sort } = req.query;
  const currentUser = getCurrentUser(req);
  let notes = getNotes();

  if (q){
    const keyword = String(q).toLowerCase();
    notes = notes.filter(n => {
      const haystack = [n.title, n.subject, n.course, n.category, n.authorName, n.description, ...(n.tags || [])]
        .join(" ").toLowerCase();
      return haystack.includes(keyword);
    });
  }
  if (subject) notes = notes.filter(n => n.subject === subject);
  if (category) notes = notes.filter(n => n.category === category);
  if (type) notes = notes.filter(n => n.type === type);

  switch (sort){
    case "popular": notes = [...notes].sort((a, b) => b.views - a.views); break;
    case "downloads": notes = [...notes].sort((a, b) => b.downloads - a.downloads); break;
    case "oldest": notes = [...notes].sort((a, b) => new Date(a.date) - new Date(b.date)); break;
    case "recent":
    default: notes = [...notes].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  res.json(notes.map(n => withSavedFlag(n, currentUser)));
});

// ---------- GET /api/notes/meta — distinct filter option lists ----------
router.get("/meta", (req, res) => {
  const notes = getNotes();
  res.json({
    subjects: [...new Set(notes.map(n => n.subject))].sort(),
    categories: [...new Set(notes.map(n => n.category))].sort(),
    types: [...new Set(notes.map(n => n.type))].sort()
  });
});

// ---------- GET /api/notes/:id — single note, tracks a view ----------
router.get("/:id", async (req, res, next) => {
  try{
    const notes = getNotes();
    const note = notes.find(n => n.id === req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found." });

    note.views += 1;
    await saveNotes(notes);

    const currentUser = getCurrentUser(req);
    if (currentUser){
      const users = getUsers();
      const user = users.find(u => u.id === currentUser.id);
      user.recentNoteIds = [note.id, ...user.recentNoteIds.filter(id => id !== note.id)].slice(0, 8);
      await saveUsers(users);
    }

    res.json(withSavedFlag(note, currentUser));
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

    const users = getUsers();
    const user = users.find(u => u.id === req.session.userId);

    const note = {
      id: "n" + Date.now(),
      title: title.trim(),
      subject,
      course: (course || "General").trim(),
      category,
      type,
      tags: (tags || "").split(",").map(t => t.trim()).filter(Boolean),
      authorId: user.id,
      authorName: user.name,
      date: new Date().toISOString().slice(0, 10),
      views: 0,
      downloads: 0,
      description: description.trim(),
      filename: req.file.filename,
      originalName: req.file.originalname
    };

    const notes = getNotes();
    notes.unshift(note);
    await saveNotes(notes);

    res.status(201).json(withSavedFlag(note, user));
  });
});

// ---------- POST /api/notes/:id/save — toggle save for current user ----------
router.post("/:id/save", requireAuth, async (req, res, next) => {
  try{
    const notes = getNotes();
    const note = notes.find(n => n.id === req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found." });

    const users = getUsers();
    const user = users.find(u => u.id === req.session.userId);
    const idx = user.savedNoteIds.indexOf(note.id);
    if (idx > -1) user.savedNoteIds.splice(idx, 1);
    else user.savedNoteIds.push(note.id);
    await saveUsers(users);

    res.json({ saved: user.savedNoteIds.includes(note.id) });
  }catch(err){ next(err); }
});

// ---------- GET /api/notes/:id/view — stream inline so the browser renders it ----------
router.get("/:id/view", (req, res) => {
  const notes = getNotes();
  const note = notes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ error: "Note not found." });
  if (!note.filename) return res.status(404).json({ error: "This is sample data — no file was ever attached." });

  const ext = path.extname(note.filename).toLowerCase();
  if (!INLINE_VIEWABLE_EXT.includes(ext)){
    return res.status(415).json({ error: "This file type can't be previewed in the browser — try Download instead." });
  }

  const filePath = path.join(UPLOAD_DIR, note.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File missing from storage." });

  res.setHeader("Content-Disposition", `inline; filename="${note.originalName || note.filename}"`);
  res.sendFile(filePath);
});

// ---------- GET /api/notes/:id/download — forces a real download ----------
router.get("/:id/download", async (req, res, next) => {
  try{
    const notes = getNotes();
    const note = notes.find(n => n.id === req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found." });
    if (!note.filename) return res.status(404).json({ error: "This is sample data — no file was ever attached." });

    const filePath = path.join(UPLOAD_DIR, note.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File missing from storage." });

    note.downloads += 1;
    await saveNotes(notes);

    res.download(filePath, note.originalName || note.filename);
  }catch(err){ next(err); }
});

module.exports = router;

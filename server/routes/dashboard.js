/* =========================================================
   DASHBOARD ROUTE — /api/dashboard
   Aggregates a logged-in user's uploads, saves, recently
   viewed, and subject-overlap recommendations server-side.
   ========================================================= */

const express = require("express");
const { getNotes, getUsers } = require("../data/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  const notes = getNotes();
  const users = getUsers();
  const user = users.find(u => u.id === req.session.userId);

  const uploaded = notes.filter(n => n.authorId === user.id);
  const saved = user.savedNoteIds.map(id => notes.find(n => n.id === id)).filter(Boolean);
  const recent = user.recentNoteIds.map(id => notes.find(n => n.id === id)).filter(Boolean);

  const interestSubjects = [...new Set([...saved, ...recent].map(n => n.subject))];
  const excludeIds = new Set([...saved.map(n => n.id), ...uploaded.map(n => n.id)]);
  let recommended = notes.filter(n => interestSubjects.includes(n.subject) && !excludeIds.has(n.id));
  if (!recommended.length){
    recommended = [...notes].sort((a, b) => b.views - a.views).slice(0, 4);
  }
  recommended = recommended.slice(0, 4);

  const withSaved = (list) => list.map(n => ({ ...n, saved: user.savedNoteIds.includes(n.id) }));

  res.json({
    stats: {
      uploads: uploaded.length,
      saved: saved.length,
      recent: recent.length,
      viewsOnUploads: uploaded.reduce((sum, n) => sum + (n.views || 0), 0)
    },
    uploaded: withSaved(uploaded),
    saved: withSaved(saved),
    recent: withSaved(recent),
    recommended: withSaved(recommended)
  });
});

module.exports = router;

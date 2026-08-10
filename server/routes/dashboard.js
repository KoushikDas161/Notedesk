/* =========================================================
   DASHBOARD ROUTE — /api/dashboard
   Aggregates a logged-in user's uploads, saves, recently
   viewed, and subject-overlap recommendations server-side.
   ========================================================= */

const express = require("express");
const { supabase, mapUserFields, mapNoteFields } = require("../data/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.session.userId)
      .single();

    if (userError) return next(userError);
    const user = mapUserFields(dbUser);

    // Fetch uploads
    const { data: uploadedDb, error: uploadsError } = await supabase
      .from("notes")
      .select("*")
      .eq("author_id", user.id);

    if (uploadsError) return next(uploadsError);
    const uploaded = (uploadedDb || []).map(n => mapNoteFields(n, user));

    // Fetch saved notes (handle empty array gracefully)
    let savedDb = [];
    if (user.savedNoteIds && user.savedNoteIds.length) {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .in("id", user.savedNoteIds);
      if (error) return next(error);
      savedDb = data || [];
    }
    const saved = (savedDb || []).map(n => mapNoteFields(n, user));

    // Fetch recently viewed (handle empty array gracefully, preserve order)
    let recentDb = [];
    if (user.recentNoteIds && user.recentNoteIds.length) {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .in("id", user.recentNoteIds);
      if (error) return next(error);
      recentDb = data || [];
    }
    const recentMapped = user.recentNoteIds
      .map(id => recentDb.find(n => n.id === id))
      .filter(Boolean)
      .map(n => mapNoteFields(n, user));

    // Recommendations
    const interestSubjects = [...new Set([...saved, ...recentMapped].map(n => n.subject))];
    const excludeIds = new Set([...saved.map(n => n.id), ...uploaded.map(n => n.id)]);
    
    let recommendedDb = [];
    if (interestSubjects.length) {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .in("subject", interestSubjects);
      if (error) return next(error);
      recommendedDb = data || [];
    }

    let recommended = recommendedDb
      .filter(n => !excludeIds.has(n.id))
      .slice(0, 4)
      .map(n => mapNoteFields(n, user));

    if (!recommended.length) {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("views", { ascending: false })
        .limit(4);
      if (error) return next(error);
      recommended = (data || []).map(n => mapNoteFields(n, user));
    }

    res.json({
      stats: {
        uploads: uploaded.length,
        saved: saved.length,
        recent: recentMapped.length,
        viewsOnUploads: uploaded.reduce((sum, n) => sum + (n.views || 0), 0)
      },
      uploaded,
      saved,
      recent: recentMapped,
      recommended
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

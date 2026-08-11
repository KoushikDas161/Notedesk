/* =========================================================
   SERVER.JS — app entry point
   Serves the frontend from /public and exposes the JSON API
   under /api/*. Run with: npm start (see README for setup).
   ========================================================= */

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./server/routes/auth");
const noteRoutes = require("./server/routes/notes");
const dashboardRoutes = require("./server/routes/dashboard");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(express.urlencoded({ extended: true }));

app.use(session({
  name: "notedesk.sid",
  secret: process.env.SESSION_SECRET || "notedesk-dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set to true only if you deploy behind HTTPS
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// ---- API routes ----
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ---- Unknown API route → JSON 404 (instead of falling through to index.html) ----
app.use("/api", (req, res) => {
  res.status(404).json({ error: "No such API route." });
});

// ---- Static frontend ----
app.use(express.static(path.join(__dirname, "public")));

// ---- Global error handler — always returns JSON for /api/*, never crashes the process ----
app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith("/api")){
    return res.status(err.status || 500).json({ error: err.message || "Something went wrong." });
  }
  res.status(err.status || 500).send("Something went wrong.");
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`NoteDesk server running at http://localhost:${PORT}`);
    console.log(`Open that exact URL in your browser — opening the HTML files directly will not work.`);
  });
}

module.exports = app;

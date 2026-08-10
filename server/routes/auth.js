/* =========================================================
   AUTH ROUTES — /api/auth/*
   Real password hashing (bcrypt) and real cookie sessions.
   ========================================================= */

const express = require("express");
const bcrypt = require("bcryptjs");
const { getUsers, saveUsers } = require("../data/db");

const router = express.Router();

function sanitizeUser(user){
  const { passwordHash, ...safe } = user;
  return safe;
}

router.post("/register", async (req, res, next) => {
  try{
    const { name, email, password } = req.body || {};

    if (!name || !name.trim()) return res.status(400).json({ error: "Name is required." });
    if (!email || !/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: "A valid email is required." });
    if (!password || password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });

    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())){
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: "u" + Date.now(),
      name: name.trim(),
      email: email.trim(),
      passwordHash,
      savedNoteIds: [],
      recentNoteIds: [],
      createdAt: new Date().toISOString()
    };

    users.push(user);
    await saveUsers(users);

    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) return next(err);
      res.status(201).json(sanitizeUser(user));
    });
  }catch(err){
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try{
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === (email || "").toLowerCase());
    if (!user) return res.status(401).json({ error: "No account found with that email." });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: "Incorrect password." });

    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) return next(err);
      res.json(sanitizeUser(user));
    });
  }catch(err){
    next(err);
  }
});

router.post("/logout", (req, res, next) => {
  if (!req.session) return res.json({ ok: true });
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/me", (req, res) => {
  if (!req.session || !req.session.userId) return res.json(null);
  const users = getUsers();
  const user = users.find(u => u.id === req.session.userId);
  if (!user){
    req.session.destroy(() => {});
    return res.json(null);
  }
  res.json(sanitizeUser(user));
});

module.exports = router;

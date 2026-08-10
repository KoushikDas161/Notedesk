/* =========================================================
   DB.JS — minimal file-based persistence layer
   Stands in for a real database (Postgres/Mongo/etc). Every
   function here has a name that maps 1:1 to what a real ORM
   call would look like, so swapping this out later is a
   matter of changing this one file, not the routes.
   ========================================================= */

const fs = require("fs");
const path = require("path");

const NOTES_FILE = path.join(__dirname, "notes.json");
const USERS_FILE = path.join(__dirname, "users.json");

let writeChain = Promise.resolve();
function queueWrite(fn){
  writeChain = writeChain.then(fn, fn);
  return writeChain;
}

function readJSON(file){
  const raw = fs.readFileSync(file, "utf-8");
  return raw.trim() ? JSON.parse(raw) : [];
}

function writeJSON(file, data){
  return queueWrite(() =>
    fs.promises.writeFile(file, JSON.stringify(data, null, 2), "utf-8")
  );
}

function getNotes(){ return readJSON(NOTES_FILE); }
async function saveNotes(notes){ await writeJSON(NOTES_FILE, notes); }

function getUsers(){ return readJSON(USERS_FILE); }
async function saveUsers(users){ await writeJSON(USERS_FILE, users); }

module.exports = { getNotes, saveNotes, getUsers, saveUsers };

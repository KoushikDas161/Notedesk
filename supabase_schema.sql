-- =========================================================
-- NoteDesk Database Schema and Seed Data
-- Run this script in the Supabase SQL Editor.
-- =========================================================

-- Clean up existing tables (optional, warning: deletes existing data)
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  saved_note_ids TEXT[] DEFAULT '{}',
  recent_note_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Create notes table
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  course TEXT DEFAULT 'General',
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT,
  date TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  description TEXT NOT NULL,
  filename TEXT,
  original_name TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Note: Since the Node.js backend connects using the service_role key,
-- it will bypass RLS. These policies are for future client-side direct access.
CREATE POLICY "Allow public read access to notes" ON notes FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access to users" ON users FOR SELECT TO public USING (true);

-- Seed notes data
INSERT INTO notes (id, title, subject, course, category, type, tags, author_id, author_name, date, views, downloads, description, filename, original_name) VALUES (
  'n001',
  'Data Structures — Trees & Graphs Cheat Sheet',
  'Computer Science',
  'CS201',
  'Exam Prep',
  'PDF',
  ARRAY['data-structures', 'trees', 'graphs', 'algorithms'],
  NULL,
  'Maya Chen',
  '2026-06-28',
  1242,
  412,
  'Concise diagrams and complexity tables for BSTs, heaps, tries, and common graph traversal algorithms (BFS/DFS/Dijkstra).',
  NULL,
  NULL
);
INSERT INTO notes (id, title, subject, course, category, type, tags, author_id, author_name, date, views, downloads, description, filename, original_name) VALUES (
  'n002',
  'Machine Learning — Gradient Descent Explained',
  'Computer Science',
  'CS404',
  'Lecture Notes',
  'Slides',
  ARRAY['machine-learning', 'gradient-descent', 'cost-function'],
  NULL,
  'Rahim Uddin',
  '2026-07-01',
  981,
  301,
  'Step-by-step derivation of gradient descent for linear regression, with worked cost-function examples and plots.',
  NULL,
  NULL
);
INSERT INTO notes (id, title, subject, course, category, type, tags, author_id, author_name, date, views, downloads, description, filename, original_name) VALUES (
  'n003',
  'Physics — Simple Harmonic Motion Summary',
  'Physics',
  'PHY102',
  'Exam Prep',
  'Handwritten',
  ARRAY['shm', 'oscillation', 'waves'],
  NULL,
  'Farah Islam',
  '2026-05-14',
  745,
  220,
  'Handwritten summary covering restoring force, energy in SHM, and pendulum vs spring-mass comparisons.',
  NULL,
  NULL
);
INSERT INTO notes (id, title, subject, course, category, type, tags, author_id, author_name, date, views, downloads, description, filename, original_name) VALUES (
  'n004',
  'Database Systems — Final Review Pack',
  'Computer Science',
  'CS310',
  'Exam Prep',
  'PDF',
  ARRAY['database', 'sql', 'normalization', 'final'],
  NULL,
  'Tariq Rahman',
  '2026-06-02',
  1523,
  588,
  'Normal forms, ER-to-relational mapping, transaction isolation levels, and 30 practice SQL queries with answers.',
  NULL,
  NULL
);
INSERT INTO notes (id, title, subject, course, category, type, tags, author_id, author_name, date, views, downloads, description, filename, original_name) VALUES (
  'n005',
  'Organic Chemistry — Reaction Mechanisms',
  'Chemistry',
  'CHM220',
  'Lecture Notes',
  'PDF',
  ARRAY['organic-chemistry', 'mechanisms', 'SN1', 'SN2'],
  NULL,
  'Nusrat Jahan',
  '2026-04-20',
  610,
  175,
  'Arrow-pushing diagrams for SN1, SN2, elimination reactions with rate-determining step notes.',
  NULL,
  NULL
);
INSERT INTO notes (id, title, subject, course, category, type, tags, author_id, author_name, date, views, downloads, description, filename, original_name) VALUES (
  'n006',
  'Macroeconomics — Fiscal Policy Notes',
  'Economics',
  'ECO101',
  'Lecture Notes',
  'Doc',
  ARRAY['macroeconomics', 'fiscal-policy', 'gdp'],
  NULL,
  'Imran Kabir',
  '2026-03-30',
  402,
  98,
  'Government spending, taxation, multiplier effects, and IS-LM model walkthrough with graphs.',
  NULL,
  NULL
);
INSERT INTO notes (id, title, subject, course, category, type, tags, author_id, author_name, date, views, downloads, description, filename, original_name) VALUES (
  'n007',
  'Linear Algebra — Eigenvalues & Eigenvectors',
  'Mathematics',
  'MTH205',
  'Lecture Notes',
  'Handwritten',
  ARRAY['linear-algebra', 'eigenvalues', 'matrices'],
  NULL,
  'Maya Chen',
  '2026-07-05',
  864,
  260,
  'Diagonalization, characteristic polynomials, and applications to systems of differential equations.',
  NULL,
  NULL
);
INSERT INTO notes (id, title, subject, course, category, type, tags, author_id, author_name, date, views, downloads, description, filename, original_name) VALUES (
  'n008',
  'Operating Systems — Semaphores & Deadlock',
  'Computer Science',
  'CS330',
  'Assignment Help',
  'PDF',
  ARRAY['operating-systems', 'semaphores', 'deadlock', 'concurrency'],
  NULL,
  'Rahim Uddin',
  '2026-06-18',
  690,
  210,
  'Readers-Writers and Dining Philosophers solutions with semaphore code and deadlock-avoidance discussion.',
  NULL,
  NULL
);
INSERT INTO notes (id, title, subject, course, category, type, tags, author_id, author_name, date, views, downloads, description, filename, original_name) VALUES (
  'n009',
  'Cell Biology — Mitosis vs Meiosis',
  'Biology',
  'BIO110',
  'Exam Prep',
  'Slides',
  ARRAY['biology', 'mitosis', 'meiosis', 'cell-division'],
  NULL,
  'Farah Islam',
  '2026-02-11',
  530,
  140,
  'Side-by-side phase comparison, chromosome counts, and common exam diagram labels.',
  NULL,
  NULL
);
INSERT INTO notes (id, title, subject, course, category, type, tags, author_id, author_name, date, views, downloads, description, filename, original_name) VALUES (
  'n010',
  'World History — Causes of WWI Timeline',
  'History',
  'HIS150',
  'Lecture Notes',
  'Doc',
  ARRAY['history', 'wwi', 'timeline'],
  NULL,
  'Tariq Rahman',
  '2026-01-25',
  315,
  77,
  'Alliance system, militarism, nationalism, and the July Crisis laid out as an annotated timeline.',
  NULL,
  NULL
);
INSERT INTO notes (id, title, subject, course, category, type, tags, author_id, author_name, date, views, downloads, description, filename, original_name) VALUES (
  'n011',
  'Statistics — Hypothesis Testing Quick Guide',
  'Mathematics',
  'MTH220',
  'Exam Prep',
  'PDF',
  ARRAY['statistics', 'hypothesis-testing', 'p-value'],
  NULL,
  'Nusrat Jahan',
  '2026-06-09',
  1105,
  390,
  'Null vs alternative hypotheses, choosing a test, and reading p-values without the jargon.',
  NULL,
  NULL
);
INSERT INTO notes (id, title, subject, course, category, type, tags, author_id, author_name, date, views, downloads, description, filename, original_name) VALUES (
  'n012',
  'English Literature — Poetry Devices Glossary',
  'Literature',
  'ENG104',
  'Assignment Help',
  'Handwritten',
  ARRAY['literature', 'poetry', 'literary-devices'],
  NULL,
  'Imran Kabir',
  '2026-05-02',
  260,
  64,
  'Metaphor, enjambment, caesura, and volta — defined with short annotated poem excerpts.',
  NULL,
  NULL
);

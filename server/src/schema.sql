-- Alef Future public site — schema
-- Run via `npm run migrate`. Safe to re-run (IF NOT EXISTS everywhere).

CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registrations (
  id                 SERIAL PRIMARY KEY,
  student_name       TEXT NOT NULL,
  student_dob        DATE,
  student_stage      TEXT,
  parent_name        TEXT NOT NULL,
  parent_email       TEXT NOT NULL,
  parent_phone       TEXT NOT NULL,
  parent_relation    TEXT,
  school_name        TEXT,
  prior_assessment   TEXT,
  status             TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'enrolled')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id          SERIAL PRIMARY KEY,
  school_name TEXT NOT NULL,
  phone       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single-row key/value store for editable site copy (hero text, stats, contact info).
CREATE TABLE IF NOT EXISTS site_content (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- express-session's connect-pg-simple store creates its own "session" table
-- automatically on first connect, so it isn't declared here.

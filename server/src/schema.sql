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

-- CMS collections rendered on the public site. All start empty — the admin
-- panel is how real content gets in, never seeded/fake rows.
CREATE TABLE IF NOT EXISTS testimonials (
  id            SERIAL PRIMARY KEY,
  quote         TEXT NOT NULL,
  author_name   TEXT NOT NULL,
  author_role   TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  role          TEXT,
  photo_url     TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  event_date    DATE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gallery_items (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  image_url     TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_clips (
  id             SERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT,
  video_url      TEXT,
  duration_label TEXT,
  display_order  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- express-session's connect-pg-simple store creates its own "session" table
-- automatically on first connect, so it isn't declared here.

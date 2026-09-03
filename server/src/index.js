require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./db');

const authRoutes = require('./routes/auth');
const registrationsRoutes = require('./routes/registrations');
const leadsRoutes = require('./routes/leads');
const contentRoutes = require('./routes/content');

const app = express();
const PORT = process.env.PORT || 5522;
const SITE_ROOT = path.join(__dirname, '..', '..'); // public-site/

app.use(express.json());

// Container/Coolify healthcheck — no auth, no DB dependency.
app.get('/healthz', function (req, res) {
  res.json({ ok: true });
});

app.use(session({
  store: new pgSession({ pool: pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/content', contentRoutes);

// Serve the static public site + admin panel from the same origin —
// no CORS to configure, no separate dev server.
app.use(express.static(SITE_ROOT, { extensions: ['html'] }));

app.listen(PORT, function () {
  console.log('Alef Future server running at http://localhost:' + PORT);
});

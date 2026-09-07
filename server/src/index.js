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
const createCollectionRouter = require('./routes/collectionFactory');

const app = express();
const PORT = process.env.PORT || 5522;
const SITE_ROOT = path.join(__dirname, '..', '..'); // public-site/

// Coolify's proxy (Traefik) terminates TLS and forwards plain HTTP on the
// internal network, setting X-Forwarded-Proto. Trusting it lets Express (and
// the "secure" cookie below) correctly detect the original request was HTTPS.
app.set('trust proxy', 1);

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
    secure: 'auto', // sends Secure only when the (proxied) request was HTTPS
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/content', contentRoutes);

// CMS collections rendered on the public site — see collectionFactory.js.
app.use('/api/testimonials', createCollectionRouter('testimonials', ['quote', 'author_name', 'author_role']));
app.use('/api/team', createCollectionRouter('team_members', ['name', 'role', 'photo_url']));
app.use('/api/events', createCollectionRouter('events', ['title', 'description', 'event_date']));
app.use('/api/gallery', createCollectionRouter('gallery_items', ['title', 'image_url']));
app.use('/api/clips', createCollectionRouter('video_clips', ['title', 'description', 'video_url', 'duration_label']));

// Serve the static public site + admin panel from the same origin —
// no CORS to configure, no separate dev server.
app.use(express.static(SITE_ROOT, { extensions: ['html'] }));

app.listen(PORT, function () {
  console.log('Alef Future server running at http://localhost:' + PORT);
});

const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Public: the site pages fetch this on load to render admin-edited copy.
router.get('/', async function (req, res) {
  var result = await pool.query('SELECT key, value FROM site_content');
  var content = {};
  result.rows.forEach(function (row) { content[row.key] = row.value; });
  res.json(content);
});

// Admin-only: save edited fields.
router.put('/', requireAuth, async function (req, res) {
  var updates = req.body || {};
  var client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (var key in updates) {
      await client.query(
        `INSERT INTO site_content (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, updates[key]]
      );
    }
    await client.query('COMMIT');
    var result = await client.query('SELECT key, value FROM site_content');
    var content = {};
    result.rows.forEach(function (row) { content[row.key] = row.value; });
    res.json(content);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'تعذر حفظ التغييرات' });
  } finally {
    client.release();
  }
});

module.exports = router;

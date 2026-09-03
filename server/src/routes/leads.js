const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

function toClient(row) {
  return {
    id: row.id,
    schoolName: row.school_name,
    phone: row.phone,
    status: row.status,
    createdAt: row.created_at
  };
}

// Public: the homepage's quick contact form posts here — no auth required.
router.post('/', async function (req, res) {
  var b = req.body || {};
  if (!b.schoolName || !b.phone) {
    return res.status(400).json({ error: 'اسم المدرسة ورقم الجوال مطلوبان' });
  }
  try {
    var result = await pool.query(
      'INSERT INTO leads (school_name, phone) VALUES ($1, $2) RETURNING *',
      [b.schoolName, b.phone]
    );
    res.status(201).json(toClient(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'تعذر إرسال الطلب' });
  }
});

// Admin-only from here down.
router.get('/', requireAuth, async function (req, res) {
  var result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
  res.json(result.rows.map(toClient));
});

router.patch('/:id', requireAuth, async function (req, res) {
  var status = req.body.status;
  if (!['new', 'contacted', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'حالة غير صالحة' });
  }
  var result = await pool.query(
    'UPDATE leads SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'غير موجود' });
  res.json(toClient(result.rows[0]));
});

router.delete('/:id', requireAuth, async function (req, res) {
  await pool.query('DELETE FROM leads WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;

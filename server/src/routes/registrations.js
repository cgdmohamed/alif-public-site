const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

function toClient(row) {
  return {
    id: row.id,
    studentName: row.student_name,
    studentDob: row.student_dob,
    studentStage: row.student_stage,
    parentName: row.parent_name,
    parentEmail: row.parent_email,
    parentPhone: row.parent_phone,
    parentRelation: row.parent_relation,
    schoolName: row.school_name,
    priorAssessment: row.prior_assessment,
    status: row.status,
    createdAt: row.created_at
  };
}

// Public: the site's registration wizard posts here — no auth required.
router.post('/', async function (req, res) {
  var b = req.body || {};
  if (!b.studentName || !b.parentName || !b.parentEmail || !b.parentPhone) {
    return res.status(400).json({ error: 'الحقول الأساسية مطلوبة' });
  }
  try {
    var result = await pool.query(
      `INSERT INTO registrations
        (student_name, student_dob, student_stage, parent_name, parent_email, parent_phone, parent_relation, school_name, prior_assessment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        b.studentName, b.studentDob || null, b.studentStage || null,
        b.parentName, b.parentEmail, b.parentPhone, b.parentRelation || null,
        b.schoolName || null, b.priorAssessment || null
      ]
    );
    res.status(201).json(toClient(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'تعذر إرسال الطلب' });
  }
});

// Admin-only from here down.
router.get('/', requireAuth, async function (req, res) {
  var result = await pool.query('SELECT * FROM registrations ORDER BY created_at DESC');
  res.json(result.rows.map(toClient));
});

router.patch('/:id', requireAuth, async function (req, res) {
  var status = req.body.status;
  if (!['new', 'contacted', 'enrolled'].includes(status)) {
    return res.status(400).json({ error: 'حالة غير صالحة' });
  }
  var result = await pool.query(
    'UPDATE registrations SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'غير موجود' });
  res.json(toClient(result.rows[0]));
});

router.delete('/:id', requireAuth, async function (req, res) {
  await pool.query('DELETE FROM registrations WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;

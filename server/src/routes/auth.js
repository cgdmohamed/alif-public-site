const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');

const router = express.Router();

router.post('/login', async function (req, res) {
  var email = (req.body.email || '').trim().toLowerCase();
  var password = req.body.password || '';
  if (!email || !password) {
    return res.status(400).json({ error: 'البريد الإلكتروني وكلمة السر مطلوبان' });
  }

  try {
    var result = await pool.query('SELECT id, email, password_hash FROM admin_users WHERE email = $1', [email]);
    var user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة السر غير صحيحة' });
    }
    var ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة السر غير صحيحة' });
    }
    req.session.adminId = user.id;
    req.session.adminEmail = user.email;
    res.json({ email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

router.post('/logout', function (req, res) {
  req.session.destroy(function () {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

router.get('/me', function (req, res) {
  if (req.session && req.session.adminId) {
    return res.json({ email: req.session.adminEmail });
  }
  res.status(401).json({ error: 'Not authenticated' });
});

module.exports = router;

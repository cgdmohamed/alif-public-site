const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');

function toCamel(snake) {
  return snake.replace(/_([a-z])/g, function (_, c) { return c.toUpperCase(); });
}

// Builds a public-read / admin-write CRUD router for a simple ordered
// collection table (id, <fields...>, display_order, created_at). `table`
// and `fields` are always fixed values from the mount call below — never
// request input — so interpolating them into SQL here is safe.
module.exports = function createCollectionRouter(table, fields) {
  var router = express.Router();

  function toClient(row) {
    var out = { id: row.id, displayOrder: row.display_order, createdAt: row.created_at };
    fields.forEach(function (f) { out[toCamel(f)] = row[f]; });
    return out;
  }

  router.get('/', async function (req, res) {
    var result = await pool.query('SELECT * FROM ' + table + ' ORDER BY display_order ASC, created_at ASC');
    res.json(result.rows.map(toClient));
  });

  router.get('/:id', async function (req, res) {
    var result = await pool.query('SELECT * FROM ' + table + ' WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'غير موجود' });
    res.json(toClient(result.rows[0]));
  });

  router.post('/', requireAuth, async function (req, res) {
    var b = req.body || {};
    if (!b[toCamel(fields[0])]) {
      return res.status(400).json({ error: 'الحقل الأول مطلوب' });
    }
    var cols = fields.slice();
    var values = fields.map(function (f) { return b[toCamel(f)] != null ? b[toCamel(f)] : null; });

    var orderResult = await pool.query('SELECT COALESCE(MAX(display_order), -1) + 1 AS next FROM ' + table);
    cols.push('display_order');
    values.push(orderResult.rows[0].next);

    var placeholders = cols.map(function (_, i) { return '$' + (i + 1); });
    var sql = 'INSERT INTO ' + table + ' (' + cols.join(', ') + ') VALUES (' + placeholders.join(', ') + ') RETURNING *';
    try {
      var result = await pool.query(sql, values);
      res.status(201).json(toClient(result.rows[0]));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'تعذر الإضافة' });
    }
  });

  router.patch('/:id', requireAuth, async function (req, res) {
    var b = req.body || {};
    var editable = fields.concat(['display_order']);
    var cols = editable.filter(function (f) {
      var key = f === 'display_order' ? 'displayOrder' : toCamel(f);
      return b[key] !== undefined;
    });
    if (cols.length === 0) return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });

    var values = cols.map(function (f) {
      return f === 'display_order' ? b.displayOrder : b[toCamel(f)];
    });
    var setClauses = cols.map(function (f, i) { return f + ' = $' + (i + 1); });
    values.push(req.params.id);

    var sql = 'UPDATE ' + table + ' SET ' + setClauses.join(', ') + ' WHERE id = $' + values.length + ' RETURNING *';
    try {
      var result = await pool.query(sql, values);
      if (result.rowCount === 0) return res.status(404).json({ error: 'غير موجود' });
      res.json(toClient(result.rows[0]));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'تعذر التحديث' });
    }
  });

  router.delete('/:id', requireAuth, async function (req, res) {
    await pool.query('DELETE FROM ' + table + ' WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  });

  return router;
};

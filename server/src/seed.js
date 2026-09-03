require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const DEFAULT_CONTENT = {
  heroBadge: 'شراكة معتمدة مع المدارس',
  heroTitle: 'شريك مدرستكم في اكتشاف ورعاية الطلبة الموهوبين',
  heroSubtitle: 'منصّة متكاملة تمكّن مدرستكم من تطبيق مقاييس الموهبة، وربط الطلبة بمدربين متخصصين ولقاءات مباشرة، مع تقارير أداء تصل لأولياء الأمور أولًا بأول.',
  stat1Num: '4,280+', stat1Label: 'طالب موهوب',
  stat2Num: '86', stat2Label: 'مدرسة شريكة',
  stat3Num: '312', stat3Label: 'مدرب متخصص',
  contactEmail: 'info@aleffuture.edu.sa',
  contactPhone: '+966 11 234 5678',
  contactAddress: 'الرياض، المملكة العربية السعودية'
};

async function seed() {
  var email = process.env.ADMIN_EMAIL;
  var password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before seeding.');
  }

  var existing = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
  if (existing.rowCount === 0) {
    var hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)', [email, hash]);
    console.log('Created admin user:', email);
  } else {
    console.log('Admin user already exists:', email);
  }

  for (var key in DEFAULT_CONTENT) {
    await pool.query(
      'INSERT INTO site_content (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
      [key, DEFAULT_CONTENT[key]]
    );
  }
  console.log('Default site content ensured.');

  var regCount = await pool.query('SELECT COUNT(*) FROM registrations');
  if (Number(regCount.rows[0].count) === 0) {
    await pool.query(
      `INSERT INTO registrations
        (student_name, student_dob, student_stage, parent_name, parent_email, parent_phone, parent_relation, school_name, prior_assessment, status, created_at)
       VALUES
        ('لمى عبدالله الحربي', '2015-03-02', 'الابتدائية', 'عبدالله الحربي', 'a.harbi@email.com', '0551234567', 'الأب', 'مدرسة الرياض الابتدائية', 'no', 'new', '2026-08-18'),
        ('سلطان منى القرني', '2016-07-19', 'المتوسطة', 'منى القرني', 'mona.q@email.com', '0567891234', 'الأم', 'مدارس الفيصلية', 'yes', 'contacted', '2026-08-15'),
        ('سعود فهد المالكي', '2014-11-08', 'المتوسطة', 'فهد المالكي', 'f.malki@email.com', '0509876543', 'الأب', 'مدرسة النخبة الأهلية', 'no', 'enrolled', '2026-08-10')`
    );
    console.log('Seeded sample registrations (demo data — delete anytime from the admin panel).');
  }

  var leadCount = await pool.query('SELECT COUNT(*) FROM leads');
  if (Number(leadCount.rows[0].count) === 0) {
    await pool.query(
      `INSERT INTO leads (school_name, phone, status, created_at) VALUES
        ('مدارس الرواد النموذجية', '0112223344', 'new', '2026-08-20'),
        ('مدرسة الأندلس الابتدائية', '0556677889', 'contacted', '2026-08-12')`
    );
    console.log('Seeded sample leads (demo data — delete anytime from the admin panel).');
  }

  await pool.end();
}

seed().catch(function (err) {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

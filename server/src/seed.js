require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

// Only label copy and real contact details are seeded. Numeric stats
// (student/school/trainer counts, results %) are intentionally left unset —
// the admin panel is where real figures get entered before launch; nothing
// fabricated ships by default.
const DEFAULT_CONTENT = {
  heroBadge: 'شراكة معتمدة مع المدارس',
  heroTitle: 'شريك مدرستكم في اكتشاف ورعاية الطلبة الموهوبين',
  heroSubtitle: 'منصّة متكاملة تمكّن مدرستكم من تطبيق مقاييس الموهبة، وربط الطلبة بمدربين متخصصين ولقاءات مباشرة، مع تقارير أداء تصل لأولياء الأمور أولًا بأول.',
  stat1Label: 'طالب موهوب',
  stat2Label: 'مدرسة شريكة',
  stat3Label: 'مدرب متخصص',
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

  await pool.end();
}

seed().catch(function (err) {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function seed() {
  console.log('[Seed] Starting database check and seeding...');

  try {
    // Generate actual bcrypt hash for Student@123 and Admin@123
    const salt = await bcrypt.genSalt(10);
    const studentHash = await bcrypt.hash('Student@123', salt);
    const adminHash = await bcrypt.hash('Admin@123', salt);

    // Update seed users passwords with valid bcrypt hash
    await db.query('UPDATE users SET password_hash = ? WHERE role = ?', [studentHash, 'student']);
    await db.query('UPDATE users SET password_hash = ? WHERE role = ?', [adminHash, 'admin']);

    const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
    const [prodCount] = await db.query('SELECT COUNT(*) as count FROM products');

    console.log(`[Seed] Completed! Users: ${userCount[0].count}, Products: ${prodCount[0].count}`);
    console.log('[Seed] Admin login: admin@campuscart.edu / Admin@123');
    console.log('[Seed] Student logins: aarav.sharma@campus.edu / Student@123, priya.patel@campus.edu / Student@123');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  }
}

seed();

// Give a mobile number an active subscription directly in the database
// (test / staff / complimentary accounts — no payment row is created).
//
//   npm run sub:grant -- <mobile> [days] [planId]     default: 3650 days, most expensive active plan
//   npm run sub:revoke -- <mobile>                    cancel that number's active subscription
//
// Reads DB_* from the environment, .env.local or .env (existing env wins).
import { existsSync, readFileSync } from 'node:fs';
import pg from 'pg';

for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const [cmd, rawMobile, rawDays, rawPlan] = process.argv.slice(2);
const mobile = String(rawMobile ?? '').replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');

if (!['grant', 'revoke'].includes(cmd) || !/^[6-9]\d{9}$/.test(mobile)) {
  console.error('Usage:\n  npm run sub:grant -- <10-digit mobile> [days=3650] [planId]\n  npm run sub:revoke -- <10-digit mobile>');
  process.exit(1);
}

const days = rawDays === undefined ? 3650 : Number(rawDays);
if (!Number.isInteger(days) || days < 1 || days > 36500) {
  console.error('✗ days must be a whole number between 1 and 36500');
  process.exit(1);
}

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

try {
  await client.connect();
  await client.query('BEGIN');

  if (cmd === 'revoke') {
    const r = await client.query(
      `UPDATE subscriptions s SET status = 'cancelled'
       FROM users u WHERE u.id = s.user_id AND u.mobile = $1 AND s.status = 'active'`,
      [mobile],
    );
    await client.query('COMMIT');
    console.log(r.rowCount ? `✓ Cancelled ${r.rowCount} active subscription(s) for ${mobile}` : `• ${mobile} had no active subscription`);
  } else {
    const planRes = rawPlan
      ? await client.query('SELECT id, name, price FROM plans WHERE id = $1', [Number(rawPlan)])
      : await client.query('SELECT id, name, price FROM plans WHERE is_active ORDER BY price DESC LIMIT 1');
    if (!planRes.rows.length) throw new Error(rawPlan ? `Plan ${rawPlan} not found` : 'No active plans — run npm run db:setup first');
    const plan = planRes.rows[0];

    const user = (
      await client.query(
        `INSERT INTO users (mobile) VALUES ($1)
         ON CONFLICT (mobile) DO UPDATE SET updated_at = NOW(), is_active = true
         RETURNING id`,
        [mobile],
      )
    ).rows[0];

    // One active subscription per user — same rule as a real purchase.
    await client.query(`UPDATE subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'`, [user.id]);
    const sub = (
      await client.query(
        `INSERT INTO subscriptions (user_id, plan_id, end_date, status)
         VALUES ($1, $2, NOW() + make_interval(days => $3), 'active')
         RETURNING end_date`,
        [user.id, plan.id, days],
      )
    ).rows[0];
    await client.query('COMMIT');

    const end = new Date(sub.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    console.log(`✓ ${mobile} → ${plan.name} active until ${end} (${days} days)`);
    console.log('  The user may need to log out and back in (or reload) to pick it up.');
  }
} catch (err) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('✗', err.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}

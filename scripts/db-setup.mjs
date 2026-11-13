// Applies src/lib/schema.sql (idempotent). Usage: npm run db:setup
// Reads DB_* from the environment, .env.local or .env (existing env wins).
import { readFile } from 'node:fs/promises';
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

const missing = ['DB_NAME', 'DB_USER'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`✗ ${missing.join(', ')} not set.`);
  console.error('  Create .env.local in the project folder (cp .env.example .env.local),');
  console.error('  fill in DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, then run: npm run db:setup');
  process.exit(1);
}
console.log(`→ Connecting to ${process.env.DB_USER}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`);

const sql = await readFile(new URL('../src/lib/schema.sql', import.meta.url), 'utf8');
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
  await client.query(sql);
  const { rows } = await client.query('SELECT id, name, price, duration_days FROM plans WHERE is_active ORDER BY price');
  console.log('✓ Schema applied. Active plans:');
  console.table(rows);
} catch (err) {
  console.error('✗ Schema setup failed:', err.message);
  if (err.code === '3D000') console.error(`  Create it first: createdb ${process.env.DB_NAME}`);
  if (err.code === '28P01' || err.code === '28000') console.error('  Check DB_USER / DB_PASSWORD in .env.local');
  if (err.code === 'ECONNREFUSED') console.error('  PostgreSQL is not running (macOS: brew services start postgresql@16)');
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}

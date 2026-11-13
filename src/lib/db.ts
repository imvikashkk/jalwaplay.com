import { Pool } from 'pg';

// Re-use a single pool across hot reloads in development.
const globalForPg = globalThis as unknown as { __jpPgPool?: Pool };

const pool =
  globalForPg.__jpPgPool ??
  new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') globalForPg.__jpPgPool = pool;

export default pool;

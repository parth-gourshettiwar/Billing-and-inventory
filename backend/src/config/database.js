const { Pool } = require('pg');

/**
 * Neon PostgreSQL is a serverless DB. Connections are:
 *  - Rate-limited on free tier
 *  - Subject to cold-start latency
 *  - Dropped after a short idle period
 *
 * Pool settings below are tuned for Neon's free tier behaviour.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // SSL is always required for Neon
  ssl: { rejectUnauthorized: false },

  // ── Connection pool sizing ─────────────────────────────────────────
  max: 5,               // Keep low — Neon free tier limit is 10
  min: 0,               // Don't pre-create connections (cold-start friendly)

  // ── Timeouts ───────────────────────────────────────────────────────
  connectionTimeoutMillis: 10000,   // Wait up to 10s to acquire a connection
  idleTimeoutMillis:       30000,   // Release idle connections after 30s
  query_timeout:           25000,   // Kill queries that run > 25s

  // ── Keep-alive ─────────────────────────────────────────────────────
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Log pool-level errors (prevents unhandled rejections crashing the server)
pool.on('error', (err) => {
  console.error('⚠️  PostgreSQL pool error:', err.message);
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    // Uncomment to debug connection churn:
    // console.log('🔌 New DB connection established');
  }
});

/**
 * query — Run a SQL query with automatic retry on connection timeouts.
 *
 * Neon occasionally drops idle connections. A single retry covers the
 * vast majority of transient "Connection terminated" errors without
 * requiring complex circuit-breaker logic.
 */
async function query(text, params, retries = 1) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    const isTimeout =
      err.message?.includes('timeout') ||
      err.message?.includes('Connection terminated') ||
      err.code === 'ECONNRESET' ||
      err.code === 'ECONNREFUSED' ||
      err.code === 'ETIMEDOUT';

    if (isTimeout && retries > 0) {
      console.warn(`⚡ DB connection hiccup — retrying query... (${retries} attempt(s) left)`);
      // Brief pause before retrying so the pool can recover
      await new Promise((r) => setTimeout(r, 500));
      return query(text, params, retries - 1);
    }
    throw err;
  }
}

/**
 * getClient — Acquire a dedicated client for transactions.
 * Wraps the pool.connect() in a retry loop for the same reason above.
 */
async function getClient(retries = 2) {
  try {
    return await pool.connect();
  } catch (err) {
    const isTimeout =
      err.message?.includes('timeout') ||
      err.message?.includes('Connection terminated') ||
      err.code === 'ECONNRESET' ||
      err.code === 'ECONNREFUSED';

    if (isTimeout && retries > 0) {
      console.warn(`⚡ DB client connect hiccup — retrying... (${retries} attempt(s) left)`);
      await new Promise((r) => setTimeout(r, 800));
      return getClient(retries - 1);
    }
    throw err;
  }
}

/**
 * testConnection — Called once at server startup to verify DB is reachable.
 */
async function testConnection() {
  try {
    const res = await query('SELECT NOW() AS now');
    console.log(`✅ Database connected — server time: ${res.rows[0].now}`);
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
}

module.exports = { pool, query, getClient, testConnection };

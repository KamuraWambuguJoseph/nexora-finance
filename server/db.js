import pg from 'pg'
import 'dotenv/config'

// Neon (and most hosted Postgres) require SSL. Local Postgres does not.
// Detect hosted connections by host and enable SSL accordingly.
let connectionString = process.env.DATABASE_URL || ''

// Neon requires SSL; the `channel_binding=require` param in the URL is not
// supported by node-pg and causes silent failures — strip it.
connectionString = connectionString.replace(/&?channel_binding=\w+/gi, '')

if (!connectionString) {
  console.error('FATAL: DATABASE_URL is not set. Set it in your environment variables.')
}

const isHosted = /neon\.tech|supabase\.co|render\.com|amazonaws\.com|aws\.neon/i.test(connectionString)

const pool = new pg.Pool({
  connectionString,
  ssl: isHosted ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
})

pool.on('error', (err) => {
  // Log full detail — connection errors often have empty .message
  const detail = err.errors ? err.errors.map((e) => e.message).join('; ') : err.message
  console.error('PostgreSQL error:', detail || err.code || 'unknown')
})

pool.on('connect', () => {
  console.log('Connected to PostgreSQL')
})

export default pool
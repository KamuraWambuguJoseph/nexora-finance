import pg from 'pg'
import 'dotenv/config'

// Neon (and most hosted Postgres) require SSL. Local Postgres does not.
// Detect hosted connections by host and enable SSL accordingly.
const connectionString = process.env.DATABASE_URL || ''
const isHosted = /neon\.tech|supabase\.co|render\.com|amazonaws\.com|neon\.tech/i.test(connectionString)

const pool = new pg.Pool({
  connectionString,
  ssl: isHosted ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
})

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err.message)
})

pool.on('connect', () => {
  console.log('Connected to PostgreSQL')
})

export default pool
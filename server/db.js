import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
})

pool.on('error', (err) => {
  console.error('🚨 Unexpected PostgreSQL error:', err)
})

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL')
})

export default pool

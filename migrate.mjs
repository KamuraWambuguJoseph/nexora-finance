import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

async function migrate() {
  try {
    console.log('Running migrations...\n')

    // Add is_admin column if it doesn't exist
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false
    `)
    console.log('✓ Added is_admin column to users table')

    console.log('\n✓ All migrations completed!')
    process.exit(0)
  } catch (err) {
    console.error('Migration error:', err)
    process.exit(1)
  }
}

migrate()

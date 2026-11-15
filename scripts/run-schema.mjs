import 'dotenv/config'
import pg from 'pg'
import fs from 'fs'

const sql = fs.readFileSync('./server/database.sql', 'utf8')

// Strip channel_binding (not supported by node-pg) and let ssl handle it
let url = process.env.DATABASE_URL || ''
url = url.replace(/&?channel_binding=\w+/i, '')

const isHosted = /neon\.tech|supabase\.co|render\.com|amazonaws\.com/i.test(url)
const pool = new pg.Pool({
  connectionString: url,
  ssl: isHosted ? { rejectUnauthorized: false } : false,
})

try {
  await pool.query(sql)
  console.log('SCHEMA APPLIED OK')
  const r = await pool.query('SELECT COUNT(*) FROM investment_programs')
  console.log('programs seeded:', r.rows[0].count)
  const t = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name",
  )
  console.log('tables:', t.rows.map((x) => x.table_name).join(', '))
  process.exit(0)
} catch (e) {
  console.error('SCHEMA ERROR:', e.message)
  process.exit(1)
}
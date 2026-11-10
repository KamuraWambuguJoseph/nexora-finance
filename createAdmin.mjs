import bcrypt from 'bcryptjs'
import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

async function createAdmin(name, email, password) {
  try {
    const hash = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, is_admin)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (email) DO UPDATE SET is_admin = true
       RETURNING id, name, email, is_admin, created_at`,
      [name, email.toLowerCase(), hash],
    )

    console.log('\n✓ Admin account created/updated:')
    console.log(result.rows[0])
    console.log('\nYou can now log in at /login with:')
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${password}`)
    console.log('\nThen navigate to /admin to access the admin panel.\n')

    process.exit(0)
  } catch (err) {
    console.error('Error creating admin:', err)
    process.exit(1)
  }
}

const args = process.argv.slice(2)
if (args.length < 3) {
  console.log('Usage: node createAdmin.mjs <name> <email> <password>')
  console.log('Example: node createAdmin.mjs "Admin User" admin@nexora.com SecurePass123')
  process.exit(1)
}

createAdmin(args[0], args[1], args[2])

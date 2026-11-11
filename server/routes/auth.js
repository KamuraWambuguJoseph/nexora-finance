import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import pool from '../db.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET
const TOKEN_TTL = '7d'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  referral_code: z.string().optional(),
  preferred_currency: z.string().optional().default('USD'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

function generateMembershipId() {
  const prefix = 'NEX'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, is_admin: user.is_admin || false, membership_id: user.membership_id },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL },
  )
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  console.log('📝 Signup request:', req.body.email)
  try {
    const parsed = signupSchema.safeParse(req.body)
    if (!parsed.success) {
      console.log('❌ Validation failed:', parsed.error.issues[0].message)
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { name, email, password, referral_code, preferred_currency } = parsed.data

    console.log('🔍 Checking if email exists...')
    const exists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()],
    )
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    // Validate referral code if provided
    let referrer_id = null
    if (referral_code) {
      const refResult = await pool.query(
        'SELECT user_id FROM referral_codes WHERE code = $1',
        [referral_code.toUpperCase()],
      )
      if (refResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid referral code.' })
      }
      referrer_id = refResult.rows[0].user_id
    }

    const hash = await bcrypt.hash(password, 10)
    const membership_id = generateMembershipId()

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, membership_id, referral_code_used, preferred_currency)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, membership_id, preferred_currency, created_at`,
      [name, email.toLowerCase(), hash, membership_id, referral_code?.toUpperCase() || null, preferred_currency],
    )

    const user = result.rows[0]

    // Link referral if code was used
    if (referrer_id) {
      await pool.query(
        `INSERT INTO referrals (referrer_id, referred_user_id, referral_code)
         VALUES ($1, $2, $3)
         ON CONFLICT (referred_user_id) DO NOTHING`,
        [referrer_id, user.id, referral_code.toUpperCase()],
      )
    }

    console.log('✅ User created with membership ID:', membership_id)
    res.status(201).json({
      token: signToken(user),
      user,
      membership_id
    })
  } catch (err) {
    console.error('❌ Signup error:', err.message, err.stack)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// stricter limits for login (brute-force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Try again later.' },
})

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { email, password } = parsed.data

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()],
    )
    const user = result.rows[0]

    // same message for both cases — don't leak which emails exist
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    res.json({
      token: signToken(user),
      user: { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

export default router

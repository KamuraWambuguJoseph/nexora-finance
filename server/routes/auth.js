import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { z } from 'zod'
import { sendVerificationEmail } from '../email.js'
import rateLimit from 'express-rate-limit'
import pool from '../db.js'
import { verifyTOTP } from '../totp.js'
import { sendPasswordResetEmail } from '../email.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET
const TOKEN_TTL = '7d'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(6, 'Phone number is required').max(30),
  country: z.string().min(2, 'Country is required').max(80),
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
  try {
    const parsed = signupSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { name, email, password, phone, country, referral_code, preferred_currency } = parsed.data

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
      `INSERT INTO users (name, email, password_hash, membership_id, referral_code_used, preferred_currency, phone, country, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
       RETURNING id, name, email, membership_id, preferred_currency, phone, country, created_at`,
      [name, email.toLowerCase(), hash, membership_id, referral_code?.toUpperCase() || null, preferred_currency, phone, country],
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

    // Email verification code (6 digits)
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const tokenHash = crypto.createHash('sha256').update(code).digest('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await pool.query(
      `UPDATE users SET verify_token_hash = $1, verify_token_expires = $2 WHERE id = $3`,
      [tokenHash, expires, user.id],
    )
    sendVerificationEmail(email.toLowerCase(), code).catch(() => {})

    res.status(201).json({
      needs_verification: true,
      message: 'Account created. Check your email for a 6-digit verification code.',
      email: email.toLowerCase(),
    })
  } catch (err) {
    const detail = err.errors ? err.errors.map((e) => e.message).join('; ') : err.message
    console.error('Signup error:', detail || err.code || err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// stricter limits for login (brute-force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Try again later.' },
})

// POST /api/auth/verify-email â€” confirm email with token
const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email'),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
})

router.post('/verify-email', async (req, res) => {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
    const { email, code } = parsed.data
    const tokenHash = crypto.createHash('sha256').update(code).digest('hex')
    const result = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND verify_token_hash = $2 AND verify_token_expires > now()`,
      [email.toLowerCase(), tokenHash],
    )
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' })
    }
    await pool.query(
      `UPDATE users SET email_verified = true, verify_token_hash = NULL, verify_token_expires = NULL WHERE id = $1`,
      [result.rows[0].id],
    )
    res.json({ success: true, message: 'Email verified. You can now log in.' })
  } catch (err) {
    console.error('Verify email error:', err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const parsed = z.object({ email: z.string().email() }).safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
    const email = parsed.data.email.toLowerCase()
    const result = await pool.query(
      `SELECT id, email_verified FROM users WHERE email = $1`,
      [email],
    )
    if (result.rows.length === 0) return res.json({ success: true })
    if (result.rows[0].email_verified) return res.json({ success: true, already_verified: true })
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const tokenHash = crypto.createHash('sha256').update(code).digest('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await pool.query(
      `UPDATE users SET verify_token_hash = $1, verify_token_expires = $2 WHERE id = $3`,
      [tokenHash, expires, result.rows[0].id],
    )
    sendVerificationEmail(email, code).catch(() => {})
    res.json({ success: true })
  } catch (err) {
    console.error('Resend verification error:', err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
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

    // same message for both cases Ã¢â‚¬â€ don't leak which emails exist
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // Admins may bypass email verification (so the owner can log in immediately)
    const bypass = (process.env.ADMIN_BYPASS_VERIFY || 'false').toLowerCase() === 'true'
    if (!user.email_verified && !bypass) {
      return res.status(403).json({ error: 'Please verify your email before logging in.', needs_verification: true })
    }

    // If 2FA is enabled, require a second step before issuing a token
    if (user.two_factor_enabled) {
      return res.status(206).json({
        two_factor_required: true,
        email: user.email,
        message: 'Enter the 6-digit code from your authenticator app.',
      })
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

// POST /api/auth/login/2fa Ã¢â‚¬â€ verify TOTP after password step
const twoFactorSchema = z.object({
  email: z.string().email('Invalid email'),
  token: z.string().regex(/^\d{6}$/, 'Enter a 6-digit code'),
})

router.post('/login/2fa', async (req, res) => {
  try {
    const parsed = twoFactorSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { email, token } = parsed.data

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
    const user = result.rows[0]
    if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
      return res.status(401).json({ error: 'Two-factor authentication is not set up for this account.' })
    }

    if (!verifyTOTP(user.two_factor_secret, token)) {
      return res.status(401).json({ error: 'Invalid code. Check your authenticator app and try again.' })
    }

    res.json({
      token: signToken(user),
      user: { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin },
    })
  } catch (err) {
    console.error('2FA login error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// POST /api/auth/forgot-password Ã¢â‚¬â€ email a reset link
const forgotSchema = z.object({
  email: z.string().email('Invalid email'),
})

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many reset requests. Try again later.' },
})

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

router.post('/forgot-password', resetLimiter, async (req, res) => {
  try {
    const parsed = forgotSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { email } = parsed.data

    const result = await pool.query('SELECT id, name FROM users WHERE email = $1', [email.toLowerCase()])
    const user = result.rows[0]

    // Always return the same message so we don't reveal which emails exist.
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = hashToken(rawToken)
      const expires = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

      await pool.query(
        'UPDATE users SET reset_token_hash = $1, reset_token_expires = $2 WHERE id = $3',
        [tokenHash, expires, user.id],
      )

      const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
      const resetLink = `${clientOrigin}/reset-password?token=${rawToken}&email=${encodeURIComponent(email.toLowerCase())}`
      await sendPasswordResetEmail(email.toLowerCase(), resetLink)
    }

    res.json({ message: 'If an account exists for that email, a password reset link has been sent.' })
  } catch (err) {
    console.error('Forgot password error:', err.message)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// POST /api/auth/reset-password Ã¢â‚¬â€ verify token and set a new password
const resetSchema = z.object({
  email: z.string().email('Invalid email'),
  token: z.string().min(10, 'Invalid token'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

router.post('/reset-password', resetLimiter, async (req, res) => {
  try {
    const parsed = resetSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { email, token, password } = parsed.data

    const result = await pool.query(
      'SELECT id, reset_token_hash, reset_token_expires FROM users WHERE email = $1',
      [email.toLowerCase()],
    )
    const user = result.rows[0]

    if (!user || !user.reset_token_hash || !user.reset_token_expires) {
      return res.status(400).json({ error: 'Invalid or expired reset link.' })
    }
    if (new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'This reset link has expired. Request a new one.' })
    }

    const providedHash = hashToken(token)
    // constant-time compare to avoid timing attacks
    const a = Buffer.from(user.reset_token_hash)
    const b = Buffer.from(providedHash)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({ error: 'Invalid or expired reset link.' })
    }

    const hash = await bcrypt.hash(password, 10)
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = $2',
      [hash, user.id],
    )

    res.json({ message: 'Password reset successful. You can now log in with your new password.' })
  } catch (err) {
    console.error('Reset password error:', err.message)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

export default router

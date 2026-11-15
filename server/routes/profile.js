import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import pool from '../db.js'
import auth from '../middleware/auth.js'
import { generateBase32Secret, verifyTOTP, buildOtpAuth } from '../totp.js'

const router = Router()

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
async function loadUser(userId) {
  const result = await pool.query(
    `SELECT id, name, email, membership_id, preferred_currency, phone, address, country,
            two_factor_enabled, created_at
       FROM users WHERE id = $1`,
    [userId],
  )
  return result.rows[0]
}

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    membership_id: u.membership_id,
    preferred_currency: u.preferred_currency,
    phone: u.phone,
    address: u.address,
    country: u.country,
    two_factor_enabled: u.two_factor_enabled,
    created_at: u.created_at,
  }
}

// ------------------------------------------------------------------
// GET /api/profile — current profile
// ------------------------------------------------------------------
router.get('/', auth, async (req, res) => {
  try {
    const user = await loadUser(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found.' })
    res.json({ user: publicUser(user) })
  } catch (err) {
    console.error('Profile GET error:', err)
    res.status(500).json({ error: 'Could not load profile.' })
  }
})

// ------------------------------------------------------------------
// PATCH /api/profile — update personal info
// ------------------------------------------------------------------
const updateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  preferred_currency: z.string().length(3).optional(),
})

router.patch('/', auth, async (req, res) => {
  try {
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { name, phone, address, country, preferred_currency } = parsed.data

    const result = await pool.query(
      `UPDATE users SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         address = COALESCE($3, address),
         country = COALESCE($6, country),
         preferred_currency = COALESCE($4, preferred_currency)
       WHERE id = $5
       RETURNING id, name, email, membership_id, preferred_currency, phone, address, country, two_factor_enabled, created_at`,
      [
        name ?? null,
        phone === undefined ? null : phone,
        address === undefined ? null : address,
        preferred_currency ?? null,
        req.user.id,
        country === undefined ? null : country,
      ],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' })
    }
    res.json({ user: publicUser(result.rows[0]) })
  } catch (err) {
    console.error('Profile PATCH error:', err)
    res.status(500).json({ error: 'Could not update profile.' })
  }
})

// ------------------------------------------------------------------
// PATCH /api/profile/password — change password
// ------------------------------------------------------------------
const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
})

router.patch('/password', auth, async (req, res) => {
  try {
    const parsed = passwordSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { current_password, new_password } = parsed.data

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' })
    }

    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash)
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect.' })
    }

    const hash = await bcrypt.hash(new_password, 10)
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('Password change error:', err)
    res.status(500).json({ error: 'Could not change password.' })
  }
})

// ------------------------------------------------------------------
// POST /api/profile/2fa/setup — generate secret (not yet enabled)
// ------------------------------------------------------------------
router.post('/2fa/setup', auth, async (req, res) => {
  try {
    const user = await loadUser(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found.' })

    if (user.two_factor_enabled) {
      return res.status(400).json({ error: 'Two-factor authentication is already enabled.' })
    }

    const secret = generateBase32Secret()
    await pool.query('UPDATE users SET two_factor_secret = $1 WHERE id = $2', [secret, req.user.id])

    const otpauth = buildOtpAuth(user.email, secret)

    res.json({ secret, otpauth })
  } catch (err) {
    console.error('2FA setup error:', err)
    res.status(500).json({ error: 'Could not set up two-factor authentication.' })
  }
})

// ------------------------------------------------------------------
// POST /api/profile/2fa/enable — verify code and enable
// ------------------------------------------------------------------
const enableSchema = z.object({ token: z.string().regex(/^\d{6}$/, 'Enter a 6-digit code') })

router.post('/2fa/enable', auth, async (req, res) => {
  try {
    const parsed = enableSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }

    const result = await pool.query('SELECT two_factor_secret FROM users WHERE id = $1', [req.user.id])
    const secret = result.rows[0]?.two_factor_secret
    if (!secret) {
      return res.status(400).json({ error: 'Set up two-factor authentication first.' })
    }

    if (!verifyTOTP(secret, parsed.data.token)) {
      return res.status(400).json({ error: 'Invalid code. Check your authenticator app and try again.' })
    }

    await pool.query('UPDATE users SET two_factor_enabled = true WHERE id = $1', [req.user.id])
    res.json({ ok: true, two_factor_enabled: true })
  } catch (err) {
    console.error('2FA enable error:', err)
    res.status(500).json({ error: 'Could not enable two-factor authentication.' })
  }
})

// ------------------------------------------------------------------
// POST /api/profile/2fa/disable — require password, clear secret
// ------------------------------------------------------------------
const disableSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

router.post('/2fa/disable', auth, async (req, res) => {
  try {
    const parsed = disableSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' })
    }
    const valid = await bcrypt.compare(parsed.data.password, result.rows[0].password_hash)
    if (!valid) {
      return res.status(400).json({ error: 'Password is incorrect.' })
    }

    await pool.query(
      'UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1',
      [req.user.id],
    )
    res.json({ ok: true, two_factor_enabled: false })
  } catch (err) {
    console.error('2FA disable error:', err)
    res.status(500).json({ error: 'Could not disable two-factor authentication.' })
  }
})

export default router
import { Router } from 'express'
import { z } from 'zod'
import pool from '../db.js'
import adminAuth from '../middleware/adminAuth.js'

const router = Router()

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Admin routes working!' })
})

// GET /api/admin/users — all registered users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, is_admin, created_at
       FROM users
       WHERE is_admin = false
       ORDER BY created_at DESC
       LIMIT 1000`,
    )
    res.json({ users: result.rows })
  } catch (err) {
    console.error('List users error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// GET /api/admin/deposits — all deposits
router.get('/deposits', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.user_id, d.asset, d.network, d.amount, d.wallet_address,
              d.tx_hash, d.status, d.created_at, d.reviewed_at,
              u.name, u.email
       FROM deposits d
       JOIN users u ON d.user_id = u.id
       ORDER BY d.created_at DESC
       LIMIT 500`,
    )
    res.json({ deposits: result.rows })
  } catch (err) {
    console.error('List deposits error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// POST /api/admin/deposit/confirm — confirm a deposit
router.post('/deposit/confirm', adminAuth, async (req, res) => {
  try {
    const { deposit_id } = req.body
    if (!deposit_id) {
      return res.status(400).json({ error: 'Deposit ID required' })
    }

    const result = await pool.query(
      `UPDATE deposits
       SET status = 'confirmed', reviewed_at = now()
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [deposit_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deposit not found or already processed.' })
    }

    res.json({ deposit: result.rows[0], message: 'Deposit confirmed.' })
  } catch (err) {
    console.error('Confirm deposit error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// POST /api/admin/deposit/reject — reject a deposit
router.post('/deposit/reject', adminAuth, async (req, res) => {
  try {
    const { deposit_id } = req.body
    if (!deposit_id) {
      return res.status(400).json({ error: 'Deposit ID required' })
    }

    const result = await pool.query(
      `UPDATE deposits
       SET status = 'rejected', reviewed_at = now()
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [deposit_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deposit not found or already processed.' })
    }

    res.json({ deposit: result.rows[0], message: 'Deposit rejected.' })
  } catch (err) {
    console.error('Reject deposit error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// GET /api/admin/withdrawals — all pending withdrawals
router.get('/withdrawals', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.id, w.user_id, w.asset, w.amount, w.wallet_address, w.status, w.requested_at,
              u.name, u.email
       FROM withdrawals w
       JOIN users u ON w.user_id = u.id
       WHERE w.status = 'pending'
       ORDER BY w.requested_at ASC
       LIMIT 100`,
    )
    res.json({ withdrawals: result.rows })
  } catch (err) {
    console.error('List pending withdrawals error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// GET /api/admin/withdrawals/all — all withdrawals (history)
router.get('/withdrawals/all', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.id, w.user_id, w.asset, w.amount, w.wallet_address, w.status, w.requested_at,
              w.released_at, w.released_by, w.rejection_reason,
              u.name, u.email
       FROM withdrawals w
       JOIN users u ON w.user_id = u.id
       ORDER BY w.requested_at DESC
       LIMIT 500`,
    )
    res.json({ withdrawals: result.rows })
  } catch (err) {
    console.error('List all withdrawals error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

const releaseSchema = z.object({
  withdrawal_id: z.coerce.number().positive('Withdrawal ID required'),
})

// POST /api/admin/release — release a withdrawal
router.post('/release', adminAuth, async (req, res) => {
  try {
    const parsed = releaseSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { withdrawal_id } = parsed.data

    const result = await pool.query(
      `UPDATE withdrawals
       SET status = 'released', released_at = now(), released_by = $1
       WHERE id = $2 AND status = 'pending'
       RETURNING id, user_id, asset, amount, wallet_address, status, released_at, released_by`,
      [req.user.name, withdrawal_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Withdrawal not found or already processed.' })
    }

    res.json({ withdrawal: result.rows[0], message: 'Withdrawal released successfully.' })
  } catch (err) {
    console.error('Release withdrawal error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

const rejectSchema = z.object({
  withdrawal_id: z.coerce.number().positive('Withdrawal ID required'),
  reason: z.string().min(5, 'Rejection reason required').max(200),
})

// POST /api/admin/reject — reject a withdrawal
router.post('/reject', adminAuth, async (req, res) => {
  try {
    const parsed = rejectSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { withdrawal_id, reason } = parsed.data

    const result = await pool.query(
      `UPDATE withdrawals
       SET status = 'rejected', released_at = now(), released_by = $1, rejection_reason = $2
       WHERE id = $3 AND status = 'pending'
       RETURNING id, user_id, asset, amount, wallet_address, status, rejection_reason`,
      [req.user.name, reason, withdrawal_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Withdrawal not found or already processed.' })
    }

    res.json({ withdrawal: result.rows[0], message: 'Withdrawal rejected.' })
  } catch (err) {
    console.error('Reject withdrawal error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// GET /api/admin/referrals — all referral commissions
router.get('/referrals', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rc.id, rc.referrer_id, rc.commission_amount, rc.status, rc.created_at,
              u1.name as referrer_name, u1.email as referrer_email,
              d.user_id as deposit_by_user_id,
              u2.name as deposit_by_name,
              d.amount as deposit_amount,
              d.asset
       FROM referral_commissions rc
       JOIN users u1 ON rc.referrer_id = u1.id
       JOIN deposits d ON rc.deposit_id = d.id
       JOIN users u2 ON d.user_id = u2.id
       ORDER BY rc.created_at DESC
       LIMIT 500`,
    )
    res.json({ commissions: result.rows })
  } catch (err) {
    console.error('List referral commissions error:', err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// POST /api/admin/referral/credit — credit a pending commission
router.post('/referral/credit', adminAuth, async (req, res) => {
  const schema = z.object({
    commission_id: z.coerce.number().positive(),
  })

  try {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { commission_id } = parsed.data

    const result = await pool.query(
      `UPDATE referral_commissions
       SET status = 'credited', credited_at = now()
       WHERE id = $1 AND status = 'pending'
       RETURNING id, referrer_id, commission_amount, status`,
      [commission_id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commission not found or already credited.' })
    }

    res.json({ commission: result.rows[0], message: 'Commission credited to user.' })
  } catch (err) {
    console.error('Credit commission error:', err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

export default router

import { Router } from 'express'
import { z } from 'zod'
import pool from '../db.js'
import auth from '../middleware/auth.js'

const router = Router()

const withdrawalSchema = z.object({
  asset: z.enum(['BTC', 'ETH', 'USDT', 'BNB', 'SOL']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  wallet_address: z.string().min(10, 'Wallet address is required').max(190),
})

// GET /api/withdrawals — current user's withdrawal history
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, asset, amount, wallet_address, status, requested_at, released_at, released_by
       FROM withdrawals WHERE user_id = $1 ORDER BY requested_at DESC LIMIT 50`,
      [req.user.id],
    )
    res.json({ withdrawals: result.rows })
  } catch (err) {
    console.error('List withdrawals error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// POST /api/withdrawals — user requests a withdrawal
router.post('/', auth, async (req, res) => {
  try {
    const parsed = withdrawalSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { asset, amount, wallet_address } = parsed.data

    // Check user has sufficient confirmed balance
    const balance = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM deposits WHERE user_id = $1 AND status = 'confirmed'`,
      [req.user.id],
    )
    const confirmed = Number(balance.rows[0].total)

    // Deduct any active investments
    const invested = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM investments WHERE user_id = $1 AND status = 'active'`,
      [req.user.id],
    )
    const activeInvest = Number(invested.rows[0].total)
    const available = confirmed - activeInvest

    if (amount > available) {
      return res
        .status(400)
        .json({ error: `Insufficient balance. Available: $${available.toFixed(2)}` })
    }

    const result = await pool.query(
      `INSERT INTO withdrawals (user_id, asset, amount, wallet_address, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id, asset, amount, wallet_address, status, requested_at`,
      [req.user.id, asset, amount, wallet_address],
    )

    res.status(201).json({ withdrawal: result.rows[0] })
  } catch (err) {
    console.error('Create withdrawal error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

export default router

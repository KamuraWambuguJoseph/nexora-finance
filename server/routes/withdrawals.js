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

// POST /api/withdrawals — user requests a withdrawal (atomic, balance-validated)
router.post('/', auth, async (req, res) => {
  const client = await pool.connect()
  try {
    const parsed = withdrawalSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { asset, amount, wallet_address } = parsed.data

    await client.query('BEGIN')

    // Available = confirmed deposits − active investments − pending/released withdrawals
    const funds = await client.query(
      `SELECT
         COALESCE((SELECT SUM(amount) FROM deposits WHERE user_id = $1 AND status = 'confirmed'), 0) AS deposited,
         COALESCE((SELECT SUM(amount) FROM user_investments WHERE user_id = $1 AND status = 'active'), 0) AS invested,
         COALESCE((SELECT SUM(amount) FROM withdrawals WHERE user_id = $1 AND status IN ('pending','released')), 0) AS withdrawn`,
      [req.user.id],
    )
    const { deposited, invested, withdrawn } = funds.rows[0]
    const available = Number(deposited) - Number(invested) - Number(withdrawn)

    if (amount > available) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: `Insufficient balance. Available: $${available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      })
    }

    const result = await client.query(
      `INSERT INTO withdrawals (user_id, asset, amount, wallet_address, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id, asset, amount, wallet_address, status, requested_at`,
      [req.user.id, asset, amount, wallet_address],
    )

    await client.query('COMMIT')

    res.status(201).json({
      withdrawal: result.rows[0],
      message: 'Withdrawal request submitted and release within 5–10 minutes.',
    })
  } catch (err) {
    try { await client.query('ROLLBACK') } catch { }
    console.error('Create withdrawal error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  } finally {
    client.release()
  }
})

export default router

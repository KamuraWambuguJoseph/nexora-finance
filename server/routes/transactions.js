import { Router } from 'express'
import { z } from 'zod'
import pool from '../db.js'
import auth from '../middleware/auth.js'

const router = Router()

const txSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  category: z.string().min(1).max(100).default('General'),
  note: z.string().max(500).optional().nullable(),
  occurred_at: z.string().datetime().optional(),
})

// GET /api/transactions — list current user's transactions (newest first)
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, amount, category, note, occurred_at, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY occurred_at DESC
       LIMIT 100`,
      [req.user.id],
    )
    res.json({ transactions: result.rows })
  } catch (err) {
    console.error('List transactions error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// POST /api/transactions — add a transaction
router.post('/', auth, async (req, res) => {
  try {
    const parsed = txSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { type, amount, category, note, occurred_at } = parsed.data

    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, category, note, occurred_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, now()))
       RETURNING id, type, amount, category, note, occurred_at, created_at`,
      [req.user.id, type, amount, category, note || null, occurred_at || null],
    )

    res.status(201).json({ transaction: result.rows[0] })
  } catch (err) {
    console.error('Create transaction error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// DELETE /api/transactions/:id — remove a transaction owned by the user
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id],
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found.' })
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('Delete transaction error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

export default router

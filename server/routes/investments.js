import { Router } from 'express'
import { z } from 'zod'
import pool from '../db.js'
import auth from '../middleware/auth.js'

const router = Router()

// Investment plans available to users
export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    roi_percent: 8,
    duration_days: 7,
    min_amount: 100,
    max_amount: 999,
  },
  {
    id: 'growth',
    name: 'Growth',
    roi_percent: 15,
    duration_days: 14,
    min_amount: 1000,
    max_amount: 4999,
  },
  {
    id: 'premium',
    name: 'Premium',
    roi_percent: 25,
    duration_days: 30,
    min_amount: 5000,
    max_amount: 50000,
  },
]

// GET /api/investments/plans — list available plans
router.get('/plans', auth, (_req, res) => {
  res.json({ plans: PLANS })
})

// GET /api/investments — current user's investments
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, plan_id, plan_name, amount, roi_percent, duration_days,
              status, started_at, matures_at
       FROM investments WHERE user_id = $1 ORDER BY started_at DESC LIMIT 50`,
      [req.user.id],
    )
    res.json({ investments: result.rows })
  } catch (err) {
    console.error('List investments error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

const investSchema = z.object({
  plan_id: z.enum(['starter', 'growth', 'premium']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
})

// POST /api/investments — invest into a plan, funded by confirmed deposits
router.post('/', auth, async (req, res) => {
  try {
    const parsed = investSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { plan_id, amount } = parsed.data
    const plan = PLANS.find((p) => p.id === plan_id)

    if (amount < plan.min_amount || amount > plan.max_amount) {
      return res.status(400).json({
        error: `${plan.name} plan accepts $${plan.min_amount.toLocaleString()} – $${plan.max_amount.toLocaleString()}.`,
      })
    }

    // total of CONFIRMED deposits minus what's already locked in active investments
    const funds = await pool.query(
      `SELECT
         COALESCE((SELECT SUM(amount) FROM deposits
                   WHERE user_id = $1 AND status = 'confirmed'), 0) AS deposited,
         COALESCE((SELECT SUM(amount) FROM investments
                   WHERE user_id = $1 AND status = 'active'), 0) AS locked`,
      [req.user.id],
    )
    const { deposited, locked } = funds.rows[0]
    const available = Number(deposited) - Number(locked)

    if (amount > available) {
      return res.status(400).json({
        error: `Insufficient confirmed balance. Available: $${available.toLocaleString()}. Deposit first, then invest.`,
      })
    }

    const result = await pool.query(
      `INSERT INTO investments (user_id, plan_id, plan_name, amount, roi_percent, duration_days, matures_at)
       VALUES ($1, $2, $3, $4, $5, $6, now() + make_interval(days => $6::int))
       RETURNING id, plan_id, plan_name, amount, roi_percent, duration_days,
                 status, started_at, matures_at`,
      [req.user.id, plan.id, plan.name, amount, plan.roi_percent, plan.duration_days],
    )

    res.status(201).json({ investment: result.rows[0] })
  } catch (err) {
    console.error('Create investment error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

export default router

import { Router } from 'express'
import { z } from 'zod'
import pool from '../db.js'
import auth from '../middleware/auth.js'

const router = Router()

// Test route
router.get('/test', (req, res) => {
  res.json({ test: 'ok' })
})

/* ---------- helpers ---------- */

function generateReference() {
  const prefix = 'NXR'
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${ts}-${rand}`
}

function maturityDate(durationDays) {
  return new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
}

function dailyEarning(amount, dailyRatePct) {
  return Number(amount) * (Number(dailyRatePct) / 100)
}

/* ---------- PUBLIC: programs list ---------- */

// GET /api/investments/programs — active programs for customer-facing UI
router.get('/programs', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, slug, icon, min_investment, max_investment, duration_days,
              roi_percent, daily_rate_pct, risk_level, management_fee, description, strategy,
              underlying_activity, withdrawal_conditions, terms, is_active, display_order
       FROM investment_programs
       WHERE is_active = true
       ORDER BY display_order ASC, id ASC`
    )
    res.json({ programs: result.rows })
  } catch (err) {
    console.error('List programs error:', err)
    res.status(500).json({ error: 'Failed to load investment programs.' })
  }
})

// GET /api/investments/plans — legacy alias
router.get('/plans', auth, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, slug, icon, min_investment, max_investment, duration_days,
              roi_percent, daily_rate_pct, risk_level, management_fee, description
       FROM investment_programs
       WHERE is_active = true
       ORDER BY display_order ASC, id ASC`
    )
    res.json({ plans: result.rows })
  } catch (err) {
    console.error('List plans error:', err)
    res.status(500).json({ error: 'Failed to load plans.' })
  }
})

/* ---------- USER: investments ---------- */

// GET /api/investments — current user's investments
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ui.id, ui.program_id, ui.program_name, ui.reference, ui.amount, ui.min_investment, ui.max_investment,
              ui.roi_percent, ui.duration_days, ui.management_fee, ui.net_amount, ui.expected_value,
              ui.started_at, ui.matures_at, ui.days_remaining, ui.status, ui.agreement_signed,
              ui.agreement_signed_at, ui.total_earned, ui.last_credited_at, ui.created_at, ui.updated_at,
              p.daily_rate_pct,
              COALESCE((SELECT amount FROM investment_earnings
                         WHERE investment_id = ui.id
                         ORDER BY day_index DESC LIMIT 1), 0) AS last_earning
         FROM user_investments ui
         LEFT JOIN investment_programs p ON p.id = ui.program_id
        WHERE ui.user_id = $1 ORDER BY ui.started_at DESC LIMIT 100`,
      [req.user.id]
    )
    res.json({ investments: result.rows })
  } catch (err) {
    console.error('List investments error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

const investSchema = z.object({
  program_id: z.coerce.number().int().positive('Program required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  agree_terms: z.boolean().refine((v) => v === true, { message: 'You must accept the investment agreement' }),
})

// POST /api/investments — invest into a program (atomic, balance-validated)
router.post('/', auth, async (req, res) => {
  const client = await pool.connect()
  try {
    const parsed = investSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { program_id, amount } = parsed.data

    await client.query('BEGIN')

    // Lock the program row for reading
    const prog = await client.query(
      `SELECT id, name, slug, min_investment, max_investment, duration_days, roi_percent, daily_rate_pct,
              risk_level, management_fee, description, strategy, underlying_activity,
              withdrawal_conditions, terms, is_active
       FROM investment_programs WHERE id = $1 FOR UPDATE`,
      [program_id]
    )
    if (prog.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Investment program not found.' })
    }
    const program = prog.rows[0]
    if (!program.is_active) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'This investment program is not currently available.' })
    }

    // Validate min / max
    if (amount < Number(program.min_investment)) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: `${program.name} minimum investment is $${Number(program.min_investment).toLocaleString()}.`,
      })
    }
    if (program.max_investment && amount > Number(program.max_investment)) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: `${program.name} maximum investment is $${Number(program.max_investment).toLocaleString()}.`,
      })
    }

    // Check user's confirmed deposit balance + earned income minus locked active investments
    const funds = await client.query(
      `SELECT
         COALESCE((SELECT SUM(amount) FROM deposits WHERE user_id = $1 AND status = 'confirmed'), 0)
         + COALESCE((SELECT SUM(amount) FROM investment_earnings WHERE user_id = $1), 0) AS deposited,
         COALESCE((SELECT SUM(amount) FROM user_investments WHERE user_id = $1 AND status = 'active'), 0) AS locked`
      , [req.user.id])
    const { deposited, locked } = funds.rows[0]
    const available = Number(deposited) - Number(locked)

    if (amount > available) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: `Insufficient confirmed balance. Available: $${available.toLocaleString()}. Deposit first, then invest.`,
      })
    }

    // Prevent duplicate active investment in same program
    const dup = await client.query(
      `SELECT id FROM user_investments WHERE user_id = $1 AND program_id = $2 AND status = 'active'`,
      [req.user.id, program_id])
    if (dup.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'You already have an active investment in this program.' })
    }

    const managementFee = Number(amount) * (Number(program.management_fee) / 100)
    const netAmount = Number(amount) - managementFee
    const roi = Number(program.roi_percent) / 100
    const expectedValue = netAmount * (1 + roi)
    const maturesAt = maturityDate(Number(program.duration_days))

    const ref = generateReference()
    const investmentResult = await client.query(
       `INSERT INTO user_investments
        (user_id, program_id, program_name, reference, amount, min_investment, max_investment,
         roi_percent, duration_days, management_fee, net_amount, expected_value,
         started_at, matures_at, days_remaining, status, agreement_signed, agreement_signed_at,
         last_credited_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'active',true,now(),now())
       RETURNING id, program_id, program_name, reference, amount, min_investment, max_investment,
                 roi_percent, duration_days, management_fee, net_amount, expected_value,
                 started_at, matures_at, days_remaining, status, agreement_signed,
                 agreement_signed_at, total_earned, last_credited_at`,
       [req.user.id, program.id, program.name, ref, amount, program.min_investment,
         program.max_investment, program.roi_percent, program.duration_days,
         managementFee, netAmount, expectedValue, new Date(), maturesAt,
         Number(program.duration_days)]
    )

    const investment = investmentResult.rows[0]

    // Record investment transaction (debit)
    const balanceBefore = available
    const balanceAfter = available - Number(amount)
    await client.query(
      `INSERT INTO investment_transactions
       (user_id, investment_id, type, amount, net_amount, fee_amount, balance_before, balance_after, reference, description)
       VALUES ($1,$2,'investment',$3,$4,$5,$6,$7,$8,$9)`,
      [req.user.id, investment.id, amount, netAmount, managementFee, balanceBefore, balanceAfter, ref,
        `Investment in ${program.name} (${program.duration_days} days)`]
    )

    // Record signed agreement
    await client.query(
      `INSERT INTO investment_agreements (user_id, investment_id, program_id, agreement_text, version, ip_address)
       VALUES ($1,$2,$3,$4,'1.0',$5)`,
      [req.user.id, investment.id, program.id, program.terms, req.ip]
    )

    // Maturity notification
    await client.query(
      `INSERT INTO investment_notifications (user_id, investment_id, type, title, message)
       VALUES ($1,$2,'maturity',$3,$4)`,
      [req.user.id, investment.id,
        `Investment matured: ${program.name}`,
        `Your ${program.name} investment matures on ${new Date(maturesAt).toLocaleDateString()}.`]
    )

    await client.query('COMMIT')

    res.status(201).json({
      investment,
      message: `Investment opened in the ${program.name} program.`,
      summary: {
        program: program.name,
        amount,
        minInvestment: program.min_investment,
        maxInvestment: program.max_investment,
        durationDays: program.duration_days,
        roiPercent: program.roi_percent,
        dailyRatePct: program.daily_rate_pct,
        dailyEarning: dailyEarning(amount, program.daily_rate_pct),
        managementFee,
        netAmount,
        expectedValue,
        maturesAt,
        riskLevel: program.risk_level,
      },
    })
  } catch (err) {
    try { await client.query('ROLLBACK') } catch { }
    console.error('Create investment error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  } finally {
    client.release()
  }
})

// POST /api/investments/:id/withdrawal — request withdrawal from matured investment
const withdrawalSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
})

router.post('/:id/withdrawal', auth, async (req, res) => {
  const client = await pool.connect()
  try {
    const parsed = withdrawalSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { amount } = parsed.data
    const { id } = req.params

    await client.query('BEGIN')

    const inv = await client.query(
      `SELECT * FROM user_investments WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [id, req.user.id])
    if (inv.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Investment not found.' })
    }
    const investment = inv.rows[0]

    if (investment.status !== 'matured' && investment.status !== 'withdrawable') {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Only matured investments can be withdrawn.' })
    }

    const available = Number(investment.expected_value)
    if (amount > available) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Withdrawal amount exceeds available ${money(available)}.` })
    }

    await client.query(
      `UPDATE user_investments SET status = 'withdrawable', updated_at = now() WHERE id = $1`,
      [id]
    )

    await client.query(
      `INSERT INTO investment_withdrawals (user_id, investment_id, amount, status)
       VALUES ($1,$2,$3,'pending') RETURNING id`,
      [req.user.id, id, amount]
    )

    await client.query(
      `INSERT INTO investment_notifications (user_id, investment_id, type, title, message)
       VALUES ($1,$2,'withdrawal','Withdrawal requested','Your withdrawal request is pending admin review.')`,
      [req.user.id, id]
    )

    await client.query('COMMIT')
    res.json({ message: 'Withdrawal request submitted. Admin will review and release it.' })
  } catch (err) {
    try { await client.query('ROLLBACK') } catch { }
    console.error('Withdrawal error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  } finally {
    client.release()
  }
})

function money(n) {
  return Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default router

import { Router } from 'express'
import { z } from 'zod'
import pool from '../db.js'
import adminAuth from '../middleware/adminAuth.js'

const router = Router()

/* ---------- helpers ---------- */

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'program'
}

function auditLog({ pool, adminId, action, entity, entityId, changes, details, ip }) {
  return pool.query(
    `INSERT INTO admin_audit_logs (admin_id, action, entity, entity_id, changes, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [adminId, action, entity, entityId || null, JSON.stringify(changes || {}), details || '', ip || null]
  ).catch(() => {})
}

/* ---------- PUBLIC: list active programs ---------- */

// GET /api/investment-programs — customer-facing active programs
router.get('/', async (_req, res) => {
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

// GET /api/investment-programs/:id — single program details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `SELECT id, name, slug, icon, min_investment, max_investment, duration_days,
              roi_percent, daily_rate_pct, risk_level, management_fee, description, strategy,
              underlying_activity, withdrawal_conditions, terms, is_active, display_order
       FROM investment_programs WHERE id = $1`,
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Investment program not found.' })
    }
    res.json({ program: result.rows[0] })
  } catch (err) {
    console.error('Get program error:', err)
    res.status(500).json({ error: 'Failed to load investment program.' })
  }
})

/* ---------- ADMIN: program management ---------- */

const programSchema = z.object({
  name: z.string().min(2, 'Program name required').max(100),
  icon: z.string().min(1, 'Icon required').max(20).default('📈'),
  min_investment: z.coerce.number().nonnegative('Minimum investment must be >= 0'),
  max_investment: z.coerce.number().nonnegative('Maximum investment must be >= 0').optional().nullable(),
  duration_days: z.coerce.number().int().positive('Duration must be a positive integer'),
  roi_percent: z.coerce.number().nonnegative('ROI must be >= 0').default(0),
  daily_rate_pct: z.coerce.number().nonnegative('Daily rate must be >= 0').default(0),
  risk_level: z.enum(['low', 'medium', 'high', 'very_high']).default('medium'),
  management_fee: z.coerce.number().nonnegative('Fee must be >= 0').default(0),
  description: z.string().min(1, 'Description required').default(''),
  strategy: z.string().default(''),
  underlying_activity: z.string().default(''),
  withdrawal_conditions: z.string().default(''),
  terms: z.string().default(''),
  is_active: z.boolean().default(true),
  display_order: z.coerce.number().int().default(0),
})

// GET /api/investment-programs/admin/all — all programs (admin)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, slug, icon, min_investment, max_investment, duration_days,
              roi_percent, daily_rate_pct, risk_level, management_fee, description, strategy,
              underlying_activity, withdrawal_conditions, terms, is_active, display_order,
              created_at, updated_at
       FROM investment_programs
       ORDER BY display_order ASC, id ASC`
    )
    res.json({ programs: result.rows })
  } catch (err) {
    console.error('Admin list programs error:', err)
    res.status(500).json({ error: 'Failed to load programs.' })
  }
})

// POST /api/investment-programs/admin — create program
router.post('/admin', adminAuth, async (req, res) => {
  try {
    const parsed = programSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const data = parsed.data
    const slug = slugify(data.name)

    // slug uniqueness
    const exists = await pool.query('SELECT id FROM investment_programs WHERE slug = $1', [slug])
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'A program with this name already exists.' })
    }

    const result = await pool.query(
      `INSERT INTO investment_programs
       (name, slug, icon, min_investment, max_investment, duration_days, roi_percent, daily_rate_pct,
        risk_level, management_fee, description, strategy, underlying_activity,
        withdrawal_conditions, terms, is_active, display_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id, name, slug, icon, min_investment, max_investment, duration_days,
                 roi_percent, daily_rate_pct, risk_level, management_fee, description, strategy,
                 underlying_activity, withdrawal_conditions, terms, is_active, display_order`,
      [
        data.name, slug, data.icon, data.min_investment,
        data.max_investment ?? null, data.duration_days, data.roi_percent, data.daily_rate_pct,
        data.risk_level, data.management_fee, data.description, data.strategy,
        data.underlying_activity, data.withdrawal_conditions, data.terms,
        data.is_active, data.display_order,
      ]
    )

    await auditLog({
      pool, adminId: req.user.id, action: 'create', entity: 'investment_program',
      entityId: result.rows[0].id, changes: data,
      details: `Created investment program "${data.name}"`,
      ip: req.ip,
    })

    res.status(201).json({ program: result.rows[0], message: 'Investment program created.' })
  } catch (err) {
    console.error('Create program error:', err)
    res.status(500).json({ error: 'Failed to create investment program.' })
  }
})

// PUT /api/investment-programs/admin/:id — update program
router.put('/admin/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const parsed = programSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const data = parsed.data
    const slug = slugify(data.name)

    const existing = await pool.query('SELECT * FROM investment_programs WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Investment program not found.' })
    }

    const slugConflict = await pool.query('SELECT id FROM investment_programs WHERE slug = $1 AND id <> $2', [slug, id])
    if (slugConflict.rows.length > 0) {
      return res.status(409).json({ error: 'A program with this name already exists.' })
    }

    const result = await pool.query(
      `UPDATE investment_programs
       SET name = $2, slug = $3, icon = $4, min_investment = $5, max_investment = $6,
           duration_days = $7, roi_percent = $8, daily_rate_pct = $9, risk_level = $10, management_fee = $11,
           description = $12, strategy = $13, underlying_activity = $14,
           withdrawal_conditions = $15, terms = $16, is_active = $17,
           display_order = $18, updated_at = now()
       WHERE id = $1
       RETURNING id, name, slug, icon, min_investment, max_investment, duration_days,
                 roi_percent, daily_rate_pct, risk_level, management_fee, description, strategy,
                 underlying_activity, withdrawal_conditions, terms, is_active, display_order`,
      [id, data.name, slug, data.icon, data.min_investment, data.max_investment ?? null,
        data.duration_days, data.roi_percent, data.daily_rate_pct, data.risk_level, data.management_fee,
        data.description, data.strategy, data.underlying_activity, data.withdrawal_conditions,
        data.terms, data.is_active, data.display_order]
    )

    await auditLog({
      pool, adminId: req.user.id, action: 'update', entity: 'investment_program',
      entityId: Number(id), changes: { before: existing.rows[0], after: data },
      details: `Updated investment program "${data.name}"`,
      ip: req.ip,
    })

    res.json({ program: result.rows[0], message: 'Investment program updated.' })
  } catch (err) {
    console.error('Update program error:', err)
    res.status(500).json({ error: 'Failed to update investment program.' })
  }
})

// DELETE /api/investment-programs/admin/:id — deactivate program
router.delete('/admin/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const existing = await pool.query('SELECT * FROM investment_programs WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Investment program not found.' })
    }

    await pool.query('UPDATE investment_programs SET is_active = false, updated_at = now() WHERE id = $1', [id])

    await auditLog({
      pool, adminId: req.user.id, action: 'deactivate', entity: 'investment_program',
      entityId: Number(id), changes: existing.rows[0],
      details: `Deactivated investment program "${existing.rows[0].name}"`,
      ip: req.ip,
    })

    res.json({ message: 'Investment program deactivated.' })
  } catch (err) {
    console.error('Delete program error:', err)
    res.status(500).json({ error: 'Failed to deactivate investment program.' })
  }
})

// GET /api/investment-programs/admin/audit-logs — admin audit history
router.get('/admin/audit-logs', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.action, a.entity, a.entity_id, a.changes, a.details, a.ip_address, a.created_at,
              u.name AS admin_name, u.email AS admin_email
       FROM admin_audit_logs a
       JOIN users u ON a.admin_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 200`
    )
    res.json({ logs: result.rows })
  } catch (err) {
    console.error('Audit logs error:', err)
    res.status(500).json({ error: 'Failed to load audit logs.' })
  }
})

export default router

import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// GET /api/investments/programs - Get all investment programs
router.get('/programs', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, program_name, minimum_amount, duration_days, roi_percent
       FROM investment_programs
       WHERE is_active = true
       ORDER BY minimum_amount ASC`
    )
    res.json({ programs: result.rows })
  } catch (err) {
    console.error('Fetch programs error:', err.message)
    res.status(500).json({ error: 'Failed to fetch programs' })
  }
})

export default router

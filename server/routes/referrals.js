import { Router } from 'express'
import pool from '../db.js'
import auth from '../middleware/auth.js'

const router = Router()

function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'REF'
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// GET /api/referrals/my-code — get current user's referral code
router.get('/my-code', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT code, created_at, uses FROM referral_codes WHERE user_id = $1`,
      [req.user.id],
    )

    if (result.rows.length === 0) {
      // Create new referral code if doesn't exist
      const code = generateReferralCode()
      const newCode = await pool.query(
        `INSERT INTO referral_codes (user_id, code) VALUES ($1, $2)
         RETURNING code, created_at, uses`,
        [req.user.id, code],
      )
      return res.json({ referral_code: newCode.rows[0] })
    }

    res.json({ referral_code: result.rows[0] })
  } catch (err) {
    console.error('Get referral code error:', err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// GET /api/referrals/stats — get referral stats for current user
router.get('/stats', auth, async (req, res) => {
  try {
    // Get number of successful referrals
    const referralsResult = await pool.query(
      `SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1`,
      [req.user.id],
    )

    // Get total commission pending
    const commissionResult = await pool.query(
      `SELECT SUM(commission_amount) as total_pending
       FROM referral_commissions
       WHERE referrer_id = $1 AND status = 'pending'`,
      [req.user.id],
    )

    // Get total commission credited
    const creditedResult = await pool.query(
      `SELECT SUM(commission_amount) as total_credited
       FROM referral_commissions
       WHERE referrer_id = $1 AND status = 'credited'`,
      [req.user.id],
    )

    res.json({
      total_referrals: parseInt(referralsResult.rows[0].count),
      commission_pending: parseFloat(commissionResult.rows[0].total_pending) || 0,
      commission_credited: parseFloat(creditedResult.rows[0].total_credited) || 0,
    })
  } catch (err) {
    console.error('Get referral stats error:', err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// GET /api/referrals/history — get all referrals and commissions for current user
router.get('/history', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        r.id,
        u.name,
        u.email,
        r.referred_at,
        COUNT(CASE WHEN rc.status = 'pending' THEN 1 END) as pending_deposits,
        SUM(CASE WHEN rc.status = 'pending' THEN rc.commission_amount ELSE 0 END) as pending_commission,
        SUM(CASE WHEN rc.status = 'credited' THEN rc.commission_amount ELSE 0 END) as credited_commission
       FROM referrals r
       LEFT JOIN users u ON r.referred_user_id = u.id
       LEFT JOIN referral_commissions rc ON r.referred_user_id IN (
         SELECT referred_user_id FROM referrals WHERE referrer_id = $1
       ) AND rc.referrer_id = $1
       WHERE r.referrer_id = $1
       GROUP BY r.id, u.id, u.name, u.email, r.referred_at
       ORDER BY r.referred_at DESC`,
      [req.user.id],
    )

    res.json({ referrals: result.rows })
  } catch (err) {
    console.error('Get referral history error:', err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// POST /api/referrals/join — sign up as referred user
router.post('/join', async (req, res) => {
  const { referral_code, email } = req.body

  try {
    if (!referral_code || !email) {
      return res.status(400).json({ error: 'Referral code and email required.' })
    }

    // Verify referral code exists and get referrer ID
    const codeResult = await pool.query(
      `SELECT user_id FROM referral_codes WHERE code = $1`,
      [referral_code],
    )

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid referral code.' })
    }

    const referrer_id = codeResult.rows[0].user_id

    // Store referral (will be linked to user after signup completes)
    // The actual signup handler will call POST /api/referrals/confirm after user created
    req.referral = { referrer_id, referral_code }
    res.json({ ready_to_signup: true })
  } catch (err) {
    console.error('Join referral error:', err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// POST /api/referrals/confirm — confirm referral after signup (called by auth.js)
router.post('/confirm', auth, async (req, res) => {
  const { referrer_id, referral_code } = req.body

  try {
    if (!referrer_id || !referral_code) {
      return res.status(400).json({ error: 'Referrer and code required.' })
    }

    // Prevent self-referrals
    if (referrer_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot refer yourself.' })
    }

    // Check if already referred
    const existing = await pool.query(
      `SELECT id FROM referrals WHERE referred_user_id = $1`,
      [req.user.id],
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already has a referrer.' })
    }

    // Create referral record
    await pool.query(
      `INSERT INTO referrals (referrer_id, referred_user_id, referral_code)
       VALUES ($1, $2, $3)`,
      [referrer_id, req.user.id, referral_code],
    )

    // Increment code uses
    await pool.query(
      `UPDATE referral_codes SET uses = uses + 1 WHERE code = $1`,
      [referral_code],
    )

    res.json({ success: true })
  } catch (err) {
    console.error('Confirm referral error:', err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

// POST /api/referrals/process-commissions — called by deposits route to create commission records
router.post('/process-commissions', async (req, res) => {
  const { deposit_id } = req.body

  try {
    // Get deposit details
    const depositResult = await pool.query(
      `SELECT user_id, amount FROM deposits WHERE id = $1`,
      [deposit_id],
    )

    if (depositResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deposit not found.' })
    }

    const { user_id: referred_user_id, amount } = depositResult.rows[0]

    // Get referrer for this user
    const referralResult = await pool.query(
      `SELECT referrer_id FROM referrals WHERE referred_user_id = $1`,
      [referred_user_id],
    )

    if (referralResult.rows.length === 0) {
      return res.status(200).json({ no_referrer: true })
    }

    const referrer_id = referralResult.rows[0].referrer_id
    const commission_rate = 3.0
    const commission_amount = (amount * commission_rate) / 100

    // Create commission record
    await pool.query(
      `INSERT INTO referral_commissions (referrer_id, deposit_id, commission_amount, commission_rate)
       VALUES ($1, $2, $3, $4)`,
      [referrer_id, deposit_id, commission_amount, commission_rate],
    )

    res.json({ success: true, commission_amount })
  } catch (err) {
    console.error('Process commissions error:', err)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

export default router

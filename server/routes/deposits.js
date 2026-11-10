import { Router } from 'express'
import { z } from 'zod'
import pool from '../db.js'
import auth from '../middleware/auth.js'

const router = Router()

// Which asset/network combos users can deposit into.
// wallet_address MUST match the QR codes shown on the deposit page.
const WALLETS = {
  BTC: [
    { network: 'Bitcoin (BTC)', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
  ],
  ETH: [
    { network: 'Ethereum (ERC20)', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
  ],
  USDT: [
    { network: 'Tron (TRC20)', address: 'TQn9Y2khDD95J42FQtQTdwVVRZqiTqJoUB' },
    { network: 'Ethereum (ERC20)', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
  ],
}

// Public endpoint the deposit page uses to show addresses + QRs
router.get('/methods', auth, (_req, res) => {
  res.json({ methods: WALLETS })
})

const depositSchema = z.object({
  asset: z.enum(['BTC', 'ETH', 'USDT']),
  network: z.string().min(1).max(40),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  tx_hash: z.string().min(10, 'Transaction hash is required').max(190),
})

// GET /api/deposits — current user's deposit history
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, asset, network, amount, wallet_address, tx_hash, status, created_at
       FROM deposits WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id],
    )
    res.json({ deposits: result.rows })
  } catch (err) {
    console.error('List deposits error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// POST /api/deposits — user submits a deposit with tx hash proof (auto-confirmed)
router.post('/', auth, async (req, res) => {
  try {
    const parsed = depositSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message })
    }
    const { asset, network, amount, tx_hash } = parsed.data

    const method = WALLETS[asset]?.find((m) => m.network === network)
    if (!method) {
      return res.status(400).json({ error: 'Unsupported asset or network.' })
    }

    const dup = await pool.query(
      'SELECT id FROM deposits WHERE user_id = $1 AND tx_hash = $2',
      [req.user.id, tx_hash],
    )
    if (dup.rows.length > 0) {
      return res.status(409).json({ error: 'This transaction hash was already submitted.' })
    }

    const result = await pool.query(
      `INSERT INTO deposits (user_id, asset, network, amount, wallet_address, tx_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, asset, network, amount, wallet_address, tx_hash, status, created_at`,
      [req.user.id, asset, network, amount, method.address, tx_hash, 'confirmed'],
    )

    // Process referral commission if user was referred
    const depositId = result.rows[0].id
    try {
      await fetch('http://localhost:4000/api/referrals/process-commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deposit_id: depositId }),
      }).catch(() => {})
    } catch (err) {
      console.error('Commission processing error (non-fatal):', err)
    }

    res.status(201).json({ deposit: result.rows[0] })
  } catch (err) {
    console.error('Create deposit error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

export default router

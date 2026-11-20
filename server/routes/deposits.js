import { Router } from 'express'
import { z } from 'zod'
import pool from '../db.js'
import auth from '../middleware/auth.js'

const router = Router()

// Which asset/network combos users can deposit into.
// wallet_address MUST match the QR codes shown on the deposit page.
const WALLETS = {
  BTC: [
    { network: 'Bitcoin (BTC)', address: 'bc1quwdd2hpugxyfadec9g37j8tyn8s5l04ytqswhc', qr: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bitcoin:bc1quwdd2hpugxyfadec9g37j8tyn8s5l04ytqswhc' },
  ],
  ETH: [
    { network: 'Ethereum (ERC20)', address: '0xe2C8B7f619c3F4f51b390CCE6623c4E8a940A285', qr: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0xe2C8B7f619c3F4f51b390CCE6623c4E8a940A285' },
  ],
  USDT: [
    { network: 'Tron (TRC20)', address: 'TCiM8LQ321Et6jocFVWuAkp7U8UNU9rCQA', qr: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=tron:TCiM8LQ321Et6jocFVWuAkp7U8UNU9rCQA' },
    { network: 'Arbitrum (ERC20)', address: '0xe2C8B7f619c3F4f51b390CCE6623c4E8a940A285', qr: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0xe2C8B7f619c3F4f51b390CCE6623c4E8a940A285' },
    { network: 'BNB Smart Chain (BEP20)', address: '0xe2C8B7f619c3F4f51b390CCE6623c4E8a940A285', qr: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0xe2C8B7f619c3F4f51b390CCE6623c4E8a940A285' },
  ],
}

// Public endpoint the deposit page uses to show addresses + QRs
router.get('/methods', auth, (_req, res) => {
  res.json({ methods: WALLETS })
})

const depositSchema = z.object({
  asset: z.enum(['BTC', 'ETH', 'USDT']),
  network: z.string().min(1).max(40),
  amount: z.coerce.number().nonnegative('Amount must be 0 or greater').optional().default(0),
  tx_hash: z.string().min(10, 'Transaction hash is required').max(190).optional(),
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

    if (tx_hash) {
      const dup = await pool.query(
        'SELECT id FROM deposits WHERE user_id = $1 AND tx_hash = $2',
        [req.user.id, tx_hash],
      )
      if (dup.rows.length > 0) {
        return res.status(409).json({ error: 'This transaction hash was already submitted.' })
      }
    }

    const result = await pool.query(
      `INSERT INTO deposits (user_id, asset, network, amount, wallet_address, tx_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, asset, network, amount, wallet_address, tx_hash, status, created_at`,
      [req.user.id, asset, network, amount, method.address, tx_hash || null, 'pending'],
    )

    // Process referral commission if the depositor was referred (in-process, no self-HTTP)
    const depositId = result.rows[0].id
    try {
      const refRes = await pool.query(
        'SELECT referrer_id FROM referrals WHERE referred_user_id = $1',
        [req.user.id],
      )
      if (refRes.rows.length > 0) {
        const referrer_id = refRes.rows[0].referrer_id
        const commission_rate = 3.0
        const commission_amount = (Number(amount) * commission_rate) / 100
        if (commission_amount > 0) {
          await pool.query(
            `INSERT INTO referral_commissions (referrer_id, deposit_id, commission_amount, commission_rate)
             VALUES ($1, $2, $3, $4)`,
            [referrer_id, depositId, commission_amount, commission_rate],
          )
        }
      }
    } catch (err) {
      console.error('Commission processing error (non-fatal):', err)
    }

    res.status(201).json({
      deposit: result.rows[0],
      message: tx_hash
        ? 'Deposit submitted. Admin will review and confirm it shortly.'
        : 'Deposit registered. We are scanning the blockchain for your transaction — this page updates automatically.',
    })
  } catch (err) {
    console.error('Create deposit error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

export default router

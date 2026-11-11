import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// GET /api/currency/rates - Get all exchange rates
router.get('/rates', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT from_currency, to_currency, rate, updated_at 
      FROM currency_rates 
      ORDER BY from_currency, to_currency
    `)
    res.json({ rates: result.rows })
  } catch (err) {
    console.error('Currency rates error:', err.message)
    res.status(500).json({ error: 'Failed to fetch exchange rates' })
  }
})

// GET /api/currency/convert - Convert between currencies
router.get('/convert', async (req, res) => {
  const { from, to, amount } = req.query
  
  if (!from || !to || !amount) {
    return res.status(400).json({ error: 'Missing from, to, or amount parameter' })
  }

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' })
  }

  try {
    let rate
    
    // Check if direct conversion exists
    let result = await pool.query(
      'SELECT rate FROM currency_rates WHERE from_currency = $1 AND to_currency = $2',
      [from.toUpperCase(), to.toUpperCase()]
    )
    
    if (result.rows.length > 0) {
      rate = result.rows[0].rate
    } else {
      // Try reverse conversion
      result = await pool.query(
        'SELECT rate FROM currency_rates WHERE from_currency = $1 AND to_currency = $2',
        [to.toUpperCase(), from.toUpperCase()]
      )
      
      if (result.rows.length > 0) {
        rate = 1 / result.rows[0].rate
      } else {
        return res.status(404).json({ error: `No conversion rate found for ${from} to ${to}` })
      }
    }

    const convertedAmount = (parseFloat(amount) * rate).toFixed(8)
    res.json({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount: parseFloat(amount),
      converted_amount: parseFloat(convertedAmount),
      rate: rate
    })
  } catch (err) {
    console.error('Conversion error:', err.message)
    res.status(500).json({ error: 'Conversion failed' })
  }
})

// POST /api/currency/rates - Update exchange rate (admin only)
router.post('/rates', async (req, res) => {
  const { from, to, rate, rate_source } = req.body
  
  if (!from || !to || !rate) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const result = await pool.query(`
      INSERT INTO currency_rates (from_currency, to_currency, rate, rate_source, updated_at)
      VALUES ($1, $2, $3, $4, now())
      ON CONFLICT (from_currency, to_currency) 
      DO UPDATE SET rate = $3, rate_source = $4, updated_at = now()
      RETURNING *
    `, [from.toUpperCase(), to.toUpperCase(), rate, rate_source || 'manual'])
    
    res.json({ rate: result.rows[0] })
  } catch (err) {
    console.error('Rate update error:', err.message)
    res.status(500).json({ error: 'Failed to update rate' })
  }
})

// GET /api/currency/user-assets/:userId - Get user's assets in all currencies
router.get('/user-assets/:userId', async (req, res) => {
  const { userId } = req.params
  const { convert_to } = req.query

  try {
    const result = await pool.query(
      'SELECT asset_type, amount FROM user_assets WHERE user_id = $1 ORDER BY asset_type',
      [userId]
    )

    let assets = result.rows

    // Convert all to target currency if requested
    if (convert_to) {
      const converted = []
      for (const asset of assets) {
        let convRate = 1
        
        if (asset.asset_type !== convert_to.toUpperCase()) {
          const rateResult = await pool.query(
            'SELECT rate FROM currency_rates WHERE from_currency = $1 AND to_currency = $2',
            [asset.asset_type, convert_to.toUpperCase()]
          )
          
          if (rateResult.rows.length > 0) {
            convRate = rateResult.rows[0].rate
          }
        }

        converted.push({
          asset_type: asset.asset_type,
          original_amount: asset.amount,
          converted_amount: (parseFloat(asset.amount) * convRate).toFixed(8),
          target_currency: convert_to.toUpperCase()
        })
      }
      return res.json({ assets: converted })
    }

    res.json({ assets })
  } catch (err) {
    console.error('User assets error:', err.message)
    res.status(500).json({ error: 'Failed to fetch user assets' })
  }
})

export default router

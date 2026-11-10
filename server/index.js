import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import pool from './db.js'
import authRoutes from './routes/auth.js'
import transactionRoutes from './routes/transactions.js'
import depositRoutes from './routes/deposits.js'
import investmentRoutes from './routes/investments.js'
import withdrawalRoutes from './routes/withdrawals.js'
import adminRoutes from './routes/admin.js'
import referralRoutes from './routes/referrals.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

// Routes BEFORE rate limiter for priority
app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/deposits', depositRoutes)
app.use('/api/investments', investmentRoutes)
app.use('/api/withdrawals', withdrawalRoutes)
console.log('About to register admin routes...')
console.log('adminRoutes type:', typeof adminRoutes)
console.log('adminRoutes:', adminRoutes.toString().substring(0, 100))
app.use('/api/admin', adminRoutes)
console.log('Admin routes registered!')
app.use('/api/referrals', referralRoutes)

// global limiter after routes
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }))

console.log('Routes registered: auth, transactions, deposits, investments, withdrawals, admin, referrals')



app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  } catch {
    res.status(500).json({ ok: false, error: 'Database not connected' })
  }
})

import auth from './middleware/auth.js'

app.get('/api/me', auth, async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [req.user.id],
  )
  res.json({ user: result.rows[0] })
})

// Catch-all 404 handler
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.path}`)
  res.status(404).json({ error: 'Not found' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Nexora API running on http://localhost:${PORT}`)
})

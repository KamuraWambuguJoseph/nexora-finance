import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from './db.js'
import authRoutes from './routes/auth.js'
import transactionRoutes from './routes/transactions.js'
import depositRoutes from './routes/deposits.js'
import investmentRoutes from './routes/investments.js'
import investmentProgramsRoutes from './routes/investmentPrograms.js'
import withdrawalRoutes from './routes/withdrawals.js'
import adminRoutes from './routes/admin.js'
import referralRoutes from './routes/referrals.js'
import currencyRoutes from './routes/currency.js'
import profileRoutes from './routes/profile.js'
import auth from './middleware/auth.js'
import { startDailyEarningsJob } from './jobs/dailyEarnings.js'

const app = express()

// Behind Render/Railway/Fly proxy — trust it so req.ip is the real client IP for rate limiting
app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

// General API rate limit — protects every route from basic abuse
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }))

// Stricter limit on auth — brute-force / credential-stuffing protection
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }))

app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/deposits', depositRoutes)
app.use('/api/investment-programs', investmentProgramsRoutes)
app.use('/api/investments', investmentRoutes)
app.use('/api/withdrawals', withdrawalRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/referrals', referralRoutes)
app.use('/api/currency', currencyRoutes)
app.use('/api/profile', profileRoutes)

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  } catch (err) {
    console.error('Health check error:', err.message)
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.get('/api/me', auth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, membership_id, preferred_currency, phone, address, country,
            two_factor_enabled, is_admin, created_at
       FROM users WHERE id = $1`,
    [req.user.id],
  )
  res.json({ user: result.rows[0] })
})

// Serve built frontend in production (single-container deploy).
// In dev the frontend runs separately on Vite (5173) and this is skipped.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.join(__dirname, '..', 'dist')
if (process.env.NODE_ENV === 'production' && process.env.SERVE_FRONTEND !== 'false') {
  app.use(express.static(distPath))
  // SPA fallback: send index.html for any non-API route
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// Catch-all 404 handler — last middleware
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Nexora API running on port ${PORT}`)
  startDailyEarningsJob()
  console.log('Daily earnings job started')
})
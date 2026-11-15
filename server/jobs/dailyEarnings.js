import pool from '../db.js'
import cron from 'node-cron'

// ---------------------------------------------------------------------------
// Daily earnings job
// Credits every active investment its daily yield for each elapsed 24h day.
// Idempotent: it credits (days elapsed - days already credited) each run,
// so the result is correct no matter when/how often the job fires.
// Principal stays locked until maturity, then is freed automatically.
// ---------------------------------------------------------------------------

function dailyAmount(amount, dailyRatePct) {
  const rate = Number(dailyRatePct) / 100
  return Number(amount) * rate
}

export async function runDailyEarnings() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Active investments with yield configured
    const { rows } = await client.query(
      `SELECT ui.id, ui.user_id, ui.amount, ui.duration_days, ui.started_at, ui.matures_at,
              ui.last_credited_at, p.daily_rate_pct,
              COALESCE((SELECT MAX(day_index) FROM investment_earnings WHERE investment_id = ui.id), 0) AS days_paid
         FROM user_investments ui
         JOIN investment_programs p ON p.id = ui.program_id
        WHERE ui.status = 'active'
        FOR UPDATE OF ui`,
    )

    let creditedCount = 0
    for (const inv of rows) {
      const daily = dailyAmount(inv.amount, inv.daily_rate_pct)
      if (daily <= 0) continue

      // How many full 24h days have elapsed since the investment started
      const elapsedDays = Math.floor((Date.now() - new Date(inv.started_at).getTime()) / (24 * 60 * 60 * 1000))
      // Cap at the term length so we never over-credit past maturity
      const owedDays = Math.min(elapsedDays, Number(inv.duration_days))
      const daysPaid = Number(inv.days_paid)
      const toCredit = owedDays - daysPaid

      if (toCredit > 0) {
        // Insert one earnings row per owed day (audit trail), then bump totals
        for (let d = daysPaid + 1; d <= owedDays; d++) {
          await client.query(
            `INSERT INTO investment_earnings (user_id, investment_id, amount, day_index)
             VALUES ($1, $2, $3, $4)`,
            [inv.user_id, inv.id, daily, d],
          )
        }
        const totalCredit = daily * toCredit
        await client.query(
          `UPDATE user_investments
              SET total_earned = total_earned + $2,
                  last_credited_at = now(),
                  updated_at = now()
            WHERE id = $1`,
          [inv.id, totalCredit],
        )
        await client.query(
          `UPDATE users SET total_assets = COALESCE(total_assets, 0) + $2 WHERE id = $1`,
          [inv.user_id, totalCredit],
        )
        creditedCount += toCredit
      } else {
        // No new day due — advance timer so it's not re-scanned unnecessarily
        await client.query(
          `UPDATE user_investments SET last_credited_at = now(), updated_at = now() WHERE id = $1`,
          [inv.id],
        )
      }
    }

    // Maturity pass: flip active investments whose term has ended.
    // Once status != 'active', the principal is no longer counted as locked,
    // so it is freed back to the user's available balance automatically.
    const matured = await client.query(
      `UPDATE user_investments
          SET status = 'matured', days_remaining = 0, updated_at = now()
        WHERE status = 'active'
          AND matures_at <= now()
        RETURNING id, user_id`,
    )

    await client.query('COMMIT')
    if (creditedCount > 0 || matured.rows.length > 0) {
      console.log(`Daily earnings: ${creditedCount} day-credits across investments; ${matured.rows.length} matured (principal returned)`)
    }
    return { creditedDays: creditedCount, matured: matured.rows.length }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Daily earnings job failed:', err.message)
    return { creditedDays: 0, error: err.message }
  } finally {
    client.release()
  }
}

// Run once at startup (catches anything missed while server was down),
// then hourly. Because the job is idempotent (elapsed-days based), hourly
// firing simply means each day's credit lands within ~1h of its 24h mark.
// Startup run is deferred so a transient DB hiccup at boot never crashes the app.
export function startDailyEarningsJob() {
  const safeRun = async () => {
    try {
      await runDailyEarnings()
    } catch (err) {
      // runDailyEarnings already catches internally, but guard against
      // pool-connect errors that happen before the try block.
      console.error('Daily earnings job error:', err.message)
    }
  }
  // Defer slightly so the server is fully listening before the first run
  setTimeout(safeRun, 5000)
  cron.schedule('0 * * * *', safeRun)
}
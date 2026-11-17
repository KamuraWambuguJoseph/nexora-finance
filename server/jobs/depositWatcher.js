import pool from '../db.js'
import nodeCron from 'node-cron'

const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken'

// Convert an amount in asset units to a normalized number.
function toNum(x) { return Number(x) }

async function fetchJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Nexora/1.0' } })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}

// Returns array of { hash, amount, time } for incoming txs to an address.
async function fetchIncoming(asset, network, address) {
  if (asset === 'BTC') {
    // Blockstream: confirmed txs only
    const data = await fetchJson(`https://blockstream.info/api/address/${address}/txs`)
    const out = []
    for (const t of data || []) {
      let amt = 0
      for (const v of t.vout || []) {
        if ((v.scriptpubkey_address || '') === address) amt += v.value || 0
      }
      out.push({ hash: t.txid, amount: amt / 1e8, time: (t.status?.block_time || 0) * 1000 })
    }
    return out
  }
  if (asset === 'ETH' && network.includes('ERC20') === false) {
    // native ETH via Etherscan
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&apikey=${ETHERSCAN_KEY}`
    const data = await fetchJson(url)
    const out = []
    for (const t of data?.result || []) {
      if (t.to?.toLowerCase() !== address.toLowerCase()) continue
      if (t.isError !== '0') continue
      out.push({ hash: t.hash, amount: Number(t.value) / 1e18, time: Number(t.timeStamp) * 1000 })
    }
    return out
  }
  if (asset === 'USDT' && network.includes('TRC20')) {
    const data = await fetchJson(`https://apilist.tronscan.org/api/transaction?address=${address}&limit=50&start=0&direction=in`)
    const out = []
    for (const t of data?.data || []) {
      if (!t.confirmed) continue
      // tronscan amount is in sun (6 decimals for USDT)
      const amt = (t.amount || 0) / 1e6
      out.push({ hash: t.hash, amount: amt, time: t.timestamp || 0 })
    }
    return out
  }
  if (asset === 'USDT' && network.includes('ERC20')) {
    const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&sort=desc&apikey=${ETHERSCAN_KEY}`
    const data = await fetchJson(url)
    const out = []
    for (const t of data?.result || []) {
      if (t.to?.toLowerCase() !== address.toLowerCase()) continue
      if (t.tokenSymbol !== 'USDT') continue
      out.push({ hash: t.hash, amount: Number(t.value) / Math.pow(10, Number(t.tokenDecimal || 6)), time: Number(t.timeStamp) * 1000 })
    }
    return out
  }
  if (asset === 'ETH' && network.includes('ERC20')) {
    // ETH is native; USDT ERC20 handled above. ETH ERC20 not a deposit option.
    return []
  }
  return []
}

async function scanPending() {
  try {
    const { rows } = await pool.query(
      `SELECT id, asset, network, amount, wallet_address, created_at
       FROM deposits WHERE status = 'pending' AND tx_hash IS NULL`
    )
    if (!rows.length) return

    // cache fetched tx lists per (asset,network,address)
    const cache = new Map()
    async function getTxs(dep) {
      const key = dep.asset + '|' + dep.network + '|' + dep.wallet_address
      if (cache.has(key)) return cache.get(key)
      const txs = await fetchIncoming(dep.asset, dep.network, dep.wallet_address)
      cache.set(key, txs)
      return txs
    }

    // track used hashes within this run to avoid double-assign
    const used = new Set()
    // also fetch already-used hashes
    const { rows: usedRows } = await pool.query(`SELECT tx_hash FROM deposits WHERE tx_hash IS NOT NULL`)
    for (const r of usedRows) used.add(r.tx_hash)

    for (const dep of rows) {
      let txs
      try { txs = await getTxs(dep) } catch (e) {
        console.error('Watcher fetch error:', dep.asset, dep.network, e.message)
        continue
      }
      const created = new Date(dep.created_at).getTime()
      const windowStart = created - 2 * 60 * 60 * 1000 // 2h before
      const amount = Number(dep.amount)
      const tol = Math.max(amount * 0.02, 1e-8)

      const match = txs.find((t) => {
        if (used.has(t.hash)) return false
        if (t.time && t.time < windowStart) return false
        return Math.abs(t.amount - amount) <= tol
      })

      if (match) {
        used.add(match.hash)
        await pool.query(
          `UPDATE deposits SET tx_hash = $1 WHERE id = $2 AND tx_hash IS NULL`,
          [match.hash, dep.id]
        )
        console.log(`Watcher: deposit #${dep.id} matched tx ${match.hash} (${match.amount})`)
      }
    }
  } catch (err) {
    console.error('Deposit watcher error:', err.message)
  }
}

export function startDepositWatcher() {
  // every 3 minutes
  nodeCron.schedule('*/3 * * * *', scanPending)
  // run once shortly after start
  setTimeout(scanPending, 15000)
  console.log('Deposit watcher started')
}

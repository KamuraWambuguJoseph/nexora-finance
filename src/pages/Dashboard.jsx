import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { api, getToken, logout } from '../lib/api.js'
import InvestmentPrograms from '../components/InvestmentPrograms.jsx'
import qrBtc from '../assets/payments/qr-btc.jpg'
import qrEth from '../assets/payments/qr-eth.jpg'
import qrUsdtTron from '../assets/payments/qr-usdt-tron.jpg'
import qrUsdtEth from '../assets/payments/qr-usdt-eth.jpg'
import qrUsdtArbitrum from '../assets/payments/qr-4.jpg'
import qrBnb from '../assets/payments/qr-bnb.jpg'
import qrSolana from '../assets/payments/qr-solana.jpg'
import iconBtc from '../assets/payments/icon-btc.png'
import iconEth from '../assets/payments/icon-eth.png'
import iconUsdtTron from '../assets/payments/icon-usdt-tron.png'
import iconUsdtEth from '../assets/payments/icon-usdt-eth.png'
import iconUsdtArbitrum from '../assets/payments/icon-usdt-arbitrum.png'
import iconBnb from '../assets/payments/icon-bnb.png'
import iconSol from '../assets/payments/icon-sol.png'

const money = (n) =>
  Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

// Wallet addresses — each paired with the matching deposit QR code image and network icon
const WALLETS = {
  BTC: [
    { network: 'Bitcoin (BTC)', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', qr: qrBtc, icon: iconBtc },
  ],
  ETH: [
    { network: 'Ethereum (ERC20)', address: '0xe2C8B7f619c3F4f51b390CCE6623c4E8a940A285', qr: qrEth, icon: iconEth },
  ],
  USDT: [
    { network: 'Tron (TRC20)', address: 'TCiM8LQ321Et6jocFVWuAkp7U8UNU9rCQA', qr: qrUsdtTron, icon: iconUsdtTron },
    { network: 'Ethereum (ERC20)', address: '0xe2C8B7f619c3F4f51b390CCE6623c4E8a940A285', qr: qrUsdtEth, icon: iconUsdtEth },
    { network: 'Arbitrum (ERC20)', address: '0xe2C8B7f619c3F4f51b390CCE6623c4E8a940A285', qr: qrUsdtArbitrum, icon: iconUsdtArbitrum },
  ],
  BNB: [
    { network: 'BNB Smart Chain (BEP20)', address: '0xe2C8B7f619c3F4f51b390CCE6623c4E8a940A285', qr: qrBnb, icon: iconBnb },
  ],
  SOL: [
    { network: 'Solana (SOL)', address: 'FwSqnqvBSY1fiNRiXyvmF3AcBAVHHYQKVZSoatN8zeBM', qr: qrSolana, icon: iconSol },
  ],
}

const STATUS_STYLE = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
  active: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
}

function StatusPill({ status }) {
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[status] || 'border-slate-600 text-slate-400'}`}>
      {status}
    </span>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const [user, setUser] = useState(null)
  const [deposits, setDeposits] = useState([])
  const [investments, setInvestments] = useState([])
  const [programs, setPrograms] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [tab, setTab] = useState('overview')

  // deposit form state
  const [asset, setAsset] = useState('USDT')
  const [network, setNetwork] = useState(WALLETS.USDT[0].network)
  const [depAmount, setDepAmount] = useState('')
  const [txHash, setTxHash] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // withdrawal form state
  const [withdrawAsset, setWithdrawAsset] = useState('BTC')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)

  // collapsible withdrawal panels
  const [showPending, setShowPending] = useState(false)
  const [showWithdrawalHistory, setShowWithdrawalHistory] = useState(false)
  const [showDepositHistory, setShowDepositHistory] = useState(false)
  const [referralCode, setReferralCode] = useState(null)
  const [referralStats, setReferralStats] = useState(null)
  const [referralHistory, setReferralHistory] = useState([])
  const [showInvestmentHistory, setShowInvestmentHistory] = useState(false)

  // withdrawal celebration popup
  const [withdrawSuccess, setWithdrawSuccess] = useState(null)

  useEffect(() => {
    if (!getToken()) {
      navigate('/login')
      return
    }
    load()
  }, [])

  // Auto-refresh deposits every 15s so auto-detected transactions appear without manual reload
  useEffect(() => {
    if (!getToken()) return
    const id = setInterval(async () => {
      try {
        const deps = await api('/api/deposits', { auth: true })
        setDeposits(deps.deposits)
      } catch { /* ignore */ }
    }, 15000)
    return () => clearInterval(id)
  }, [])

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true)
    setError('')
    try {
      const [me, deps, invs, progs] = await Promise.all([
        api('/api/me', { auth: true }),
        api('/api/deposits', { auth: true }),
        api('/api/investments', { auth: true }),
        api('/api/investments/programs'),
      ])
      setUser(me.user)
      setDeposits(deps.deposits)
      setInvestments(invs.investments)
      setPrograms(progs.programs || [])

      // Load referrals (non-blocking)
      try {
        const [codeRes, statsRes, histRes] = await Promise.all([
          api('/api/referrals/my-code', { auth: true }),
          api('/api/referrals/stats', { auth: true }),
          api('/api/referrals/history', { auth: true }),
        ])
        setReferralCode(codeRes?.referral_code?.code || null)
        setReferralStats(statsRes)
        setReferralHistory(histRes?.referrals || [])
      } catch (e) {
        console.log('Referrals not available yet')
      }

      // Load withdrawals separately to avoid blocking if endpoint has issues
      try {
        const withs = await api('/api/withdrawals', { auth: true })
        setWithdrawals(withs.withdrawals)
      } catch (e) {
        console.log('Withdrawals not available yet')
        setWithdrawals([])
      }
    } catch (err) {
      setError(err.message)
      if (err.message.includes('Session expired')) {
        logout()
        navigate('/login')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const confirmedDeposits = deposits
    .filter((d) => d.status === 'confirmed')
    .reduce((s, d) => s + Number(d.amount), 0)
  const pendingDeposits = deposits
    .filter((d) => d.status === 'pending')
    .reduce((s, d) => s + Number(d.amount), 0)
  const activeInvested = investments
    .filter((i) => i.status === 'active')
    .reduce((s, i) => s + Number(i.amount), 0)
  const expectedReturn = investments
    .filter((i) => i.status === 'active')
    .reduce((s, i) => s + Number(i.amount) * (1 + Number(i.roi_percent) / 100), 0)
  const pendingWithdrawn = withdrawals
    .filter((w) => w.status === 'pending' || w.status === 'released')
    .reduce((s, w) => s + Number(w.amount), 0)
  const totalEarned = investments
    .reduce((s, i) => s + Number(i.total_earned || 0), 0)
  const available = confirmedDeposits - activeInvested - pendingWithdrawn + totalEarned

  const onDeposit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      const body = { asset, network }
      if (depAmount.trim()) body.amount = Number(depAmount)
      if (txHash.trim()) body.tx_hash = txHash.trim()
      const data = await api('/api/deposits', {
        method: 'POST',
        auth: true,
        body,
      })
      setDeposits((prev) => [data.deposit, ...prev])
      setDepAmount('')
      setTxHash('')
      setNotice(
        txHash.trim()
          ? 'Deposit submitted. Admin will review and confirm it shortly — your balance updates once confirmed.'
          : 'Deposit registered. We are scanning the blockchain for your transaction — this page updates automatically.',
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const onWithdraw = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setWithdrawing(true)
    try {
      const data = await api('/api/withdrawals', {
        method: 'POST',
        auth: true,
        body: {
          asset: withdrawAsset,
          amount: Number(withdrawAmount),
          wallet_address: withdrawAddress.trim(),
        },
      })
      setWithdrawals((prev) => [data.withdrawal, ...prev])
      setWithdrawAmount('')
      setWithdrawAddress('')
      setWithdrawSuccess({
        amount: Number(withdrawAmount),
        asset: withdrawAsset,
      })
      setNotice(
        'Withdrawal request submitted and release within 5–10 minutes.',
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setWithdrawing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
          <p className="text-sm text-slate-400">Loading your portfolio…</p>
        </div>
      </div>
    )
  }

  const currentWallet = WALLETS[asset].find((w) => w.network === network)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-black text-slate-950">
              N
            </span>
            <span className="text-lg font-bold tracking-tight">Nexora</span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-slate-950">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </span>
                <span className="text-sm text-slate-300">{user.name}</span>
              </div>
            )}
          </div>
        </div>
        {/* tabs */}
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex gap-1 overflow-x-auto">
            {['overview', 'deposit', 'invest', 'withdraw', 'referral', 'history'].map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => { setTab(tabKey); setError(''); setNotice('') }}
                className={`relative shrink-0 px-4 py-2.5 text-sm font-medium capitalize transition
                  ${tab === tabKey ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {t(`nav.${tabKey}`)}
                {tab === tabKey && (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-emerald-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {error && (
          <p className="mb-6 rounded-xl border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}
        {notice && (
          <p className="mb-6 rounded-xl border border-emerald-800 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300">
            {notice}
          </p>
        )}

        {/* ============ OVERVIEW ============ */}
        {tab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Portfolio Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {[
                [t('dashboard.balance'), available, 'text-emerald-400'],
                [t('dashboard.deposits'), pendingDeposits, 'text-amber-400'],
                [t('dashboard.investments'), activeInvested, 'text-sky-400'],
                [t('dashboard.earned'), totalEarned, 'text-teal-400'],
                [t('dashboard.projected'), expectedReturn, 'text-white'],
              ].map(([label, value, cls]) => (
                <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-slate-700 sm:p-5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 sm:text-xs">{label}</p>
                  <p className={`mt-1.5 truncate text-lg font-bold sm:mt-2 sm:text-2xl ${cls}`}>{money(value)}</p>
                </div>
              ))}
            </div>

            {/* Mobile quick actions */}
            <div className="grid grid-cols-3 gap-2 sm:hidden">
              <button
                onClick={() => { setTab('deposit'); setError(''); setNotice('') }}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-xs font-semibold text-slate-950 transition active:brightness-95"
              >
                + Deposit
              </button>
              <button
                onClick={() => { setTab('withdraw'); setError(''); setNotice('') }}
                className="rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-semibold text-slate-200 transition active:bg-slate-800"
              >
                Withdraw
              </button>
              <button
                onClick={() => { setTab('invest'); setError(''); setNotice('') }}
                className="rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-semibold text-slate-200 transition active:bg-slate-800"
              >
                Invest
              </button>
            </div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
                <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
                  <h2 className="text-sm font-semibold sm:text-base">Active investments</h2>
                  <button
                    onClick={() => setTab('invest')}
                    className="shrink-0 text-xs text-emerald-400 hover:text-emerald-300 sm:text-sm"
                  >
                    + New investment
                  </button>
                </div>
                {investments.filter((i) => i.status === 'active' || i.status === 'pending').length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center">
                    <p className="text-sm text-slate-500">No active investments yet.</p>
                    <button
                      onClick={() => setTab('invest')}
                      className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400"
                    >
                      Choose a plan
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {investments
                      .filter((i) => i.status === 'active' || i.status === 'pending')
                      .map((i) => {
                        const started = new Date(i.started_at).getTime()
                        const matures = new Date(i.matures_at).getTime()
                        const now = Date.now()
                        const totalDays = matures - started
                        const elapsed = now - started
                        const progress = Math.min(100, Math.max(0, (elapsed / totalDays) * 100))
                        const daysRemaining = Math.ceil((matures - now) / (1000 * 60 * 60 * 24))
                        return (
                          <li
                            key={i.id}
                            className="rounded-xl border border-slate-800 bg-slate-950 p-3 sm:p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                <p className="truncate font-medium">{i.program_name}</p>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                    i.status === 'pending'
                                      ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                                      : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                                  }`}
                                >
                                  {i.status}
                                </span>
                              </div>
                              <p className="shrink-0 font-semibold text-white">{money(i.amount)}</p>
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">
                              Ref #{i.reference} · {Number(i.roi_percent)}% ROI over {i.duration_days} days
                            </p>
                            {i.daily_rate_pct && Number(i.daily_rate_pct) > 0 && (
                              <p className="mt-0.5 truncate text-[11px] font-medium text-emerald-400/90 sm:text-xs">
                                {money(Number(i.amount) * (Number(i.daily_rate_pct) / 100))}/day
                                ({Number(i.daily_rate_pct)}% daily)
                              </p>
                            )}
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-slate-700 bg-slate-800/50">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-600 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 sm:text-xs">
                              <span>Started {new Date(i.started_at).toLocaleDateString()}</span>
                              <span>
                                {daysRemaining > 0 ? `${daysRemaining} days left` : 'Matured'}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <p className="truncate text-[11px] font-semibold text-emerald-400 sm:text-xs">
                                Earned: {money(Number(i.total_earned || 0))}
                                {i.last_earning ? ` · +${money(Number(i.last_earning))} last` : ''}
                              </p>
                              <button
                                onClick={() => setTab('history')}
                                className="shrink-0 text-[11px] text-emerald-400 underline underline-offset-4 sm:text-xs"
                              >
                                View
                              </button>
                            </div>
                          </li>
                        )
                      })}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
                <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
                  <h2 className="text-sm font-semibold sm:text-base">Recent deposits</h2>
                  <button
                    onClick={() => setTab('deposit')}
                    className="shrink-0 text-xs text-emerald-400 hover:text-emerald-300 sm:text-sm"
                  >
                    + Deposit funds
                  </button>
                </div>
                {deposits.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center">
                    <p className="text-sm text-slate-500">No deposits yet.</p>
                    <button
                      onClick={() => setTab('deposit')}
                      className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400"
                    >
                      Fund your account
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-2.5 sm:space-y-3">
                    {deposits.slice(0, 5).map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 sm:px-4 sm:py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{d.asset} · {d.network}</p>
                          <p className="truncate font-mono text-[11px] text-slate-500 sm:text-xs">
                            {d.tx_hash || '⏳ scanning blockchain…'}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                          <span className="text-sm font-semibold">{money(d.amount)}</span>
                          <StatusPill status={d.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ DEPOSIT ============ */}
        {tab === 'deposit' && (
          <div className="grid gap-6 lg:grid-cols-5">
            {/* step 1: pick wallet */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400">1</span>
                <h2 className="font-semibold">Choose payment method</h2>
              </div>
              <p className="mb-4 text-sm text-slate-500">
                Send funds to the address below, then submit your transaction hash.
              </p>

              <div className="mb-4 grid grid-cols-5 gap-2 sm:grid-cols-5">
                {Object.keys(WALLETS).map((a) => (
                  <button
                    key={a}
                    onClick={() => {
                      setAsset(a)
                      setNetwork(WALLETS[a][0].network)
                    }}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition
                      ${asset === a
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}
                  >
                    <img src={WALLETS[a][0].icon} alt={a} className="h-7 w-7" />
                    <span>{a}</span>
                  </button>
                ))}
              </div>

              {WALLETS[asset].length > 1 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {WALLETS[asset].map((w) => (
                    <button
                      key={w.network}
                      onClick={() => setNetwork(w.network)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition
                        ${network === w.network
                          ? 'border-emerald-500 text-emerald-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                      <img src={w.icon} alt={w.network} className="h-4 w-4" />
                      {w.network}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col items-center gap-6 rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:flex-row">
                {currentWallet && (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={currentWallet.qr}
                      alt={`${asset} ${network} deposit QR code`}
                      className="h-48 w-48 shrink-0 rounded-lg border-2 border-emerald-500/30 bg-white p-3 shadow-lg shadow-emerald-500/10"
                    />
                    <button
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = currentWallet.qr
                        link.download = `${asset}-${network}.jpg`
                        link.click()
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition"
                    >
                      ↓ Download QR
                    </button>
                  </div>
                )}
                <div className="w-full min-w-0">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    {network} address
                  </p>
                  <p className="mt-1 break-all rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 font-semibold">
                    {currentWallet?.address}
                  </p>
                  <button
                    onClick={() => navigator.clipboard?.writeText(currentWallet.address)}
                    className="mt-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 transition hover:bg-emerald-500/20 hover:border-emerald-400"
                  >
                    📋 Copy address
                  </button>
                  <p className="mt-4 text-xs text-amber-300/95 font-medium">
                    ⚠ Send only <span className="font-bold text-amber-300">{asset}</span> on the <span className="font-bold text-amber-300">{network}</span> network. Any other asset or network will result in permanent loss of funds.
                  </p>
                </div>
              </div>
            </div>

            {/* step 2: submit proof */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
              <div className="mb-1 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400">2</span>
                  <h2 className="font-semibold">Confirm deposit</h2>
                </div>
                <p className="mb-4 text-sm text-slate-500">
                  Scan the QR or copy the address, send funds from your wallet, then click the button below. Amount and transaction hash are auto-detected.
                </p>
              <form onSubmit={onDeposit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00 (optional — auto-detected)"
                    value={depAmount}
                    onChange={(e) => setDepAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Transaction hash (TxID) — optional, auto-detected if left blank</label>
                  <input
                    type="text"
                    placeholder="0x… / TxID from your wallet (optional)"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs outline-none transition focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? 'Confirming…' : 'Done, I have deposited'}
                </button>
              </form>
            </div>

            {/* deposit history strip */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-5">
              <h2 className="mb-4 font-semibold">Your deposits</h2>
              {deposits.length === 0 ? (
                <p className="text-sm text-slate-500">No deposits submitted yet.</p>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {deposits.map((d) => (
                    <li key={d.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">
                          {money(d.amount)} · {d.asset} ({d.network})
                        </p>
                        <p className="max-w-72 truncate font-mono text-xs text-slate-500">{d.tx_hash}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {new Date(d.created_at).toLocaleString()}
                        </span>
                        <StatusPill status={d.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ============ INVEST ============ */}
        {tab === 'invest' && (
          <InvestmentPrograms
            compact
            programs={programs}
            user={user}
            availableBalance={available}
            onSuccess={() => load({ silent: true })}
          />
        )}

        {/* ============ WITHDRAW ============ */}
        {tab === 'withdraw' && (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400">↓</span>
                <h2 className="font-semibold">Request withdrawal</h2>
              </div>
              <p className="mb-4 text-sm text-slate-500">
                Submit a withdrawal request and release within 5–10 minutes.
              </p>

              <form onSubmit={onWithdraw} className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Select cryptocurrency
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {['BTC', 'ETH', 'USDT', 'BNB', 'SOL'].map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setWithdrawAsset(a)}
                        className={`rounded-lg border px-2 py-2 text-sm font-semibold transition
                          ${withdrawAsset === a
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={available}
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Available: <span className="font-semibold text-emerald-400">{money(available)}</span>
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">Wallet address ({withdrawAsset})</label>
                  <input
                    type="text"
                    placeholder="Paste your wallet address here"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs outline-none transition focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={withdrawing}
                  className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
                >
                  {withdrawing ? 'Submitting…' : 'Request withdrawal'}
                </button>

                <p className="text-center text-xs text-amber-400/90">
                  ⚠ Double-check your wallet address. Funds sent to incorrect addresses cannot be recovered.
                </p>
              </form>
            </div>

            {/* pending withdrawals — collapsible */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
              <button
                onClick={() => setShowPending((v) => !v)}
                className="flex w-full items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  Pending withdrawals
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                    {withdrawals.filter((w) => w.status === 'pending').length}
                  </span>
                </span>
                <span className="text-xs text-slate-400">{showPending ? '▲ Hide' : '▼ Show'}</span>
              </button>
              {showPending && (
                <div className="mt-3">
                  {withdrawals.filter((w) => w.status === 'pending').length === 0 ? (
                    <p className="text-sm text-slate-500">No pending withdrawals.</p>
                  ) : (
                    <ul className="space-y-2">
                      {withdrawals.filter((w) => w.status === 'pending').map((w) => (
                        <li
                          key={w.id}
                          className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{money(w.amount)} {w.asset}</p>
                            <p className="truncate font-mono text-[11px] text-slate-500">{w.wallet_address}</p>
                          </div>
                          <span className="shrink-0 text-[11px] text-amber-400">⏳ Reviewing…</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* withdrawal history — collapsible */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 lg:col-span-5">
              <button
                onClick={() => setShowWithdrawalHistory((v) => !v)}
                className="flex w-full items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  Withdrawal history
                  <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                    {withdrawals.length}
                  </span>
                </span>
                <span className="text-xs text-slate-400">{showWithdrawalHistory ? '▲ Hide' : '▼ Show'}</span>
              </button>
              {showWithdrawalHistory && (
                <div className="mt-3">
                  {withdrawals.length === 0 ? (
                    <p className="text-sm text-slate-500">No withdrawals yet.</p>
                  ) : (
                    <ul className="divide-y divide-slate-800 max-h-64 overflow-y-auto">
                      {withdrawals.map((w) => (
                        <li key={w.id} className="flex items-center justify-between gap-2 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {money(w.amount)} · {w.asset}
                            </p>
                            <p className="max-w-40 truncate font-mono text-[11px] text-slate-500">
                              {w.wallet_address}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="hidden sm:inline text-[11px] text-slate-500">
                              {new Date(w.requested_at).toLocaleDateString()}
                            </span>
                            <StatusPill status={w.status} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ REFERRAL ============ */}
        {tab === 'referral' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="text-sm text-slate-400">Total Referrals</div>
                <div className="text-3xl font-bold mt-1">{referralStats?.total_referrals || 0}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="text-sm text-slate-400">Pending Commission</div>
                <div className="text-3xl font-bold mt-1 text-yellow-400">${Number(referralStats?.commission_pending || 0).toFixed(2)}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="text-sm text-slate-400">Credited Commission</div>
                <div className="text-3xl font-bold mt-1 text-emerald-400">${Number(referralStats?.commission_credited || 0).toFixed(2)}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-bold mb-3">Your Referral Code</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <code className="text-2xl font-mono font-bold text-emerald-400">{referralCode || '—'}</code>
                <button
                  onClick={() => { if (referralCode) { navigator.clipboard.writeText(referralCode); setNotice('Copied!') } }}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Copy
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-400 break-all">
                Share link: {window.location.origin}/signup?ref={referralCode}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-bold mb-3">Who Joined Using Your Link</h2>
              {referralHistory.length === 0 ? (
                <p className="text-sm text-slate-400">No referrals yet. Share your code/link to get started.</p>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {referralHistory.map((r) => (
                    <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-slate-500">{r.email} · {new Date(r.referred_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-yellow-400">Pending ${Number(r.pending_commission || 0).toFixed(2)}</p>
                        <p className="text-emerald-400">Credited ${Number(r.credited_commission || 0).toFixed(2)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ============ HISTORY ============ */}
        {tab === 'history' && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <button
                onClick={() => setShowDepositHistory((v) => !v)}
                className="flex w-full items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  Deposit history
                  <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] font-bold text-slate-300">{deposits.length}</span>
                </span>
                <span className="text-xs text-slate-400">{showDepositHistory ? '▲' : '▼'}</span>
              </button>
              {showDepositHistory && (
                <div className="mt-3">
                  {deposits.length === 0 ? (
                    <p className="text-sm text-slate-500">Nothing here yet.</p>
                  ) : (
                    <ul className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                      {deposits.map((d) => (
                        <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{money(d.amount)} · {d.asset}</p>
                            <p className="text-[11px] text-slate-500 truncate">{d.network}</p>
                          </div>
                          <StatusPill status={d.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <button
                onClick={() => setShowInvestmentHistory((v) => !v)}
                className="flex w-full items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  Investment history
                  <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] font-bold text-slate-300">{investments.length}</span>
                </span>
                <span className="text-xs text-slate-400">{showInvestmentHistory ? '▲' : '▼'}</span>
              </button>
              {showInvestmentHistory && (
                <div className="mt-3">
                  {investments.length === 0 ? (
                    <p className="text-sm text-slate-500">Nothing here yet.</p>
                  ) : (
                    <ul className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                      {investments.map((i) => (
                        <li key={i.id} className="flex items-center justify-between gap-2 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{i.program_name || i.plan_name} · {money(i.amount)}</p>
                            <p className="text-[11px] text-slate-500">
                              {Number(i.roi_percent)}% ROI ·{' '}
                              {new Date(i.started_at).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusPill status={i.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <button
                onClick={() => setShowWithdrawalHistory((v) => !v)}
                className="flex w-full items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  Withdrawal history
                  <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] font-bold text-slate-300">{withdrawals.length}</span>
                </span>
                <span className="text-xs text-slate-400">{showWithdrawalHistory ? '▲' : '▼'}</span>
              </button>
              {showWithdrawalHistory && (
                <div className="mt-3">
                  {withdrawals.length === 0 ? (
                    <p className="text-sm text-slate-500">Nothing here yet.</p>
                  ) : (
                    <ul className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                      {withdrawals.map((w) => (
                        <li key={w.id} className="flex items-center justify-between gap-2 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{money(w.amount)} · {w.asset}</p>
                            <p className="max-w-32 truncate font-mono text-[11px] text-slate-500">{w.wallet_address}</p>
                          </div>
                          <StatusPill status={w.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        Nexora Capital · Secured deposits · All investments carry risk. Past performance does not
        guarantee future returns.
      </footer>

      {/* Withdrawal success celebration */}
      <AnimatePresence>
        {withdrawSuccess && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWithdrawSuccess(null)}
          >
            <motion.div
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-8 text-center shadow-2xl shadow-emerald-500/10"
              initial={{ scale: 0.8, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-4xl shadow-lg shadow-emerald-500/40"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', damping: 12, stiffness: 220 }}
              >
                🎉
              </motion.div>
              <motion.h2
                className="mt-5 text-2xl font-black text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Withdrawal Requested!
              </motion.h2>
              <motion.p
                className="mt-2 text-sm text-slate-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
              >
                Congratulations — your withdrawal of
              </motion.p>
              <motion.p
                className="mt-1 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-3xl font-black text-transparent"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.34, type: 'spring', damping: 14 }}
              >
                {money(withdrawSuccess.amount)} {withdrawSuccess.asset}
              </motion.p>
              <motion.p
                className="mt-2 text-xs text-slate-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.42 }}
              >
                has been submitted and release within 5–10 minutes.
              </motion.p>
              <motion.button
                onClick={() => setWithdrawSuccess(null)}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-bold text-slate-950 transition hover:brightness-110"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Done
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

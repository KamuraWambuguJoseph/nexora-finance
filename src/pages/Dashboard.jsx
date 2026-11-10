import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, getToken, logout } from '../lib/api.js'
import qrBtc from '../assets/payments/qr-btc.jpg'
import qrEth from '../assets/payments/qr-eth.jpg'
import qrUsdtTron from '../assets/payments/qr-usdt-tron.jpg'
import qrUsdtEth from '../assets/payments/qr-usdt-eth.jpg'
import qrBnb from '../assets/payments/qr-bnb.jpg'
import qrSolana from '../assets/payments/qr-solana.jpg'

const money = (n) =>
  Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const PLANS = [
  {
    id: 'starter', name: 'Starter', roi: 8, days: 7, min: 100, max: 999,
    accent: 'from-emerald-500 to-teal-600',
    features: ['Daily payouts', 'Capital back at maturity', 'Withdraw after cycle'],
  },
  {
    id: 'growth', name: 'Growth', roi: 15, days: 14, min: 1000, max: 4999,
    accent: 'from-sky-500 to-indigo-600', popular: true,
    features: ['Daily payouts', 'Priority support', 'Compound option available'],
  },
  {
    id: 'premium', name: 'Premium', roi: 25, days: 30, min: 5000, max: 50000,
    accent: 'from-amber-500 to-orange-600',
    features: ['Dedicated account manager', 'Weekly performance reports', 'VIP withdrawal lane'],
  },
]

// Wallet addresses — each paired with the matching deposit QR code image
const WALLETS = {
  BTC: [
    { network: 'Bitcoin (BTC)', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', qr: qrBtc },
  ],
  ETH: [
    { network: 'Ethereum (ERC20)', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', qr: qrEth },
  ],
  USDT: [
    { network: 'Tron (TRC20)', address: 'TQn9Y2khDD95J42FQtQTdwVVRZqiTqJoUB', qr: qrUsdtTron },
    { network: 'Ethereum (ERC20)', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', qr: qrUsdtEth },
  ],
  BNB: [
    { network: 'BNB Smart Chain (BEP20)', address: '0xe2C8B7f619c3F4f51b390CCE6623c4E8a940A285', qr: qrBnb },
  ],
  SOL: [
    { network: 'Solana (SOL)', address: 'FwSqnqvBSY1fiNRiXyvmF3AcBAVHHYQKVZSoatN8zeBM', qr: qrSolana },
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
  const { t } = useTranslation()
  const [user, setUser] = useState(null)
  const [deposits, setDeposits] = useState([])
  const [investments, setInvestments] = useState([])
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

  // invest form state
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [invAmount, setInvAmount] = useState('')
  const [investing, setInvesting] = useState(false)

  // withdrawal form state
  const [withdrawAsset, setWithdrawAsset] = useState('BTC')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      navigate('/login')
      return
    }
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [me, deps, invs] = await Promise.all([
        api('/api/me', { auth: true }),
        api('/api/deposits', { auth: true }),
        api('/api/investments', { auth: true }),
      ])
      setUser(me.user)
      setDeposits(deps.deposits)
      setInvestments(invs.investments)

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
      setLoading(false)
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
  const available = confirmedDeposits - activeInvested

  const onDeposit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      const data = await api('/api/deposits', {
        method: 'POST',
        auth: true,
        body: {
          asset,
          network,
          amount: Number(depAmount),
          tx_hash: txHash.trim(),
        },
      })
      setDeposits((prev) => [data.deposit, ...prev])
      setDepAmount('')
      setTxHash('')
      setNotice(
        '✓ Deposit confirmed! Funds added to your account.',
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const onInvest = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setInvesting(true)
    try {
      const data = await api('/api/investments', {
        method: 'POST',
        auth: true,
        body: { plan_id: selectedPlan.id, amount: Number(invAmount) },
      })
      setInvestments((prev) => [data.investment, ...prev])
      setInvAmount('')
      setSelectedPlan(null)
      setNotice(`Investment opened in the ${data.investment.plan_name} plan.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setInvesting(false)
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
      setNotice(
        'Withdrawal request submitted. Admin will review and release within 5–15 minutes.',
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setWithdrawing(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
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
            <span className="ml-2 hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 sm:inline">
              Live Platform
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user && <span className="hidden text-sm text-slate-400 sm:inline">{user.name}</span>}
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
        {/* tabs */}
        <div className="mx-auto flex max-w-6xl gap-1 px-6">
          {['overview', 'deposit', 'invest', 'withdraw', 'referral', 'history'].map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => { setTab(tabKey); setError(''); setNotice('') }}
              className={`relative px-4 py-2.5 text-sm font-medium capitalize transition
                ${tab === tabKey ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {t(`nav.${tabKey}`)}
              {tab === tabKey && (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
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
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [t('dashboard.balance'), available, 'text-emerald-400'],
                [t('dashboard.deposits'), pendingDeposits, 'text-amber-400'],
                [t('dashboard.investments'), activeInvested, 'text-sky-400'],
                [t('dashboard.projected'), expectedReturn, 'text-white'],
              ].map(([label, value, cls]) => (
                <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
                  <p className={`mt-2 text-2xl font-bold ${cls}`}>{money(value)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold">Active investments</h2>
                  <button
                    onClick={() => setTab('invest')}
                    className="text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    + New investment
                  </button>
                </div>
                {investments.filter((i) => i.status === 'active').length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No active investments. Choose a plan to start earning.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {investments.filter((i) => i.status === 'active').map((i) => (
                      <li
                        key={i.id}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium">{i.plan_name} Plan</p>
                          <p className="text-xs text-slate-500">
                            {Number(i.roi_percent)}% ROI · {i.duration_days} days · matures{' '}
                            {new Date(i.matures_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{money(i.amount)}</p>
                          <p className="text-xs text-emerald-400">
                            +{money((Number(i.amount) * Number(i.roi_percent)) / 100)} profit
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold">Recent deposits</h2>
                  <button
                    onClick={() => setTab('deposit')}
                    className="text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    + Deposit funds
                  </button>
                </div>
                {deposits.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No deposits yet. Fund your account to get started.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {deposits.slice(0, 5).map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium">{d.asset} · {d.network}</p>
                          <p className="max-w-44 truncate font-mono text-xs text-slate-500">
                            {d.tx_hash}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{money(d.amount)}</span>
                          <StatusPill status={d.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
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
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition
                      ${asset === a
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}
                  >
                    {a}
                  </button>
                ))}
              </div>

              {WALLETS[asset].length > 1 && (
                <div className="mb-4 flex gap-2">
                  {WALLETS[asset].map((w) => (
                    <button
                      key={w.network}
                      onClick={() => setNetwork(w.network)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition
                        ${network === w.network
                          ? 'border-emerald-500 text-emerald-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
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
                <h2 className="font-semibold">Submit deposit</h2>
              </div>
              <p className="mb-4 text-sm text-slate-500">
                Enter the amount sent and paste the transaction hash (TxID).
              </p>
              <form onSubmit={onDeposit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    placeholder="0.00"
                    value={depAmount}
                    onChange={(e) => setDepAmount(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Transaction hash (TxID)</label>
                  <input
                    type="text"
                    placeholder="0x… / TxID from your wallet"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs outline-none transition focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? 'Confirming…' : 'Submit deposit'}
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
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Available balance:{' '}
                <span className="font-semibold text-emerald-400">{money(available)}</span>
              </p>
              <button
                onClick={() => setTab('deposit')}
                className="rounded-lg border border-emerald-500/40 px-3 py-1.5 text-sm text-emerald-400 transition hover:bg-emerald-500/10"
              >
                Deposit to top up
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  className={`relative flex flex-col rounded-2xl border bg-slate-900 p-6 transition
                    ${selectedPlan?.id === p.id
                      ? 'border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.4)]'
                      : 'border-slate-800 hover:border-slate-600'}`}
                >
                  {p.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Most popular
                    </span>
                  )}
                  <div className={`mb-3 h-1.5 w-12 rounded-full bg-gradient-to-r ${p.accent}`} />
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <p className="mt-1 text-3xl font-black">
                    {p.roi}
                    <span className="text-base font-semibold text-slate-400">% ROI</span>
                  </p>
                  <p className="text-xs text-slate-500">over {p.days} days</p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-300">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-emerald-400">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-slate-500">
                    Min {money(p.min)} · Max {money(p.max)}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedPlan(selectedPlan?.id === p.id ? null : p)
                      setInvAmount('')
                    }}
                    className={`mt-3 rounded-lg py-2.5 text-sm font-semibold transition
                      ${selectedPlan?.id === p.id
                        ? 'bg-emerald-500 text-slate-950'
                        : 'border border-slate-700 text-slate-200 hover:border-emerald-500 hover:text-emerald-400'}`}
                  >
                    {selectedPlan?.id === p.id ? 'Selected' : `Choose ${p.name}`}
                  </button>

                  {selectedPlan?.id === p.id && (
                    <form onSubmit={onInvest} className="mt-4 space-y-3 border-t border-slate-800 pt-4">
                      <input
                        type="number"
                        step="0.01"
                        min={p.min}
                        max={p.max}
                        placeholder={`Amount (${p.min}–${p.max.toLocaleString()})`}
                        value={invAmount}
                        onChange={(e) => setInvAmount(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                      />
                      <p className="text-xs text-slate-500">
                        Projected payout:{' '}
                        <span className="font-semibold text-emerald-400">
                          {money(Number(invAmount || 0) * (1 + p.roi / 100))}
                        </span>{' '}
                        at maturity
                      </p>
                      <button
                        type="submit"
                        disabled={investing}
                        className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
                      >
                        {investing ? 'Opening…' : 'Confirm investment'}
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </>
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
                Submit a withdrawal request. Admin will review and release within 5–15 minutes.
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

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
              <h2 className="mb-4 font-semibold">Pending withdrawals</h2>
              {withdrawals.filter((w) => w.status === 'pending').length === 0 ? (
                <p className="text-sm text-slate-500">No pending withdrawals.</p>
              ) : (
                <ul className="space-y-3">
                  {withdrawals.filter((w) => w.status === 'pending').map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{money(w.amount)} {w.asset}</p>
                        <p className="truncate font-mono text-xs text-slate-500">{w.wallet_address}</p>
                        <p className="text-xs text-amber-400 mt-1">
                          ⏳ Reviewing…
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* withdrawal history */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-5">
              <h2 className="mb-4 font-semibold">Withdrawal history</h2>
              {withdrawals.length === 0 ? (
                <p className="text-sm text-slate-500">No withdrawals yet.</p>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {withdrawals.map((w) => (
                    <li key={w.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">
                          {money(w.amount)} · {w.asset}
                        </p>
                        <p className="max-w-96 truncate font-mono text-xs text-slate-500">
                          {w.wallet_address}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {new Date(w.requested_at).toLocaleString()}
                        </span>
                        <StatusPill status={w.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ============ REFERRAL ============ */}
        {tab === 'referral' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">🔗 Referral Program</h2>
                <p className="mt-1 text-sm text-slate-400">Earn 3% commission on every deposit your referrals make</p>
              </div>
              <button
                onClick={() => navigate('/referral')}
                className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
              >
                View Full Dashboard →
              </button>
            </div>
            <div className="rounded-lg bg-slate-800 p-4 text-center border-2 border-dashed border-slate-700">
              <p className="text-slate-400">Click the button above to access your complete referral dashboard with:</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>✓ Your unique referral code & shareable link</li>
                <li>✓ Commission tracking and stats</li>
                <li>✓ Complete referral history</li>
              </ul>
            </div>
          </div>
        )}

        {/* ============ HISTORY ============ */}
        {tab === 'history' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 font-semibold">Deposit history</h2>
              {deposits.length === 0 ? (
                <p className="text-sm text-slate-500">Nothing here yet.</p>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {deposits.map((d) => (
                    <li key={d.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{money(d.amount)} · {d.asset}</p>
                        <p className="text-xs text-slate-500">{d.network}</p>
                      </div>
                      <StatusPill status={d.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 font-semibold">Investment history</h2>
              {investments.length === 0 ? (
                <p className="text-sm text-slate-500">Nothing here yet.</p>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {investments.map((i) => (
                    <li key={i.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{i.plan_name} · {money(i.amount)}</p>
                        <p className="text-xs text-slate-500">
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
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 font-semibold">Withdrawal history</h2>
              {withdrawals.length === 0 ? (
                <p className="text-sm text-slate-500">Nothing here yet.</p>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {withdrawals.map((w) => (
                    <li key={w.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{money(w.amount)} · {w.asset}</p>
                        <p className="max-w-32 truncate font-mono text-xs text-slate-500">{w.wallet_address}</p>
                      </div>
                      <StatusPill status={w.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        Nexora Capital · Secured deposits · All investments carry risk. Past performance does not
        guarantee future returns.
      </footer>
    </div>
  )
}

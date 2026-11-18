import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api, getToken, logout } from '../lib/api.js'

const money = (n) =>
  Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const RISK_STYLE = {
  low: { label: 'Low risk', dot: 'bg-emerald-400', text: 'text-emerald-400', ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10' },
  medium: { label: 'Moderate risk', dot: 'bg-amber-400', text: 'text-amber-400', ring: 'ring-amber-500/30', bg: 'bg-amber-500/10' },
  high: { label: 'High risk', dot: 'bg-orange-400', text: 'text-orange-400', ring: 'ring-orange-500/30', bg: 'bg-orange-500/10' },
  very_high: { label: 'Very high risk', dot: 'bg-red-400', text: 'text-red-400', ring: 'ring-red-500/30', bg: 'bg-red-500/10' },
}

// Professional tier system â€” refined accent colors + soft glow per tier
const TIERS = [
  { key: 'starter',    label: 'Starter',    numeral: 'I',    accent: 'from-slate-300 to-slate-500',   glow: 'shadow-slate-500/20',   text: 'text-slate-300' },
  { key: 'growth',     label: 'Growth',     numeral: 'II',   accent: 'from-sky-400 to-blue-600',      glow: 'shadow-sky-500/30',     text: 'text-sky-400' },
  { key: 'advanced',   label: 'Advanced',   numeral: 'III',  accent: 'from-indigo-400 to-indigo-600', glow: 'shadow-indigo-500/30',  text: 'text-indigo-400' },
  { key: 'premium',    label: 'Premium',    numeral: 'IV',   accent: 'from-blue-500 to-slate-700',    glow: 'shadow-blue-500/30',    text: 'text-blue-400' },
  { key: 'gold',       label: 'Gold',       numeral: 'V',    accent: 'from-yellow-400 to-orange-500', glow: 'shadow-yellow-500/30',  text: 'text-yellow-400' },
  { key: 'diamond',    label: 'Diamond',    numeral: 'VI',   accent: 'from-slate-200 to-slate-400',   glow: 'shadow-slate-400/30',   text: 'text-slate-200' },
  { key: 'black-elite',label: 'Elite',      numeral: 'â˜…',    accent: 'from-yellow-500 to-yellow-400', glow: 'shadow-yellow-500/40',  text: 'text-yellow-400' },
]

function tierFor(name) {
  const slug = (name || '').toLowerCase().replace(/\s+/g, '-')
  return TIERS.find((t) => t.key === slug) || TIERS[0]
}

function RiskPill({ level, size = 'sm' }) {
  const r = RISK_STYLE[level] || RISK_STYLE.medium
  const pad = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ring-1 ${r.ring} ${r.bg} ${r.text} ${pad} font-medium`}>
      <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} />
      {r.label}
    </span>
  )
}

export default function InvestmentPrograms({
  programs: programsProp,
  user: userProp,
  availableBalance: availableBalanceProp,
  compact = false,
  onSuccess,
} = {}) {
  const [programs, setPrograms] = useState(programsProp || [])
  const [loading, setLoading] = useState(!programsProp)
  const [error, setError] = useState('')
  const [user, setUser] = useState(userProp || null)
  const [availableBalance, setAvailableBalance] = useState(
    availableBalanceProp ?? 0
  )

  // Calculator state
  const [calcProgram, setCalcProgram] = useState(null)
  const [calcAmount, setCalcAmount] = useState('')

  // Confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmProgram, setConfirmProgram] = useState(null)
  const [confirmAmount, setConfirmAmount] = useState('')
  const [confirmAgreed, setConfirmAgreed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [confirmSuccess, setConfirmSuccess] = useState('')

  // View details modal
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailProgram, setDetailProgram] = useState(null)

  useEffect(() => {
    if (programsProp) {
      setPrograms(programsProp)
      setLoading(false)
    }
    if (userProp !== undefined) {
      setUser(userProp)
    }
    if (availableBalanceProp !== undefined) {
      setAvailableBalance(availableBalanceProp)
    }
    if (!getToken()) {
      setUser(null)
      setAvailableBalance(0)
      if (!programsProp) loadPrograms()
      return
    }
    if (!programsProp) {
      loadUser()
      loadPrograms()
    }
  }, [programsProp, userProp, availableBalanceProp])

  const loadUser = async () => {
    try {
      const [me] = await Promise.all([api('/api/me', { auth: true })])
      setUser(me.user)
    } catch (err) {
      console.error('Load user error:', err)
    }
  }

  const loadPrograms = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api('/api/investments/programs')
      setPrograms(data.programs || [])
    } catch (err) {
      setError(err.message || 'Failed to load investment programs.')
    } finally {
      setLoading(false)
    }
  }

  const openConfirm = (program) => {
    setConfirmProgram(program)
    setConfirmAmount('')
    setConfirmAgreed(false)
    setConfirmError('')
    setConfirmSuccess('')
    setConfirmOpen(true)
  }

  const onConfirmInvest = async (e) => {
    e.preventDefault()
    setConfirmError('')
    setConfirmSuccess('')
    if (!confirmProgram) return
    const amount = Number(confirmAmount)
    if (!amount || amount < Number(confirmProgram.min_investment)) {
      setConfirmError(`Minimum investment is ${money(confirmProgram.min_investment)}.`)
      return
    }
    if (confirmProgram.max_investment && amount > Number(confirmProgram.max_investment)) {
      setConfirmError(`Maximum investment is ${money(confirmProgram.max_investment)}.`)
      return
    }
    if (!confirmAgreed) {
      setConfirmError('Please accept the investment agreement.')
      return
    }
    if (availableBalance < amount) {
      setConfirmError(`Insufficient balance. Available: ${money(availableBalance)}.`)
      return
    }

    setConfirming(true)
    try {
      const data = await api('/api/investments', {
        method: 'POST',
        auth: true,
        body: { program_id: confirmProgram.id, amount, agree_terms: true },
      })
      setConfirmSuccess(`Investment opened. Reference: ${data.investment.reference}`)
      setConfirmAmount('')
      setConfirmAgreed(false)
      setConfirmOpen(false)
      setCalcProgram(null)
      // refresh balance + programs
      loadUser()
      if (onSuccess) onSuccess()
    } catch (err) {
      setConfirmError(err.message || 'Investment failed. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }} className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
          <p className="text-sm text-slate-400">Loading investment programsâ€¦</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={compact ? 'text-white' : 'min-h-screen bg-slate-950 text-white'}>
      {!compact && (
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto max-w-7xl px-3 md:px-6 py-2.5 md:py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 md:h-10 md:w-10 shrink-0 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <span className="text-base md:text-xl font-black text-slate-950">N</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm md:text-xl font-black tracking-tight truncate">
                  <span className="md:hidden">Programs</span>
                  <span className="hidden md:inline">Investment Programs</span>
                </h1>
                <p className="hidden md:block text-xs text-slate-400 truncate">Curated fixed-term opportunities</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
              {user && (
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2 md:px-4 py-1.5 md:py-2">
                  <span className="text-[11px] md:text-sm font-semibold text-emerald-400">{money(availableBalance)}</span>
                </div>
              )}
              <button
                onClick={() => { logout(); window.location.href = '/login' }}
                className="rounded-lg border border-slate-700 px-2 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                <span className="md:hidden">Exit</span>
                <span className="hidden md:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={compact ? 'px-3 py-4 md:px-6 md:py-8' : 'mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-8'}>
        {error && (
          <div className="mb-4 rounded-xl border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="mb-6 md:mb-10">
          <div className="mb-3 md:mb-6">
            <h2 className="text-xl md:text-3xl font-black tracking-tight">Select a program</h2>
            <p className="mt-0.5 md:mt-1 text-xs md:text-base text-slate-400">
              <span className="hidden sm:inline">Seven fixed-term programs with transparent terms. Select a program to review details, estimate returns, or invest.</span>
              <span className="sm:hidden">Tap a program to invest</span>
            </p>
          </div>

          {/* Summary table â€” desktop only */}
          <div className="mb-8 hidden md:block rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Program</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Minimum</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Term</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Risk</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {programs.map((p) => {
                    const tier = tierFor(p.name)
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${tier.accent} text-xs font-black text-slate-950`}>
                              {tier.numeral}
                            </span>
                            <div>
                              <p className="font-medium text-white">{p.name}</p>
                              <p className="text-xs text-slate-500 truncate max-w-xs">{p.description || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-white">{money(p.min_investment)}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{p.duration_days} days</td>
                        <td className="px-6 py-4"><RiskPill level={p.risk_level} size="xs" /></td>
                        <td className="px-6 py-4 text-right">
<button
                onClick={() => openConfirm(p)}
                className="relative overflow-hidden rounded-lg bg-gradient-to-r from-emerald-400 to-teal-600 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-500 transition"
              >
                <span className="relative z-10">Invest now</span>
                <motion.span
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
              </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: compact vertical list */}
          <div className="md:hidden space-y-2">
            {programs.map((p, i) => {
              const tier = tierFor(p.name)
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className={`relative flex items-center gap-3 rounded-xl border border-slate-700/60 bg-gradient-to-r from-slate-900 to-slate-950 pl-0 pr-3 py-2.5 overflow-hidden shadow ${tier.glow}`}
                >
                  <span className={`self-stretch w-1.5 shrink-0 bg-gradient-to-b ${tier.accent}`} />
                  <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tier.accent} text-xs font-black text-slate-950`}>
                    {tier.numeral}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold leading-tight truncate">{p.name}</h3>
                      <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider ${tier.text}`}>{tier.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      <span className="font-semibold text-white">{money(p.min_investment)}</span> min Â· {p.duration_days}d Â· {p.management_fee}% fee{p.daily_rate_pct ? ` Â· ${p.daily_rate_pct}%/day` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => { setDetailProgram(p); setDetailOpen(true) }}
                      className="rounded-md border border-slate-600 px-2 py-1.5 text-[10px] text-slate-300"
                    >
                      Info
                    </button>
                    <button
                      onClick={() => openConfirm(p)}
                      className="relative overflow-hidden rounded-md bg-gradient-to-r from-emerald-400 to-teal-600 px-3 py-1.5 text-[11px] font-bold text-slate-950 shadow transition"
                    >
                      <span className="relative z-10">Invest</span>
                      <motion.span
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Desktop/tablet: card grid */}
<div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
              {programs.map((p, i) => {
                const tier = tierFor(p.name)
                const maxText = p.max_investment ? money(p.max_investment) : 'No limit'
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -8, transition: { duration: 0.25 } }}
                    className={`group relative rounded-3xl border border-slate-700/60 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden cursor-pointer shadow-lg ${tier.glow} flex flex-col`}
                  >
                  {/* header band */}
                  <div className={`bg-gradient-to-r ${tier.accent} px-5 py-4`}>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950/25 text-base font-black text-white backdrop-blur">
                        {tier.numeral}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{tier.label}</p>
                        <h3 className="text-2xl font-bold leading-tight text-white truncate">{p.name}</h3>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDetailProgram(p); setDetailOpen(true) }}
                        className="ml-auto shrink-0 rounded-md bg-slate-950/30 px-2 py-1 text-[10px] text-white/90 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Details
                      </button>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    {/* hero metric */}
                    <div className="mb-4">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Minimum investment</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white leading-none">{money(p.min_investment)}</span>
                        <span className="text-[10px] text-slate-500">USD</span>
                      </div>
                    </div>

                    {/* supporting metrics */}
                    <div className="space-y-2 mb-4 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Term</span>
                        <span className="font-semibold text-white">{p.duration_days} days</span>
                      </div>
                      {p.daily_rate_pct ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Daily rate</span>
                          <span className="font-semibold text-emerald-400">{p.daily_rate_pct}%/day</span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Maximum</span>
                        <span className="font-semibold text-white">{maxText}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Management fee</span>
                        <span className="font-semibold text-white">{p.management_fee}%</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <RiskPill level={p.risk_level} size="xs" />
                    </div>

                    <p className="mb-4 text-xs text-slate-400 line-clamp-3 flex-1">
                      {p.description || 'No description available.'}
                    </p>

<button
                    onClick={() => openConfirm(p)}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-400 to-teal-600 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:from-emerald-500 hover:to-teal-500"
                  >
                    <span className="relative z-10">Invest now</span>
                    <motion.span
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    />
                  </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {calcProgram && (
          <section className="mb-10 rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 p-5 md:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">Return calculator</h3>
                <p className="text-sm text-slate-400">
                  Estimate maturity value for {calcProgram.name} ({calcProgram.duration_days} days)
                </p>
              </div>
              <button
                onClick={() => setCalcProgram(null)}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:border-slate-400 transition"
              >
                Close
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2">Investment amount (USD)</label>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  min={calcProgram.min_investment}
                  step="0.01"
                  placeholder={money(calcProgram.min_investment)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
                {calcProgram.max_investment && (
                  <p className="mt-1 text-xs text-slate-500">Max: {money(calcProgram.max_investment)}</p>
                )}
              </div>

              <div className="flex flex-col justify-center">
                <button
                  onClick={() => openConfirm(calcProgram)}
                  disabled={disabledCalc()}
                  className="relative overflow-hidden w-full py-3.5 rounded-xl font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 bg-gradient-to-r from-emerald-400 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                >
                  <span className="relative z-10">Invest in {calcProgram.name}</span>
                  <motion.span
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  />
                </button>
              </div>
            </div>

            {calcAmount && Number(calcAmount) > 0 && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                  { label: 'Investment', value: money(calcAmount) },
                  { label: 'Daily earning', value: calcProgram.daily_rate_pct ? `${money(Number(calcAmount) * (Number(calcProgram.daily_rate_pct) / 100))}/day` : 'â€”' },
                  { label: 'Management fee', value: money(Number(calcAmount) * (Number(calcProgram.management_fee) / 100)) },
                  { label: 'Maturity value', value: money(Number(calcAmount) * (1 - Number(calcProgram.management_fee) / 100) * (1 + Number(calcProgram.roi_percent) / 100)) },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                    <p className="text-xs text-slate-500 uppercase">{item.label}</p>
                    <p className="text-lg md:text-xl font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="hidden md:block">
          <h2 className="mb-6 text-xl md:text-2xl font-bold">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '01', title: 'Pick a program', desc: 'Choose a tier based on your capital and term.' },
              { step: '02', title: 'Estimate returns', desc: 'Enter your amount and review the estimated maturity value.' },
              { step: '03', title: 'Confirm & invest', desc: 'Review fees, term, and risk, then confirm securely.' },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
                <div className="text-3xl mb-3 font-black text-slate-700">{s.step}</div>
                <h4 className="text-lg font-bold mb-2">{s.title}</h4>
                <p className="text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* View Details Modal */}
      <AnimatePresence>
        {detailOpen && detailProgram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDetailOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-4 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                  <span className={`inline-flex h-9 w-9 md:h-11 md:w-11 shrink-0 items-center justify-center rounded-xl md:rounded-2xl bg-gradient-to-br ${tierFor(detailProgram.name).accent} text-xs md:text-sm font-black text-slate-950`}>
                    {tierFor(detailProgram.name).numeral}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${tierFor(detailProgram.name).text}`}>{tierFor(detailProgram.name).label}</p>
                    <h3 className="text-lg md:text-2xl font-bold leading-tight truncate">{detailProgram.name}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setDetailOpen(false)}
                  className="shrink-0 rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  âœ•
                </button>
              </div>
              <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-6">
                  <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 md:p-5 flex items-center justify-between sm:block">
                    <p className="text-[10px] md:text-xs text-slate-500 uppercase mb-0 sm:mb-1 md:mb-2">Minimum</p>
                    <p className="text-base md:text-xl font-semibold text-white">{money(detailProgram.min_investment)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 md:p-5 flex items-center justify-between sm:block">
                    <p className="text-[10px] md:text-xs text-slate-500 uppercase mb-0 sm:mb-1 md:mb-2">Maximum</p>
                    <p className="text-base md:text-xl font-semibold text-white">{detailProgram.max_investment ? money(detailProgram.max_investment) : 'No limit'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 md:p-5 flex items-center justify-between sm:block">
                    <p className="text-[10px] md:text-xs text-slate-500 uppercase mb-0 sm:mb-1 md:mb-2">Term</p>
                    <p className="text-base md:text-xl font-semibold text-white">{detailProgram.duration_days} days</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 md:p-5 flex items-center justify-between sm:block">
                    <p className="text-[10px] md:text-xs text-slate-500 uppercase mb-0 sm:mb-1 md:mb-2">Management fee</p>
                    <p className="text-base md:text-xl font-semibold text-white">{detailProgram.management_fee}%</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 md:p-5 flex items-center justify-between sm:col-span-2 md:col-span-1">
                    <p className="text-[10px] md:text-xs text-slate-500 uppercase mb-0 sm:mb-1 md:mb-2">Risk level</p>
                    <RiskPill level={detailProgram.risk_level} size="xs" />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3 md:p-5">
                  <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 md:mb-3">Description</p>
                  <p className="text-xs md:text-sm text-slate-300 mb-3">{detailProgram.description}</p>
                  {/* verbose sections hidden on phones to keep modal compact */}
                  <div className="hidden md:block">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Investment strategy</p>
                    <p className="text-sm text-slate-300 mb-3">{detailProgram.strategy}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Underlying activity</p>
                    <p className="text-sm text-slate-300 mb-3">{detailProgram.underlying_activity}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Withdrawal conditions</p>
                    <p className="text-sm text-slate-300 mb-3">{detailProgram.withdrawal_conditions}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Terms</p>
                    <p className="text-sm text-slate-300">{detailProgram.terms}</p>
                  </div>
                </div>

                <div className="pt-3 md:pt-4 border-t border-slate-700 flex gap-3">
<button
                  onClick={() => { setDetailOpen(false); openConfirm(detailProgram) }}
                  className="relative overflow-hidden flex-1 py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base text-white bg-gradient-to-r from-emerald-400 to-teal-600 hover:opacity-90 transition"
                >
                  <span className="relative z-10">Invest now</span>
                  <motion.span
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  />
                </button>
                  <button
                    onClick={() => setDetailOpen(false)}
                    className="flex-1 py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base text-slate-300 border border-slate-700 bg-slate-900 hover:bg-slate-800 transition"
                  >
                    Back
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmOpen && confirmProgram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-4 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-lg md:text-2xl font-bold">Confirm investment</h3>
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  âœ•
                </button>
              </div>

              <div className="mb-4 md:mb-6 rounded-xl border border-slate-700 bg-slate-950 p-3 md:p-4">
                <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Selected program</p>
                <div className="flex items-center gap-2.5 md:gap-3">
                  <span className={`inline-flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl md:rounded-2xl bg-gradient-to-br ${tierFor(confirmProgram.name).accent} text-xs font-black text-slate-950`}>
                    {tierFor(confirmProgram.name).numeral}
                  </span>
                  <div>
                    <p className="font-bold text-white text-sm md:text-base">{confirmProgram.name}</p>
                    <p className="text-[11px] md:text-xs text-slate-400">{confirmProgram.duration_days} days</p>
                  </div>
                </div>
              </div>

              {confirmError && (
                <div className="mb-3 md:mb-4 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-xs md:text-sm text-red-300">
                  {confirmError}
                </div>
              )}
              {confirmSuccess && (
                <div className="mb-3 md:mb-4 rounded-lg border border-emerald-800 bg-emerald-950/50 px-3 py-2 text-xs md:text-sm text-emerald-300">
                  {confirmSuccess}
                </div>
              )}

              <form onSubmit={onConfirmInvest} className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 md:mb-2">Investment amount (USD)</label>
                  <input
                    type="number"
                    value={confirmAmount}
                    onChange={(e) => setConfirmAmount(e.target.value)}
                    min={confirmProgram.min_investment}
                    step="0.01"
                    placeholder={money(confirmProgram.min_investment)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 md:px-4 py-2.5 md:py-3 text-sm text-white outline-none focus:border-emerald-500"
                  />
                  <p className="mt-1 text-[10px] md:text-xs text-slate-500">
                    Available: {money(availableBalance)} Â· Min: {money(confirmProgram.min_investment)} {confirmProgram.max_investment ? `Â· Max: ${money(confirmProgram.max_investment)}` : ''}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-4">
                  <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-2.5 md:p-4 flex items-center justify-between md:block">
                    <p className="text-[9px] md:text-xs text-slate-500 uppercase mb-0 md:mb-1">Maturity</p>
                    <p className="text-xs md:text-sm font-semibold text-white leading-tight">{maturityDateLabel(confirmProgram.duration_days)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-2.5 md:p-4 flex items-center justify-between md:block">
                    <p className="text-[9px] md:text-xs text-slate-500 uppercase mb-0 md:mb-1">Fee</p>
                    <p className="text-xs md:text-sm font-semibold text-white leading-tight">{confirmProgram.management_fee}%</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-2.5 md:p-4 flex items-center justify-between md:block">
                    <p className="text-[9px] md:text-xs text-slate-500 uppercase mb-0 md:mb-1">Risk</p>
                    <RiskPill level={confirmProgram.risk_level} size="xs" />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3 md:p-4">
                  <label className="flex items-center gap-2.5 md:gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={confirmAgreed}
                      onChange={() => setConfirmAgreed(!confirmAgreed)}
                      className="rounded border-slate-600 bg-slate-900 text-emerald-400 focus:ring-emerald-500"
                    />
                    <span className="text-xs md:text-sm text-slate-300 group-hover:text-emerald-400 transition">
                      I accept the investment agreement and understand the risks and withdrawal conditions.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={confirming || !confirmAgreed}
                  className="relative overflow-hidden w-full py-2.5 md:py-3.5 rounded-xl font-bold text-sm md:text-base text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 bg-gradient-to-r from-emerald-400 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                >
                  <span className="relative z-10">{confirming ? 'Processingâ€¦' : 'Confirm investment'}</span>
                  <motion.span
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  function disabledCalc() {
    return !calcAmount || Number(calcAmount) < Number(calcProgram?.min_investment || 0)
  }

  function maturityDateLabel(days) {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }
}
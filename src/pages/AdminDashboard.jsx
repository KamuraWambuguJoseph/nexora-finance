import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken, logout } from '../lib/api.js'

const money = (n) =>
  Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const STATUS_STYLE = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  released: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
}

function StatusPill({ status }) {
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[status] || 'border-slate-600 text-slate-400'}`}>
      {status}
    </span>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [deposits, setDeposits] = useState([])
  const [pendingWithdrawals, setPendingWithdrawals] = useState([])
  const [allWithdrawals, setAllWithdrawals] = useState([])
  const [commissions, setCommissions] = useState([])
  const [programs, setPrograms] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [editProgram, setEditProgram] = useState(null)
  const [programForm, setProgramForm] = useState({
    name: '', icon: '📈', min_investment: '', max_investment: '', duration_days: '',
    roi_percent: '', risk_level: 'medium', management_fee: '', description: '',
    strategy: '', underlying_activity: '', withdrawal_conditions: '', terms: '',
    is_active: true, display_order: 0,
  })
  const [savingProgram] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState('users')
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [creditingId, setCreditingId] = useState(null)

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
      const [me, usersData, depositsData, pending, all, commissionsData, programsData, auditData] = await Promise.all([
        api('/api/me', { auth: true }),
        api('/api/admin/users', { auth: true }),
        api('/api/admin/deposits', { auth: true }),
        api('/api/admin/withdrawals', { auth: true }),
        api('/api/admin/withdrawals/all', { auth: true }),
        api('/api/admin/referrals', { auth: true }),
        api('/api/investment-programs/admin/all', { auth: true }),
        api('/api/investment-programs/admin/audit-logs', { auth: true }),
      ])
      setUser(me.user)
      if (!me.user.is_admin) {
        setError('Admin access denied')
        return
      }
      setUsers(usersData.users)
      setDeposits(depositsData.deposits)
      setPendingWithdrawals(pending.withdrawals)
      setAllWithdrawals(all.withdrawals)
      setCommissions(commissionsData.commissions || [])
      setPrograms(programsData.programs || [])
      setAuditLogs(auditData.logs || [])
    } catch (err) {
      setError(err.message)
      if (err.message.includes('Admin access')) {
        setTimeout(() => navigate('/'), 3000)
      }
    } finally {
      setLoading(false)
    }
  }

  const onRelease = async (withdrawalId) => {
    setError('')
    setSuccess('')
    try {
      await api('/api/admin/release', {
        method: 'POST',
        auth: true,
        body: { withdrawal_id: withdrawalId },
      })
      setSuccess(`Withdrawal #${withdrawalId} released successfully!`)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const onReject = async (withdrawalId) => {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason')
      return
    }
    setError('')
    setSuccess('')
    try {
      await api('/api/admin/reject', {
        method: 'POST',
        auth: true,
        body: { withdrawal_id: withdrawalId, reason: rejectReason },
      })
      setSuccess(`Withdrawal #${withdrawalId} rejected.`)
      setRejectingId(null)
      setRejectReason('')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const onConfirmDeposit = async (depositId) => {
    setError('')
    setSuccess('')
    try {
      await api('/api/admin/deposit/confirm', {
        method: 'POST',
        auth: true,
        body: { deposit_id: depositId },
      })
      setSuccess(`Deposit #${depositId} confirmed — funds added to the user's balance.`)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const onRejectDeposit = async (depositId) => {
    setError('')
    setSuccess('')
    try {
      await api('/api/admin/deposit/reject', {
        method: 'POST',
        auth: true,
        body: { deposit_id: depositId },
      })
      setSuccess(`Deposit #${depositId} rejected.`)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const onCreditCommission = async (commissionId) => {
    setError('')
    setSuccess('')
    try {
      await api('/api/admin/referral/credit', {
        method: 'POST',
        auth: true,
        body: { commission_id: commissionId },
      })
      setSuccess(`Commission credited to referrer!`)
      setCreditingId(null)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const startAddProgram = () => {
    setEditProgram(null)
    setProgramForm({
      name: '', icon: '📈', min_investment: '', max_investment: '', duration_days: '',
      roi_percent: '', risk_level: 'medium', management_fee: '', description: '',
      strategy: '', underlying_activity: '', withdrawal_conditions: '', terms: '',
      is_active: true, display_order: 0,
    })
  }

  const startEditProgram = (p) => {
    setEditProgram(p)
    setProgramForm({
      name: p.name, icon: p.icon, min_investment: p.min_investment, max_investment: p.max_investment,
      duration_days: p.duration_days, roi_percent: p.roi_percent, risk_level: p.risk_level,
      management_fee: p.management_fee, description: p.description, strategy: p.strategy,
      underlying_activity: p.underlying_activity, withdrawal_conditions: p.withdrawal_conditions,
      terms: p.terms, is_active: p.is_active, display_order: p.display_order,
    })
  }

  const saveProgram = async () => {
    setError('')
    setSuccess('')
    try {
      const body = {
        name: programForm.name,
        icon: programForm.icon,
        min_investment: Number(programForm.min_investment),
        max_investment: programForm.max_investment === '' ? null : Number(programForm.max_investment),
        duration_days: Number(programForm.duration_days),
        roi_percent: Number(programForm.roi_percent),
        risk_level: programForm.risk_level,
        management_fee: Number(programForm.management_fee),
        description: programForm.description,
        strategy: programForm.strategy,
        underlying_activity: programForm.underlying_activity,
        withdrawal_conditions: programForm.withdrawal_conditions,
        terms: programForm.terms,
        is_active: programForm.is_active,
        display_order: Number(programForm.display_order),
      }
      if (editProgram) {
        await api(`/api/investment-programs/admin/${editProgram.id}`, {
          method: 'PUT', auth: true, body,
        })
        setSuccess(`Program "${programForm.name}" updated.`)
      } else {
        await api('/api/investment-programs/admin', {
          method: 'POST', auth: true, body,
        })
        setSuccess(`Program "${programForm.name}" created.`)
      }
      setEditProgram(null)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const deactivateProgram = async (id, name) => {
    if (!window.confirm(`Deactivate program "${name}"?`)) return
    try {
      await api(`/api/investment-programs/admin/${id}`, { method: 'DELETE', auth: true })
      setSuccess(`Program "${name}" deactivated.`)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-red-500" />
          <p className="text-sm text-slate-400">Loading admin dashboard…</p>
        </div>
      </div>
    )
  }

  if (error && error.includes('Admin access')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-800 bg-red-950/50 p-8">
          <p className="text-lg font-semibold text-red-300">⛔ Access Denied</p>
          <p className="text-sm text-red-200">{error}</p>
          <p className="text-xs text-slate-400">Redirecting to home...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* top bar */}
      <header className="sticky top-0 z-20 border-b-2 border-red-900 bg-gradient-to-r from-red-950 to-red-900 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/50">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Nexora Admin</h1>
              <p className="text-xs text-red-300">Withdrawal & Deposit Management</p>
            </div>
            <div className="ml-6 flex items-center gap-2 rounded-lg bg-red-900/50 border border-red-700 px-4 py-2">
              <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-semibold text-red-100">Live</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <p className="text-xs text-red-300">👑 Administrator</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-900/50 border border-red-700 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-900 hover:text-red-100"
            >
              Log out
            </button>
          </div>
        </div>
        {/* stats bar */}
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Registered Users', value: users.length, color: 'from-blue-500 to-blue-600', icon: '👥' },
              { label: 'Deposits Pending', value: deposits.filter(d => d.status === 'pending').length, color: 'from-yellow-500 to-yellow-600', icon: '💰' },
              { label: 'Withdrawals Pending', value: pendingWithdrawals.length, color: 'from-red-500 to-red-600', icon: '⏳' },
              { label: 'Processed Today', value: allWithdrawals.length, color: 'from-emerald-500 to-emerald-600', icon: '✓' },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-10 border border-current border-opacity-20 p-4`}>
                <p className="text-3xl">{stat.icon}</p>
                <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* tabs */}
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-2 border-b border-slate-800 overflow-x-auto">
            {[
              { id: 'users', label: `👥 Users`, count: users.length },
              { id: 'deposits', label: `💰 Deposits`, count: deposits.length },
              { id: 'pending', label: `⏳ Pending Withdrawals`, count: pendingWithdrawals.length },
              { id: 'referrals', label: `🔗 Referral Commissions`, count: commissions.filter(c => c.status === 'pending').length },
              { id: 'programs', label: `📈 Investment Programs`, count: programs.length },
              { id: 'history', label: '📜 History', count: allWithdrawals.length },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError(''); setSuccess('') }}
                className={`relative px-4 py-3 text-sm font-semibold whitespace-nowrap transition
                  ${tab === t.id
                    ? 'text-red-400 border-b-2 border-red-500'
                    : 'text-slate-400 hover:text-slate-200'}`}
              >
                {t.label} <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-900/50 text-xs font-bold">{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border-2 border-red-700 bg-red-950 px-4 py-4 text-sm text-red-200 shadow-lg shadow-red-950/50">
            <p className="font-semibold">❌ Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-xl border-2 border-emerald-700 bg-emerald-950 px-4 py-4 text-sm text-emerald-200 shadow-lg shadow-emerald-950/50">
            <p className="font-semibold">✓ Success</p>
            <p className="mt-1">{success}</p>
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <>
            <div className="mb-8 rounded-xl bg-gradient-to-r from-blue-950 to-blue-900 border border-blue-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">👥 Registered Users</h2>
                  <p className="mt-2 text-blue-200">Manage all users registered on the platform</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-blue-400">{users.length}</p>
                  <p className="text-sm text-blue-300">Total Users</p>
                </div>
              </div>
            </div>

            {users.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
                <p className="text-lg text-slate-400">📭 No registered users yet</p>
                <p className="mt-2 text-sm text-slate-500">Users will appear here when they sign up</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Member ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Registered
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/50 align-top">
                          <td className="px-6 py-3 font-medium text-white">{u.name}</td>
                          <td className="px-6 py-3 font-mono text-sm text-slate-300">{u.email}</td>
                          <td className="px-6 py-3 text-sm text-slate-300">
                            {u.phone || <span className="text-slate-600">—</span>}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-300 max-w-xs">
                            {u.address ? (
                              <span className="block whitespace-pre-wrap break-words">{u.address}</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3 font-mono text-xs text-emerald-400">
                            {u.membership_id || <span className="text-slate-600">—</span>}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-400 whitespace-nowrap">
                            {new Date(u.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* DEPOSITS */}
        {tab === 'deposits' && (
          <>
            <div className="mb-8 rounded-xl bg-gradient-to-r from-yellow-950 to-yellow-900 border border-yellow-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">💰 Deposit Requests</h2>
                  <p className="mt-2 text-yellow-200">Review and manage user deposits</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-yellow-400">{deposits.length}</p>
                  <p className="text-sm text-yellow-300">Total Deposits</p>
                </div>
              </div>
            </div>

            {deposits.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
                <p className="text-lg text-slate-400">📭 No deposits yet</p>
                <p className="mt-2 text-sm text-slate-500">User deposits will appear here</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Asset
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Network
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Date
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {deposits.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-800/50">
                          <td className="px-6 py-3">
                            <div>
                              <p className="font-medium">{d.name}</p>
                              <p className="font-mono text-xs text-slate-500">{d.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-3 font-semibold text-emerald-400">
                            {money(d.amount)}
                          </td>
                          <td className="px-6 py-3 font-medium">{d.asset}</td>
                          <td className="px-6 py-3 text-sm text-slate-400">{d.network}</td>
                          <td className="px-6 py-3">
                            <StatusPill status={d.status} />
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-400">
                            {new Date(d.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center justify-center gap-2">
                              {d.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => onConfirmDeposit(d.id)}
                                    className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition"
                                  >
                                    ✓ Confirm
                                  </button>
                                  <button
                                    onClick={() => onRejectDeposit(d.id)}
                                    className="rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition"
                                  >
                                    ✗ Reject
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-slate-500">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* PENDING WITHDRAWALS */}
        {tab === 'pending' && (
          <>
            <div className="mb-8 rounded-xl bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-2 border-red-800 p-6 shadow-lg shadow-red-950/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white">⏳ Pending Withdrawals</h2>
                  <p className="mt-2 text-red-200 font-medium">Action Required: Review and release user withdrawals</p>
                </div>
                <div className="text-right">
                  <p className="text-5xl font-black text-red-400">{pendingWithdrawals.length}</p>
                  <p className="text-sm text-red-300">Pending</p>
                  {pendingWithdrawals.length > 0 && (
                    <p className="mt-2 text-xs bg-red-600 text-white px-3 py-1 rounded-full font-bold animate-pulse">NEEDS ACTION</p>
                  )}
                </div>
              </div>
            </div>

            {pendingWithdrawals.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-emerald-700 bg-emerald-950/50 p-12 text-center">
                <p className="text-2xl">🎉</p>
                <p className="mt-2 text-lg text-emerald-300 font-semibold">All Caught Up!</p>
                <p className="mt-1 text-sm text-emerald-400">No pending withdrawals. All requests have been processed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingWithdrawals.map((w) => (
                  <div key={w.id} className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div>
                        <div className="mb-4">
                          <p className="text-xs uppercase tracking-wider text-slate-500">Withdrawal #{w.id}</p>
                          <p className="mt-1 text-2xl font-bold">
                            {money(w.amount)} <span className="text-lg text-slate-400">{w.asset}</span>
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-slate-500">User</p>
                            <p className="font-medium">{w.name}</p>
                            <p className="font-mono text-xs text-slate-500">{w.email}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Destination wallet</p>
                            <p className="break-all rounded-lg bg-slate-950 px-2 py-1 font-mono text-xs text-slate-300">
                              {w.wallet_address}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Requested</p>
                            <p className="text-sm">{new Date(w.requested_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        {rejectingId === w.id ? (
                          <div className="space-y-3 bg-red-950/50 border border-red-800 rounded-lg p-4">
                            <p className="text-sm font-semibold text-red-200">Rejection Reason:</p>
                            <textarea
                              placeholder="Enter detailed rejection reason..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="w-full rounded-lg border border-red-800 bg-red-900/50 px-3 py-2 text-sm text-red-100 outline-none focus:border-red-500"
                              rows="3"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => onReject(w.id)}
                                className="flex-1 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-bold transition hover:bg-red-700 text-white"
                              >
                                ✗ Confirm Reject
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingId(null)
                                  setRejectReason('')
                                }}
                                className="flex-1 rounded-lg border border-red-700 px-3 py-2.5 text-sm font-semibold transition hover:bg-red-900/50 text-red-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => onRelease(w.id)}
                              className="w-full rounded-lg bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 shadow-lg shadow-emerald-500/50"
                            >
                              ✓ RELEASE FUNDS
                            </button>
                            <button
                              onClick={() => setRejectingId(w.id)}
                              className="w-full rounded-lg border-2 border-red-600 bg-red-900/20 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-900/50 hover:border-red-500"
                            >
                              ✗ REJECT REQUEST
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* REFERRAL COMMISSIONS */}
        {tab === 'referrals' && (
          <>
            <div className="mb-8 rounded-xl bg-gradient-to-r from-purple-950 to-purple-900 border border-purple-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">🔗 Referral Commissions</h2>
                  <p className="mt-2 text-purple-200">Manage commissions earned from referral deposits</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-purple-400">${commissions.reduce((sum, c) => sum + (c.status === 'pending' ? parseFloat(c.commission_amount) : 0), 0).toFixed(2)}</p>
                  <p className="text-sm text-purple-300">Pending to Credit</p>
                </div>
              </div>
            </div>

            {commissions.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
                <p className="text-lg text-slate-400">📭 No referral commissions yet</p>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-800/50">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Referrer</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Deposit From</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300">Deposit Amount</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300">Commission (3%)</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-300">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">Date</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-300">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((comm) => (
                        <tr key={comm.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                          <td className="px-6 py-4 text-sm text-white font-medium">
                            {comm.referrer_name}
                            <div className="text-xs text-slate-500">{comm.referrer_email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            {comm.deposit_by_name}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-slate-300">
                            ${parseFloat(comm.deposit_amount).toFixed(2)} {comm.asset}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-yellow-400">
                            ${parseFloat(comm.commission_amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-center text-sm">
                            <StatusPill status={comm.status} />
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            {new Date(comm.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {comm.status === 'pending' && (
                              <button
                                onClick={() => onCreditCommission(comm.id)}
                                disabled={creditingId === comm.id}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition disabled:opacity-50"
                              >
                                {creditingId === comm.id ? '...' : '✓ Credit'}
                              </button>
                            )}
                            {comm.status === 'credited' && (
                              <span className="text-xs text-emerald-400">Credited</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Withdrawal history</h1>
              <p className="mt-1 text-sm text-slate-400">All processed withdrawal requests</p>
            </div>

            {allWithdrawals.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
                <p className="text-lg text-slate-400">No withdrawal history</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Requested
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Released by
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {allWithdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-800/50">
                          <td className="px-6 py-3 font-mono text-sm">#{w.id}</td>
                          <td className="px-6 py-3 text-sm">
                            <p className="font-medium">{w.name}</p>
                            <p className="font-mono text-xs text-slate-500">{w.email}</p>
                          </td>
                          <td className="px-6 py-3 text-sm font-semibold">
                            {money(w.amount)} {w.asset}
                          </td>
                          <td className="px-6 py-3">
                            <StatusPill status={w.status} />
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-400">
                            {new Date(w.requested_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            {w.released_by ? (
                              <div>
                                <p className="font-medium">{w.released_by}</p>
                                {w.released_at && (
                                  <p className="font-mono text-xs text-slate-500">
                                    {new Date(w.released_at).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* INVESTMENT PROGRAMS MANAGEMENT */}
        {tab === 'programs' && (
          <>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">📈 Investment Programs</h2>
                <p className="mt-1 text-slate-400">Create, edit, and manage investment programs offered to customers.</p>
              </div>
              <button
                onClick={startAddProgram}
                className="rounded-xl bg-gradient-to-r from-emerald-400 to-teal-600 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/40 hover:opacity-90 transition"
              >
                + Add program
              </button>
            </div>

            {editProgram && (
              <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-900 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-white">{editProgram ? 'Edit' : 'Add'} program</h3>
                  <button
                    onClick={() => setEditProgram(null)}
                    className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); saveProgram() }} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Program name</label>
                    <input
                      value={programForm.name}
                      onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                      placeholder="e.g. Starter"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Icon</label>
                    <input
                      value={programForm.icon}
                      onChange={(e) => setProgramForm({ ...programForm, icon: e.target.value })}
                      placeholder="📈"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Min investment ($)</label>
                    <input
                      type="number"
                      value={programForm.min_investment}
                      onChange={(e) => setProgramForm({ ...programForm, min_investment: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Max investment ($) (optional)</label>
                    <input
                      type="number"
                      value={programForm.max_investment}
                      onChange={(e) => setProgramForm({ ...programForm, max_investment: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Duration (days)</label>
                    <input
                      type="number"
                      value={programForm.duration_days}
                      onChange={(e) => setProgramForm({ ...programForm, duration_days: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">ROI %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={programForm.roi_percent}
                      onChange={(e) => setProgramForm({ ...programForm, roi_percent: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Risk level</label>
                    <select
                      value={programForm.risk_level}
                      onChange={(e) => setProgramForm({ ...programForm, risk_level: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="very_high">Very high</option>
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Description</label>
                    <input
                      value={programForm.description}
                      onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Terms</label>
                    <textarea
                      value={programForm.terms}
                      onChange={(e) => setProgramForm({ ...programForm, terms: e.target.value })}
                      rows="2"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 lg:col-span-2">
                    <input
                      type="checkbox"
                      checked={programForm.is_active}
                      onChange={(e) => setProgramForm({ ...programForm, is_active: e.target.checked })}
                      className="rounded border-slate-600 bg-slate-900 text-emerald-400 focus:ring-emerald-500"
                    />
                    <label className="text-sm text-slate-300">Active</label>
                  </div>
                  <div className="lg:col-span-3 flex gap-2">
                    <button
                      type="submit"
                      disabled={savingProgram}
                      className="flex-1 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-600 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50 transition"
                    >
                      {savingProgram ? 'Saving…' : 'Save program'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditProgram(null)}
                      className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-400 hover:bg-slate-800 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Program</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Min / Max</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">ROI / Fee</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Risk</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {programs.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-slate-500">No programs yet. Add one above.</td>
                      </tr>
                    ) : (
                      programs.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/50">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{p.icon}</span>
                              <div>
                                <p className="font-medium text-white">{p.name}</p>
                                <p className="text-xs text-slate-500">{p.description || ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <p className="font-semibold text-white">{money(p.min_investment)}</p>
                            {p.max_investment ? (
                              <p className="text-xs text-slate-500">max {money(p.max_investment)}</p>
                            ) : (
                              <p className="text-xs text-slate-500">no limit</p>
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-300">{p.duration_days} days</td>
                          <td className="px-6 py-3 text-sm">
                            <p className="font-semibold text-white">{p.roi_percent}%</p>
                            <p className="text-xs text-slate-500">fee {p.management_fee}%</p>
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                p.risk_level === 'low'
                                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                                  : p.risk_level === 'medium'
                                    ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                                    : p.risk_level === 'high'
                                      ? 'border-orange-500/30 text-orange-400 bg-orange-500/10'
                                      : 'border-red-500/30 text-red-400 bg-red-500/10'
                              }`}
                            >
                              {p.risk_level.charAt(0).toUpperCase() + p.risk_level.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                p.is_active
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-700/50 text-slate-500 border border-slate-700/50'
                              }`}
                            >
                              {p.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => startEditProgram(p)}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deactivateProgram(p.id, p.name)}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                                title="Deactivate"
                              >
                                {p.is_active ? '⏹️' : '✅'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {auditLogs.length > 0 && (
              <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden shadow-lg">
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
                  <h3 className="font-bold text-white">Audit log</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-800/50">
                        <th className="px-6 py-2 text-left text-xs font-semibold uppercase text-slate-500">When</th>
                        <th className="px-6 py-2 text-left text-xs font-semibold uppercase text-slate-500">Admin</th>
                        <th className="px-6 py-2 text-left text-xs font-semibold uppercase text-slate-500">Action</th>
                        <th className="px-6 py-2 text-left text-xs font-semibold uppercase text-slate-500">Entity</th>
                        <th className="px-6 py-2 text-left text-xs font-semibold uppercase text-slate-500">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {auditLogs.slice(0, 20).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/50">
                          <td className="px-6 py-2 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="px-6 py-2 text-slate-300 font-medium">{log.admin_name}</td>
                          <td className="px-6 py-2 text-slate-300 capitalize">{log.action}</td>
                          <td className="px-6 py-2 text-slate-300 font-mono">{log.entity}#{log.entity_id}</td>
                          <td className="px-6 py-2 text-slate-400 truncate max-w-xs">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        Nexora Admin Panel · Handle withdrawal requests with care · All decisions are logged
      </footer>
    </div>
  )
}

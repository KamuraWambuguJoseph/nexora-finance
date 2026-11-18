import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setToken } from '../lib/api.js'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [twoFactor, setTwoFactor] = useState(null) // { email } when challenge required
  const [needsVerification, setNeedsVerification] = useState(false)

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const finish = (data) => {
    setToken(data.token)
    navigate(data.user?.is_admin ? '/admin' : '/dashboard')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!form.email || !form.password) {
        throw new Error('Please fill in all fields.')
      }
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: { email: form.email, password: form.password },
      })
      if (data.two_factor_required) {
        setTwoFactor({ email: data.email })
        return
      }
      finish(data)
    } catch (err) {
      if (err.message && err.message.includes('verify your email')) {
        setNeedsVerification(true)
      }
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const onVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api('/api/auth/login/2fa', {
        method: 'POST',
        body: { email: twoFactor.email, token: code },
      })
      finish(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-[#FFF9F5] dark:via-white dark:to-[#FAF5F0] text-white dark:text-slate-900 flex items-center justify-center px-4">
      {/* Header with logo */}
      <div className="fixed top-0 left-0 right-0 border-b border-slate-800 dark:border-slate-200 bg-slate-950/50 dark:bg-white/50 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-2xl font-black text-emerald-400 dark:text-emerald-600">N</span>
            <span className="text-lg font-bold text-white dark:text-slate-900">Nexora</span>
          </button>
          <div></div>
        </div>
      </div>

      <div className="w-full max-w-md bg-slate-900 dark:bg-white border border-slate-800 dark:border-slate-200 rounded-2xl p-8 mt-20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 dark:from-emerald-600 dark:to-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-lg mb-4">
            N
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-1 text-center text-white dark:text-slate-900">
          {twoFactor ? 'Two-factor authentication' : 'Welcome back'}
        </h1>
        <p className="text-slate-400 dark:text-slate-600 text-sm mb-6 text-center">
          {twoFactor
            ? 'Enter the 6-digit code from your authenticator app.'
            : 'Sign in to your Nexora account.'}
        </p>

        {twoFactor ? (
          <form onSubmit={onVerify} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-slate-300">Authentication code</label>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-center font-mono text-lg tracking-[0.5em] outline-none focus:border-indigo-500"
                placeholder="000000"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {needsVerification && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await api('/api/auth/resend-verification', { method: 'POST', body: { email: form.email } })
                    setError('A new code has been sent to your email.')
                  } catch (e) {
                    setError(e.message)
                  }
                }}
                className="text-sm text-indigo-400 hover:underline"
              >
                Resend verification code
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 font-medium transition"
            >
              {loading ? 'Verifyingâ€¦' : 'Verify & sign in'}
            </button>
            <button
              type="button"
              onClick={() => { setTwoFactor(null); setCode(''); setError('') }}
              className="w-full text-sm text-slate-400 hover:text-white transition"
            >
              â† Back
            </button>
          </form>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-slate-300">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:border-indigo-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-300">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:border-indigo-500"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
              <div className="mt-1 text-right">
                <Link to="/forgot-password" className="text-xs text-indigo-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 font-medium transition"
            >
              {loading ? 'Signing inâ€¦' : 'Sign in'}
            </button>
          </form>
        )}

        <p className="text-sm text-slate-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-indigo-400 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api.js'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') || ''
  const token = params.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!token || !email) {
      setError('This reset link is missing information. Please request a new one.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: { email, token, password },
      })
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-[#FFF9F5] dark:via-white dark:to-[#FAF5F0] text-white dark:text-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 dark:bg-white border border-slate-800 dark:border-slate-200 rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 dark:from-emerald-600 dark:to-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-lg mb-4">
            N
          </div>
        </div>

        {done ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2 text-white dark:text-slate-900">Password reset</h1>
            <p className="text-slate-400 dark:text-slate-600 text-sm mb-6">
              Your password has been updated. Redirecting to sign in…
            </p>
            <Link to="/login" className="text-indigo-400 hover:underline text-sm">
              Go to sign in now
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-1 text-center text-white dark:text-slate-900">Set a new password</h1>
            <p className="text-slate-400 dark:text-slate-600 text-sm mb-6 text-center">
              Choose a new password for your account.
            </p>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-slate-300">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:border-indigo-500"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-300">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 font-medium transition"
              >
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
            <p className="text-sm text-slate-400 mt-6 text-center">
              <Link to="/login" className="text-indigo-400 hover:underline">
                ← Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
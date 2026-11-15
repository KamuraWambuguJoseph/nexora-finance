import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
      })
      setSent(true)
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

        {sent ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2 text-white dark:text-slate-900">Check your email</h1>
            <p className="text-slate-400 dark:text-slate-600 text-sm mb-6">
              If an account exists for <span className="font-semibold text-white dark:text-slate-900">{email}</span>,
              we&apos;ve sent a link to reset your password. It expires in 30 minutes.
            </p>
            <Link to="/login" className="text-indigo-400 hover:underline text-sm">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-1 text-center text-white dark:text-slate-900">Forgot password</h1>
            <p className="text-slate-400 dark:text-slate-600 text-sm mb-6 text-center">
              Enter your email and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:border-indigo-500"
                  placeholder="you@example.com"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 font-medium transition"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <p className="text-sm text-slate-400 mt-6 text-center">
              Remembered it?{' '}
              <Link to="/login" className="text-indigo-400 hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api.js'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api('/api/auth/verify-email', { method: 'POST', body: { email, code } })
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setError('')
    try {
      await api('/api/auth/resend-verification', { method: 'POST', body: { email } })
      setError('A new code has been sent to your email.')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <h1 className="text-2xl font-bold mb-3">Verify Your Email</h1>
        {done ? (
          <>
            <p className="text-emerald-400 mb-4">Email verified. You can now log in.</p>
            <button onClick={() => navigate('/login')} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
              Go to Login
            </button>
          </>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-slate-400 text-sm">Enter the 6-digit code sent to your email.</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit code"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-center text-2xl font-mono tracking-widest outline-none focus:border-emerald-500"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
            <button type="button" onClick={resend} className="text-sm text-indigo-400 hover:underline">
              Resend code
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
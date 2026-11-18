import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api.js'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!email || !token) {
      setStatus('error')
      setMessage('Invalid verification link.')
      return
    }
    api('/api/auth/verify-email', { method: 'POST', body: { email, token } })
      .then((data) => {
        setStatus('success')
        setMessage(data.message || 'Email verified. You can now log in.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'Verification failed.')
      })
  }, [email, token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <h1 className="text-2xl font-bold mb-3">Email Verification</h1>
        {status === 'verifying' && <p className="text-slate-400">Verifying your email…</p>}
        {status === 'success' && (
          <>
            <p className="text-emerald-400 mb-4">{message}</p>
            <button onClick={() => navigate('/login')} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
              Go to Login
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-red-400 mb-4">{message}</p>
            <button onClick={() => navigate('/login')} className="rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600">
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}
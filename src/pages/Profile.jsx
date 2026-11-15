import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { api, getToken } from '../lib/api.js'

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // personal info form
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [savingInfo, setSavingInfo] = useState(false)

  // password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // 2FA state
  const [twoFA, setTwoFA] = useState(null) // { secret, otpauth } when setting up
  const [twoFAToken, setTwoFAToken] = useState('')
  const [twoFABusy, setTwoFABusy] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

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
      const data = await api('/api/profile', { auth: true })
      setUser(data.user)
      setName(data.user.name || '')
      setPhone(data.user.phone || '')
      setAddress(data.user.address || '')
    } catch (err) {
      setError(err.message)
      if (err.message.includes('Session expired') || err.message.includes('Authentication')) {
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const saveInfo = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setSavingInfo(true)
    try {
      const data = await api('/api/profile', {
        method: 'PATCH',
        auth: true,
        body: { name, phone, address },
      })
      setUser(data.user)
      setNotice('Profile updated successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingInfo(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    setSavingPassword(true)
    try {
      await api('/api/profile/password', {
        method: 'PATCH',
        auth: true,
        body: { current_password: currentPassword, new_password: newPassword },
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setNotice('Password changed successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const startTwoFA = async () => {
    setError('')
    setNotice('')
    setTwoFABusy(true)
    try {
      const data = await api('/api/profile/2fa/setup', { method: 'POST', auth: true })
      setTwoFA(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setTwoFABusy(false)
    }
  }

  const confirmTwoFA = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setTwoFABusy(true)
    try {
      await api('/api/profile/2fa/enable', {
        method: 'POST',
        auth: true,
        body: { token: twoFAToken },
      })
      setUser((u) => ({ ...u, two_factor_enabled: true }))
      setTwoFA(null)
      setTwoFAToken('')
      setNotice('Two-factor authentication enabled.')
    } catch (err) {
      setError(err.message)
    } finally {
      setTwoFABusy(false)
    }
  }

  const disableTwoFA = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setTwoFABusy(true)
    try {
      await api('/api/profile/2fa/disable', {
        method: 'POST',
        auth: true,
        body: { password: disablePassword },
      })
      setUser((u) => ({ ...u, two_factor_enabled: false }))
      setDisablePassword('')
      setNotice('Two-factor authentication disabled.')
    } catch (err) {
      setError(err.message)
    } finally {
      setTwoFABusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
          <p className="text-sm text-slate-400">Loading your profile…</p>
        </div>
      </div>
    )
  }

  const inputCls =
    'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none transition focus:border-emerald-500'

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            ← Back to dashboard
          </button>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-black text-slate-950">
              N
            </span>
            <span className="text-lg font-bold tracking-tight">Nexora</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your personal information and account security.
        </p>

        {error && (
          <p className="mt-4 rounded-xl border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-4 rounded-xl border border-emerald-800 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300">
            {notice}
          </p>
        )}

        {/* Personal information */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Personal information</h2>
            {user?.membership_id && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                {user.membership_id}
              </span>
            )}
          </div>
          <form onSubmit={saveInfo} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Email address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className={`${inputCls} cursor-not-allowed text-slate-500`}
              />
              <p className="mt-1 text-[11px] text-slate-600">Email cannot be changed.</p>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Residential address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Street, City, State, ZIP"
                className={`${inputCls} resize-none`}
              />
            </div>
            <button
              type="submit"
              disabled={savingInfo}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
            >
              {savingInfo ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </section>

        {/* Account security */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 font-semibold">Account security</h2>

          {/* Change password */}
          <div className="border-b border-slate-800 pb-6">
            <h3 className="mb-1 text-sm font-semibold">Change password</h3>
            <p className="mb-4 text-xs text-slate-500">
              Use at least 8 characters. Choose something you don't use elsewhere.
            </p>
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className={inputCls}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingPassword}
                className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-slate-500 disabled:opacity-50"
              >
                {savingPassword ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>

          {/* Two-factor authentication */}
          <div className="pt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Two-factor authentication</h3>
                <p className="text-xs text-slate-500">
                  Add an extra layer of security with an authenticator app.
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  user?.two_factor_enabled
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-600 text-slate-400'
                }`}
              >
                {user?.two_factor_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {!user?.two_factor_enabled && !twoFA && (
              <button
                onClick={startTwoFA}
                disabled={twoFABusy}
                className="mt-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
              >
                {twoFABusy ? 'Preparing…' : 'Enable two-factor authentication'}
              </button>
            )}

            {twoFA && !user?.two_factor_enabled && (
              <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
                <p className="text-sm text-slate-300">
                  Scan this QR code with Google Authenticator, Authy, or any TOTP app — or enter the
                  key manually.
                </p>
                <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <div className="rounded-lg bg-white p-3">
                    <QRCodeSVG value={twoFA.otpauth} size={140} />
                  </div>
                  <div className="w-full min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">Manual key</p>
                    <p className="mt-1 break-all rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-emerald-400">
                      {twoFA.secret}
                    </p>
                    <form onSubmit={confirmTwoFA} className="mt-3 flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={twoFAToken}
                        onChange={(e) => setTwoFAToken(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        required
                        className="w-32 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-center font-mono text-sm tracking-widest outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={twoFABusy}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
                      >
                        {twoFABusy ? 'Verifying…' : 'Verify & enable'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {user?.two_factor_enabled && (
              <form onSubmit={disableTwoFA} className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter password to disable"
                  required
                  className={`${inputCls} sm:max-w-xs`}
                />
                <button
                  type="submit"
                  disabled={twoFABusy}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                >
                  {twoFABusy ? 'Disabling…' : 'Disable 2FA'}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        Nexora Capital · Secured account
      </footer>
    </div>
  )
}
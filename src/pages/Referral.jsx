import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken } from '../lib/api.js'

export default function Referral() {
  const navigate = useNavigate()
  const [referralCode, setReferralCode] = useState(null)
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      navigate('/login')
      return
    }

    const fetchData = async () => {
      try {
        // Get referral code
        const codeRes = await api('/api/referrals/my-code', { auth: true })
        setReferralCode(codeRes.referral_code.code)

        // Get stats
        const statsRes = await api('/api/referrals/stats', { auth: true })
        setStats(statsRes)

        // Get history
        const historyRes = await api('/api/referrals/history', { auth: true })
        setHistory(historyRes.referrals)
      } catch (err) {
        console.error('Error loading referral data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const copyToClipboard = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 dark:from-[#FFF9F5] dark:to-white p-4 sm:p-8 text-white dark:text-slate-900">
      <div className="max-w-5xl mx-auto">
        {/* Header with Home Button */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">🔗 Referral Program</h1>
            <p className="text-gray-400 dark:text-gray-600">Earn 3% commission on every deposit your referrals make</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-semibold transition"
          >
            ← Dashboard
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white shadow-lg">
            <div className="text-sm opacity-90">Total Referrals</div>
            <div className="text-4xl font-bold mt-2">{stats?.total_referrals || 0}</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg p-6 text-white shadow-lg">
            <div className="text-sm opacity-90">Pending Commission</div>
            <div className="text-4xl font-bold mt-2">${(stats?.commission_pending || 0).toFixed(2)}</div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white shadow-lg">
            <div className="text-sm opacity-90">Credited Commission</div>
            <div className="text-4xl font-bold mt-2">${(stats?.commission_credited || 0).toFixed(2)}</div>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8 shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Your Referral Code</h2>

          <div className="bg-gray-900 rounded-lg p-6 mb-6 border-2 border-green-500">
            <div className="text-gray-400 text-sm mb-2">Referral Code</div>
            <div className="flex items-center gap-4">
              <code className="text-3xl font-mono font-bold text-green-400">{referralCode}</code>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white mb-4">Share Your Referral Link:</h3>
          <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <p className="text-gray-300 break-all font-mono text-sm">{referralUrl}</p>
          </div>

          <div className="bg-blue-900 border border-blue-600 rounded-lg p-4 text-blue-100 text-sm">
            📌 Share this code or link with friends. When they sign up using your code, you'll earn 3% commission on every deposit they make!
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Referral History</h2>

          {history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No referrals yet</p>
              <p className="text-gray-500 text-sm mt-2">Share your code to get started earning commissions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Referred User</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Referred Date</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-semibold">Pending Commission</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-semibold">Credited Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((ref) => (
                    <tr key={ref.id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                      <td className="py-4 px-4 text-white">{ref.name}</td>
                      <td className="py-4 px-4 text-gray-300">{ref.email}</td>
                      <td className="py-4 px-4 text-gray-400">
                        {new Date(ref.referred_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right text-yellow-400 font-semibold">
                        ${(ref.pending_commission || 0).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-right text-green-400 font-semibold">
                        ${(ref.credited_commission || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

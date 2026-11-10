import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, logout } from '../lib/api.js'

const MARKET_DATA = [
  { symbol: 'BTC', name: 'Bitcoin', price: 42500, change: '+5.2%', color: 'from-orange-500 to-orange-600' },
  { symbol: 'ETH', name: 'Ethereum', price: 2280, change: '+3.8%', color: 'from-blue-500 to-blue-600' },
  { symbol: 'SOL', name: 'Solana', price: 98, change: '+8.1%', color: 'from-purple-500 to-purple-600' },
  { symbol: 'USDT', name: 'Tether', price: 1.0, change: '+0.1%', color: 'from-green-500 to-green-600' },
  { symbol: 'BNB', name: 'BNB', price: 580, change: '+2.3%', color: 'from-yellow-500 to-yellow-600' },
]

const AI_RECOMMENDATIONS = [
  {
    title: 'Maximize Growth Plan',
    description: 'Your portfolio shows strong momentum. Consider increasing your Growth Plan investment to capitalize on current market conditions.',
    confidence: 92,
    icon: '📈',
    action: 'Open Growth Plan',
  },
  {
    title: 'Diversify into Premium',
    description: 'You have strong returns. Allocate 20-30% to the Premium Plan for maximum long-term gains.',
    confidence: 87,
    icon: '💎',
    action: 'View Premium Plan',
  },
  {
    title: 'Rebalance Portfolio',
    description: 'Your portfolio is slightly overweighted in short-term assets. Consider rebalancing for better risk management.',
    confidence: 78,
    icon: '⚖️',
    action: 'Rebalance Now',
  },
]

export default function AIAssistant() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      navigate('/login')
      return
    }
    setLoading(false)
  }, [navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
          <p className="text-sm text-slate-400">Loading AI Assistant...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-white transition text-2xl"
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-black text-white">
                AI
              </span>
              <span className="text-lg font-bold tracking-tight">AI Assistant</span>
            </div>
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8 rounded-2xl border border-blue-800 bg-gradient-to-r from-blue-950 to-blue-900 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black mb-2">Welcome to AI Investment Advisor</h1>
              <p className="text-blue-200">Personalized recommendations powered by advanced market analysis</p>
            </div>
            <div className="text-6xl">🤖</div>
          </div>
        </div>

        {/* Market Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Live Market Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {MARKET_DATA.map((coin) => (
              <div key={coin.symbol} className="rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 transition">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-lg">{coin.symbol}</p>
                    <p className="text-xs text-slate-400">{coin.name}</p>
                  </div>
                </div>
                <p className="text-2xl font-black mb-2">${coin.price.toLocaleString()}</p>
                <p className={`text-sm font-semibold ${coin.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {coin.change}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">AI Recommendations</h2>
          <div className="space-y-4">
            {AI_RECOMMENDATIONS.map((rec, i) => (
              <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:border-emerald-500/30 transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl mt-1">{rec.icon}</div>
                    <div>
                      <h3 className="text-lg font-bold">{rec.title}</h3>
                      <p className="text-slate-400 text-sm mt-2 max-w-2xl">{rec.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-black text-emerald-400">{rec.confidence}%</div>
                    <p className="text-xs text-slate-500">Confidence</p>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mb-4">
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all"
                      style={{ width: `${rec.confidence}%` }}
                    ></div>
                  </div>
                </div>

                <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition">
                  {rec.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm uppercase tracking-wider text-slate-400 mb-3">Portfolio Score</p>
            <div className="text-4xl font-black text-emerald-400 mb-2">8.7/10</div>
            <p className="text-xs text-slate-500">Excellent diversification</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm uppercase tracking-wider text-slate-400 mb-3">Risk Level</p>
            <div className="text-4xl font-black text-amber-400 mb-2">Low</div>
            <p className="text-xs text-slate-500">Well-balanced strategy</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm uppercase tracking-wider text-slate-400 mb-3">Next Check</p>
            <div className="text-4xl font-black text-sky-400 mb-2">24h</div>
            <p className="text-xs text-slate-500">Updated daily at midnight</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 rounded-2xl border border-emerald-800 bg-emerald-950/50 p-8 text-center">
          <h3 className="text-2xl font-bold mb-3">Ready to Act on These Insights?</h3>
          <p className="text-emerald-200 mb-6 max-w-2xl mx-auto">
            Follow our AI recommendations to optimize your portfolio and maximize your returns. Our smart algorithms analyze market trends in real-time.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard?tab=invest')}
              className="px-8 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
            >
              Invest Now
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3 rounded-lg border border-emerald-600 text-emerald-400 hover:bg-emerald-500/10 font-semibold transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

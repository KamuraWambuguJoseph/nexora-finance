import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'

const programFeatures = {
  'Starter': ['Daily payouts', 'Capital back at maturity', 'Withdraw after cycle'],
  'Growth': ['Daily payouts', 'Priority support', 'Compound option available'],
  'Advanced': ['Priority support', 'Weekly reports', 'Risk management tools'],
  'Premium': ['Dedicated account manager', 'Weekly performance reports', 'VIP withdrawal lane'],
  'Gold': ['Personal advisor', 'Advanced analytics', 'Priority support'],
  'Diamond': ['Concierge service', 'Custom strategies', 'Premium benefits'],
  'Black Elite': ['White-glove service', 'Custom portfolio', 'Exclusive access']
}

const programColors = {
  'Starter': 'from-emerald-400 to-emerald-600',
  'Growth': 'from-blue-400 to-blue-600',
  'Advanced': 'from-orange-400 to-orange-600',
  'Premium': 'from-pink-400 to-pink-600',
  'Gold': 'from-yellow-400 to-yellow-600',
  'Diamond': 'from-purple-400 to-purple-600',
  'Black Elite': 'from-gray-600 to-gray-800'
}

export default function InvestmentPrograms() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [amount, setAmount] = useState('')
  const [investing, setInvesting] = useState(false)
  const [message, setMessage] = useState('')
  const [balance] = useState(0)

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      const data = await api('/api/investments/programs')
      setPrograms(data.programs || [])
    } catch (err) {
      console.error('Error fetching programs:', err)
      setMessage('Failed to load programs')
    } finally {
      setLoading(false)
    }
  }

  const handleInvest = async (program) => {
    if (!amount || parseFloat(amount) < program.minimum_amount) {
      setMessage(`Minimum investment is $${program.minimum_amount}`)
      return
    }

    setInvesting(true)
    try {
      const data = await api('/api/investments', {
        method: 'POST',
        body: {
          plan_id: program.id,
          plan_name: program.program_name,
          amount: parseFloat(amount),
          roi_percent: program.roi_percent,
          duration_days: program.duration_days
        }
      })
      setMessage(`✅ Investment successful! Maturity date: ${new Date(data.investment.matures_at).toLocaleDateString()}`)
      setAmount('')
      setSelectedProgram(null)
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage(err.message || 'Investment failed')
    } finally {
      setInvesting(false)
    }
  }

  if (loading) {
    return <div className="text-center text-slate-400">Loading programs...</div>
  }

  return (
    <div>
      {/* Header with balance and deposit button */}
      <div className="flex justify-between items-center mb-8">
        <div className="text-lg">
          <span className="text-slate-400 dark:text-slate-600">Available balance: </span>
          <span className="text-2xl font-bold text-emerald-400">$${balance.toFixed(2)}</span>
        </div>
        <button className="px-6 py-2 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-300 transition font-medium">
          Deposit to top up
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-3 rounded-lg text-sm ${
          message.includes('✅')
            ? 'bg-green-900/30 border border-green-500 text-green-300'
            : 'bg-red-900/30 border border-red-500 text-red-300'
        }`}>
          {message}
        </div>
      )}

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {programs.map((program, idx) => {
          const isMostPopular = program.program_name === 'Growth'
          return (
            <div
              key={program.id}
              className="relative rounded-2xl bg-slate-800 dark:bg-slate-50 border border-slate-700 dark:border-slate-200 p-6 hover:border-slate-600 dark:hover:border-slate-300 transition cursor-pointer overflow-hidden"
              onClick={() => setSelectedProgram(program)}
            >
              {/* Gradient bar at top */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${programColors[program.program_name] || 'from-blue-400 to-blue-600'}`}></div>

              {/* Most Popular Badge */}
              {isMostPopular && (
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">MOST POPULAR</span>
                </div>
              )}

              {/* Program Name */}
              <h3 className="text-2xl font-bold text-white dark:text-slate-900 mb-4">
                {program.program_name}
              </h3>

              {/* ROI Section */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-5xl font-black text-white dark:text-slate-900">{program.roi_percent}</span>
                  <span className="text-2xl font-bold text-slate-400 dark:text-slate-600 ml-1">% ROI</span>
                </div>
                <p className="text-sm text-slate-400 dark:text-slate-600 mt-2">over {program.duration_days} days</p>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6">
                {(programFeatures[program.program_name] || []).map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 text-lg mt-0.5">✓</span>
                    <span className="text-slate-300 dark:text-slate-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Min/Max */}
              <p className="text-xs text-slate-500 dark:text-slate-500 mb-4 border-t border-slate-700 dark:border-slate-300 pt-4">
                Min ${program.minimum_amount.toFixed(2)} · Max ${(program.minimum_amount * 10).toFixed(2)}
              </p>

              {/* Choose Button */}
              <button
                onClick={() => setSelectedProgram(program)}
                className="w-full py-2.5 rounded-lg border border-slate-600 dark:border-slate-400 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 transition font-medium"
              >
                Choose {program.program_name}
              </button>
            </div>
          )
        })}
      </div>

      {/* Investment Form */}
      {selectedProgram && (
        <div className="p-6 bg-slate-800 dark:bg-slate-50 border border-slate-700 dark:border-slate-200 rounded-2xl">
          <h3 className="text-xl font-bold text-white dark:text-slate-900 mb-6">
            Invest in {selectedProgram.program_name}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 dark:text-slate-700 mb-2">Investment Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min: $${selectedProgram.minimum_amount}`}
                className="w-full rounded-lg bg-slate-700 dark:bg-slate-100 border border-slate-600 dark:border-slate-300 px-4 py-2 text-white dark:text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-700 dark:bg-slate-100 rounded p-3">
                <p className="text-xs text-slate-400 dark:text-slate-600">Expected Returns</p>
                <p className="text-lg font-bold text-green-400 dark:text-green-600">
                  ${amount && parseFloat(amount) > 0 ? (parseFloat(amount) * selectedProgram.roi_percent / 100).toFixed(2) : '0'}
                </p>
              </div>
              <div className="bg-slate-700 dark:bg-slate-100 rounded p-3">
                <p className="text-xs text-slate-400 dark:text-slate-600">Total Value</p>
                <p className="text-lg font-bold text-white dark:text-slate-900">
                  ${amount && parseFloat(amount) > 0 ? (parseFloat(amount) * (1 + selectedProgram.roi_percent / 100)).toFixed(2) : '0'}
                </p>
              </div>
              <div className="bg-slate-700 dark:bg-slate-100 rounded p-3">
                <p className="text-xs text-slate-400 dark:text-slate-600">Duration</p>
                <p className="text-lg font-bold text-white dark:text-slate-900">
                  {selectedProgram.duration_days}d
                </p>
              </div>
            </div>
            <button
              onClick={() => handleInvest(selectedProgram)}
              disabled={investing || !amount}
              className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition"
            >
              {investing ? 'Processing...' : 'Invest Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

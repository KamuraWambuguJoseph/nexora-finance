import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'

export default function InvestmentPrograms() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [amount, setAmount] = useState('')
  const [investing, setInvesting] = useState(false)
  const [message, setMessage] = useState('')

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
    <div className="bg-slate-900 dark:bg-white rounded-lg p-6">
      <h2 className="text-3xl font-bold mb-8 text-white dark:text-slate-900">💰 Investment Programs</h2>

      {message && (
        <div className={`mb-6 p-3 rounded-lg text-sm ${
          message.includes('✅')
            ? 'bg-green-900/30 border border-green-500 text-green-300'
            : 'bg-red-900/30 border border-red-500 text-red-300'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {programs.map(program => (
          <div
            key={program.id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition ${
              selectedProgram?.id === program.id
                ? 'border-indigo-500 bg-indigo-900/20'
                : 'border-slate-700 dark:border-slate-300 hover:border-indigo-400'
            }`}
            onClick={() => setSelectedProgram(program)}
          >
            <h3 className="text-xl font-bold text-indigo-400 dark:text-indigo-600 mb-2">
              {program.program_name}
            </h3>
            <div className="space-y-2 text-sm text-slate-300 dark:text-slate-700">
              <p>💵 Min: ${program.minimum_amount.toFixed(2)}</p>
              <p>📅 Period: {program.duration_days} days</p>
              <p>📈 ROI: {program.roi_percent.toFixed(1)}%</p>
              <p className="text-green-400 dark:text-green-600 font-semibold">
                Returns: ${(program.minimum_amount * program.roi_percent / 100).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {selectedProgram && (
        <div className="mt-8 p-6 bg-indigo-900/20 border border-indigo-500 rounded-lg">
          <h3 className="text-xl font-bold text-white dark:text-slate-900 mb-4">
            Invest in {selectedProgram.program_name}
          </h3>
          <div className="space-y-4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min: $${selectedProgram.minimum_amount}`}
              className="w-full rounded-lg bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-300 px-4 py-2 text-white dark:text-slate-900 outline-none focus:border-indigo-500"
            />
            <div className="bg-slate-800 dark:bg-slate-200 rounded p-3 text-sm">
              <p className="text-slate-400 dark:text-slate-600">Investment Summary</p>
              <p className="text-white dark:text-slate-900 font-semibold mt-2">
                Amount: ${amount || '0'}
              </p>
              {amount && parseFloat(amount) > 0 && (
                <p className="text-green-400 dark:text-green-600 mt-1">
                  Expected Returns: ${(parseFloat(amount) * selectedProgram.roi_percent / 100).toFixed(2)}
                </p>
              )}
              <p className="text-slate-400 dark:text-slate-600 text-xs mt-2">
                Duration: {selectedProgram.duration_days} days
              </p>
            </div>
            <button
              onClick={() => handleInvest(selectedProgram)}
              disabled={investing || !amount}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium transition"
            >
              {investing ? 'Processing...' : 'Invest Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('1')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('KES')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [rates, setRates] = useState([])

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'KES', 'BTC', 'ETH', 'INR', 'AUD', 'CAD']

  useEffect(() => {
    fetchRates()
  }, [])

  const fetchRates = async () => {
    try {
      const data = await api('/api/currency/rates')
      setRates(data.rates)
    } catch (err) {
      console.error('Error fetching rates:', err)
    }
  }

  const convert = async () => {
    if (!amount || amount <= 0) return

    setLoading(true)
    try {
      const data = await api(`/api/currency/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`)
      setResult(data)
    } catch (err) {
      console.error('Conversion error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900 dark:bg-white border border-slate-800 dark:border-slate-200 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-white dark:text-slate-900">💱 Currency Converter</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm mb-2 text-slate-300 dark:text-slate-600">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-300 px-4 py-2 text-white dark:text-slate-900 outline-none focus:border-indigo-500"
            placeholder="Enter amount"
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-slate-300 dark:text-slate-600">From</label>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="w-full rounded-lg bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-300 px-4 py-2 text-white dark:text-slate-900 outline-none focus:border-indigo-500"
          >
            {currencies.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-2 text-slate-300 dark:text-slate-600">To</label>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="w-full rounded-lg bg-slate-800 dark:bg-slate-100 border border-slate-700 dark:border-slate-300 px-4 py-2 text-white dark:text-slate-900 outline-none focus:border-indigo-500"
          >
            {currencies.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={convert}
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-medium transition"
      >
        {loading ? 'Converting...' : 'Convert'}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-indigo-900/20 border border-indigo-500 rounded-lg">
          <p className="text-slate-300 dark:text-slate-700 mb-2">
            <span className="font-bold text-lg text-indigo-400">{result.amount}</span>
            {' '} {result.from}
          </p>
          <p className="text-xl text-white dark:text-slate-900 font-bold mb-2">
            ↓
          </p>
          <p className="text-slate-300 dark:text-slate-700">
            <span className="font-bold text-lg text-green-400">{result.converted_amount}</span>
            {' '} {result.to}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
            Rate: 1 {result.from} = {result.rate} {result.to}
          </p>
        </div>
      )}
    </div>
  )
}

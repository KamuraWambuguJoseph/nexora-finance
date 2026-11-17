import InvestmentPrograms from '../components/InvestmentPrograms'
import RotatingEarth from '../components/RotatingEarth'

export default function Investments() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-[#FFF9F5] dark:via-white dark:to-[#FAF5F0] text-white dark:text-slate-900 px-4 py-20">
      <RotatingEarth className="pointer-events-none absolute inset-0 h-full w-full opacity-60" />
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-emerald-400 via-emerald-300 to-blue-500 dark:from-blue-900 dark:via-blue-800 dark:to-cyan-700 bg-clip-text text-transparent">
            Investment Opportunities
          </h1>
          <p className="text-slate-400 dark:text-slate-600 text-lg">
            Choose the perfect investment plan for your financial goals
          </p>
        </div>

        <InvestmentPrograms />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/80 backdrop-blur dark:bg-slate-100 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-emerald-400 dark:text-emerald-600 mb-2">🛡️ Secure</h3>
            <p className="text-slate-300 dark:text-slate-700">
              Your investments are protected with industry-leading security measures.
            </p>
          </div>
          <div className="bg-slate-800/80 backdrop-blur dark:bg-slate-100 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-blue-400 dark:text-blue-600 mb-2">📊 Transparent</h3>
            <p className="text-slate-300 dark:text-slate-700">
              Real-time tracking of your investments and returns.
            </p>
          </div>
          <div className="bg-slate-800/80 backdrop-blur dark:bg-slate-100 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-indigo-400 dark:text-indigo-600 mb-2">🚀 Growth</h3>
            <p className="text-slate-300 dark:text-slate-700">
              Maximize your returns with our high-performing programs.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

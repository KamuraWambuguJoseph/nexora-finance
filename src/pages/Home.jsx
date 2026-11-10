export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-[#FFF9F5] dark:via-white dark:to-[#FAF5F0] text-white dark:text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-10 backdrop-blur-sm border-b border-slate-800 dark:border-slate-200 bg-slate-950/50 dark:bg-white/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black">N</span>
            <span className="text-lg font-bold">Nexora</span>
          </div>
          <div className="flex gap-3">
            <a href="/login" className="px-4 py-2 rounded-lg text-sm font-medium transition hover:bg-slate-800 dark:hover:bg-slate-100">
              Sign in
            </a>
            <a href="/signup" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-sm font-medium transition text-white">
              Create account
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-emerald-400 to-blue-500 dark:from-emerald-600 dark:to-blue-600 bg-clip-text text-transparent leading-tight">
          Grow Your Crypto Wealth
        </h1>
        <p className="text-xl text-slate-300 dark:text-slate-600 mb-8 max-w-2xl mx-auto">
          Invest smartly, earn passively, and withdraw anytime. The secure crypto investment platform for everyone.
        </p>
        <div className="flex gap-4 mb-8 justify-center">
          <a href="/signup" className="px-8 py-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 font-semibold text-white transition transform hover:scale-105">
            Get Started Free
          </a>
          <a href="/login" className="px-8 py-4 rounded-lg border border-emerald-500 dark:border-emerald-600 text-emerald-400 dark:text-emerald-600 hover:bg-emerald-500/10 dark:hover:bg-emerald-600/10 font-semibold transition">
            Sign In
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 dark:border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-500 dark:text-slate-600 text-sm">
          <p>&copy; 2024 Nexora Finance. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

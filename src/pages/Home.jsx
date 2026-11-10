import AppPreview from '../components/AppPreview'

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
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-emerald-400 to-blue-500 dark:from-emerald-600 dark:to-blue-600 bg-clip-text text-transparent leading-tight">
              Grow Your Crypto Wealth
            </h1>
            <p className="text-xl text-slate-300 dark:text-slate-600 mb-8">
              Invest smartly, earn passively, and withdraw anytime. The secure crypto investment platform for everyone.
            </p>
            <div className="flex gap-4 mb-8">
              <a href="/signup" className="px-8 py-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 font-semibold text-white transition transform hover:scale-105">
                Get Started Free
              </a>
              <a href="/login" className="px-8 py-4 rounded-lg border border-emerald-500 dark:border-emerald-600 text-emerald-400 dark:text-emerald-600 hover:bg-emerald-500/10 dark:hover:bg-emerald-600/10 font-semibold transition">
                Sign In
              </a>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-slate-300 dark:text-slate-600">
                <div className="font-bold text-emerald-400 dark:text-emerald-600">13 Languages</div>
                <div>Available Worldwide</div>
              </div>
              <div className="text-slate-300 dark:text-slate-600">
                <div className="font-bold text-emerald-400 dark:text-emerald-600">25% ROI</div>
                <div>Premium Plan</div>
              </div>
              <div className="text-slate-300 dark:text-slate-600">
                <div className="font-bold text-emerald-400 dark:text-emerald-600">No KYC</div>
                <div>Get Started Now</div>
              </div>
            </div>
          </div>

          {/* Right: App Preview */}
          <AppPreview />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Nexora?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '🔒', title: 'Secure', desc: 'Your assets are protected with enterprise-grade security.' },
            { icon: '💰', title: 'High Returns', desc: 'Earn up to 25% ROI on your investments.' },
            { icon: '⚡', title: 'Fast', desc: 'Instant deposits and withdrawals anytime, anywhere.' },
            { icon: '🌍', title: 'Global', desc: 'Available in 13 languages for worldwide users.' },
            { icon: '👥', title: 'Referrals', desc: 'Earn 3% commission on every referral deposit.' },
            { icon: '📱', title: 'Easy to Use', desc: 'Simple, intuitive interface anyone can master.' },
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-xl border border-slate-800 dark:border-slate-200 bg-slate-900/50 dark:bg-white/50 hover:border-emerald-500 dark:hover:border-emerald-600 transition">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-slate-400 dark:text-slate-600 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Investment Plans */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Investment Plans</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: 'Starter', roi: '8%', days: '7', min: '$100', features: ['Daily payouts', 'Capital back'] },
            { name: 'Growth', roi: '15%', days: '14', min: '$1,000', features: ['Priority support', 'Compound option'], popular: true },
            { name: 'Premium', roi: '25%', days: '30', min: '$5,000', features: ['Dedicated manager', 'VIP lane'], popular: false },
          ].map((plan, i) => (
            <div key={i} className={`p-8 rounded-xl border transition ${
              plan.popular
                ? 'border-emerald-500 dark:border-emerald-600 bg-emerald-500/10 dark:bg-emerald-600/10 transform md:scale-105'
                : 'border-slate-800 dark:border-slate-200 bg-slate-900/50 dark:bg-white/50'
            }`}>
              {plan.popular && <div className="text-emerald-400 dark:text-emerald-600 text-sm font-bold mb-2">⭐ MOST POPULAR</div>}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-4xl font-black text-emerald-400 dark:text-emerald-600 mb-2">{plan.roi}</div>
              <p className="text-slate-400 dark:text-slate-600 text-sm mb-4">{plan.days} day cycle • Starting from {plan.min}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="text-sm text-slate-300 dark:text-slate-700">✓ {f}</li>
                ))}
              </ul>
              <button className={`w-full py-2 rounded-lg font-semibold transition ${
                plan.popular
                  ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white'
                  : 'bg-slate-800 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-300 text-white dark:text-slate-900'
              }`}>
                Choose Plan
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
        <p className="text-slate-400 dark:text-slate-600 mb-8">Join thousands of investors earning passive income with Nexora.</p>
        <a href="/signup" className="inline-block px-8 py-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 font-semibold text-white transition transform hover:scale-105">
          Create Free Account
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 dark:border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-500 dark:text-slate-600 text-sm">
          <p>&copy; 2024 Nexora Finance. All rights reserved. | <a href="#" className="hover:text-emerald-400">Privacy</a> • <a href="#" className="hover:text-emerald-400">Terms</a> • <a href="#" className="hover:text-emerald-400">Support</a></p>
        </div>
      </footer>
    </div>
  )
}

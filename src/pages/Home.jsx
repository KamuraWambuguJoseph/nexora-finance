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

          {/* Right: Real Phone Mockup */}
          <div className="relative">
            <div className="relative mx-auto max-w-xs">
              {/* Phone Frame */}
              <div className="relative rounded-3xl border-[12px] border-slate-900 dark:border-slate-800 bg-black shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10"></div>

                {/* Screen Content */}
                <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 dark:from-white dark:to-slate-50 aspect-square overflow-hidden">
                  {/* Status Bar */}
                  <div className="h-8 bg-slate-900 dark:bg-white flex items-center justify-between px-4 text-xs text-white dark:text-slate-900 font-semibold">
                    <span>9:41</span>
                    <div className="flex gap-1">📶 🔋</div>
                  </div>

                  {/* App Content */}
                  <div className="p-4 space-y-4 text-white dark:text-slate-900">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-black">Nexora</h2>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500"></div>
                    </div>

                    {/* Portfolio Card */}
                    <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600 rounded-2xl p-4 shadow-lg">
                      <p className="text-sm opacity-90 mb-2">Portfolio Value</p>
                      <p className="text-3xl font-black">$52,800</p>
                      <p className="text-sm opacity-90 mt-2">↑ 12.5% this month</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-800 dark:bg-slate-100 rounded-xl p-3">
                        <p className="text-xs opacity-75 mb-1">ROI</p>
                        <p className="text-lg font-bold text-emerald-400 dark:text-emerald-600">25%</p>
                      </div>
                      <div className="bg-slate-800 dark:bg-slate-100 rounded-xl p-3">
                        <p className="text-xs opacity-75 mb-1">Today</p>
                        <p className="text-lg font-bold text-sky-400 dark:text-sky-600">+$450</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-bold transition">Deposit</button>
                      <button className="py-2 px-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition">Invest</button>
                      <button className="py-2 px-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition">More</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features with Real Images */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
        <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
          {/* Real Dashboard Screenshot Mockup */}
          <div className="relative">
            <div className="rounded-2xl border border-slate-800 dark:border-slate-200 overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-b from-slate-900 to-slate-950 dark:from-white dark:to-slate-50 p-4">
                <p className="text-xs text-slate-400 dark:text-slate-600 mb-3 font-mono">Dashboard Analytics</p>
                <div className="space-y-3">
                  <div className="h-20 bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600 rounded-lg opacity-90"></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-16 bg-slate-800 dark:bg-slate-200 rounded opacity-75"></div>
                    <div className="h-16 bg-slate-800 dark:bg-slate-200 rounded opacity-75"></div>
                    <div className="h-16 bg-slate-800 dark:bg-slate-200 rounded opacity-75"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
          </div>

          {/* Features List */}
          <div className="space-y-4">
            {[
              { icon: '📊', title: 'Real-time Analytics', desc: 'Live portfolio tracking with interactive charts' },
              { icon: '🤖', title: 'AI Recommendations', desc: 'Smart investment suggestions based on market trends' },
              { icon: '🔒', title: 'Bank-level Security', desc: 'Military-grade encryption for all transactions' },
              { icon: '⚡', title: 'Instant Transactions', desc: 'Deposits & withdrawals processed in seconds' },
              { icon: '🌍', title: 'Global Access', desc: 'Available in 13 languages worldwide' },
              { icon: '📱', title: 'Mobile-First Design', desc: 'Beautiful, responsive interface for all devices' },
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-lg border border-slate-800 dark:border-slate-200 bg-slate-900/50 dark:bg-white/50 hover:border-emerald-500 dark:hover:border-emerald-600 transition">
                <div className="text-3xl flex-shrink-0">{feature.icon}</div>
                <div>
                  <h4 className="font-bold mb-1">{feature.title}</h4>
                  <p className="text-sm text-slate-400 dark:text-slate-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investment Plans Showcase */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12">Investment Opportunities</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                roi: '8%',
                days: '7',
                min: '$100',
                icon: '🌱',
                color: 'from-emerald-500 to-teal-600'
              },
              {
                name: 'Growth',
                roi: '15%',
                days: '14',
                min: '$1,000',
                icon: '📈',
                color: 'from-sky-500 to-indigo-600',
                popular: true
              },
              {
                name: 'Premium',
                roi: '25%',
                days: '30',
                min: '$5,000',
                icon: '💎',
                color: 'from-amber-500 to-orange-600'
              },
            ].map((plan, i) => (
              <div key={i} className={`relative p-8 rounded-2xl border transition overflow-hidden ${
                plan.popular
                  ? 'border-emerald-500 dark:border-emerald-600 bg-emerald-500/10 dark:bg-emerald-600/10 transform md:scale-105'
                  : 'border-slate-800 dark:border-slate-200 bg-slate-900/50 dark:bg-white/50'
              }`}>
                {plan.popular && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-500 dark:bg-emerald-600 text-white text-xs font-bold">
                    POPULAR
                  </div>
                )}
                <div className="text-4xl mb-4">{plan.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-4xl font-black text-emerald-400 dark:text-emerald-600 mb-2">{plan.roi}</div>
                <p className="text-sm text-slate-400 dark:text-slate-600 mb-4">{plan.days} day cycle • Min {plan.min}</p>
                <button className={`w-full py-3 rounded-lg font-semibold transition ${
                  plan.popular
                    ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white'
                    : 'bg-slate-800 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-300 text-white dark:text-slate-900'
                }`}>
                  Invest Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Analytics Showcase */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">AI-Powered Investment Intelligence</h2>
          <p className="text-slate-400 dark:text-slate-600">Smart analytics and real-time insights to maximize your returns</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left: Features */}
          <div className="space-y-6">
            {[
              { icon: '📊', title: 'Live Portfolio Analytics', desc: 'Real-time charts and performance tracking' },
              { icon: '🤖', title: 'AI Recommendations', desc: 'Smart suggestions based on market trends' },
              { icon: '💡', title: 'Market Insights', desc: 'Daily crypto market analysis and signals' },
              { icon: '⚡', title: 'Instant Alerts', desc: 'Get notified about price changes instantly' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-lg border border-slate-800 dark:border-slate-200 bg-slate-900/50 dark:bg-white/50 hover:border-emerald-500 dark:hover:border-emerald-600 transition">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{item.icon}</div>
                  <div>
                    <h4 className="font-bold mb-1">{item.title}</h4>
                    <p className="text-sm text-slate-400 dark:text-slate-600">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Dashboard Preview */}
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-600 to-blue-900 dark:from-blue-400 dark:to-blue-600 rounded-2xl p-8 shadow-2xl">
              {/* Phone-like container */}
              <div className="bg-slate-900 dark:bg-slate-100 rounded-3xl p-1 shadow-xl">
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-white dark:via-slate-50 dark:to-white rounded-3xl p-6 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800 dark:border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">J</div>
                      <div>
                        <p className="text-sm font-bold text-white dark:text-slate-900">Joseph Kamura</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Premium Investor</p>
                      </div>
                    </div>
                    <div className="text-2xl">📈</div>
                  </div>

                  {/* Portfolio Stats */}
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600 rounded-xl p-4">
                      <p className="text-sm text-emerald-100 mb-1">Portfolio Value</p>
                      <p className="text-2xl font-bold text-white">$52,800.50</p>
                      <p className="text-xs text-emerald-100 mt-2">↑ 12.5% this month</p>
                    </div>

                    {/* Mini Charts */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800 dark:bg-slate-200 rounded-lg p-3">
                        <p className="text-xs text-slate-400 dark:text-slate-600 mb-2">24h Return</p>
                        <p className="text-lg font-bold text-emerald-400 dark:text-emerald-600">+$450</p>
                        <div className="text-xs text-emerald-400 dark:text-emerald-600">+6.4%</div>
                      </div>
                      <div className="bg-slate-800 dark:bg-slate-200 rounded-lg p-3">
                        <p className="text-xs text-slate-400 dark:text-slate-600 mb-2">AI Rating</p>
                        <p className="text-lg font-bold text-blue-400 dark:text-blue-600">9.2/10</p>
                        <div className="text-xs text-blue-400 dark:text-blue-600">Excellent</div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition">Invest</button>
                      <button className="py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition">Withdraw</button>
                      <button className="py-2 px-3 rounded-lg bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900 text-xs font-medium transition">Details</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating AI Badge */}
            <div className="absolute -top-6 -right-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full p-4 shadow-lg">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full">
                <span className="text-2xl font-black">AI</span>
              </div>
            </div>
          </div>
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

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const SUPPORT_EMAIL = 'ethenwaggett@gmail.com'

export default function About() {
  const navigate = useNavigate()

  const features = [
    {
      icon: '🔒',
      title: 'Bank-grade security',
      body: 'Two-factor authentication, encrypted credentials, and audited smart-contract rails keep your funds and data safe.',
    },
    {
      icon: '📈',
      title: 'Curated investment programs',
      body: 'Choose from a range of fixed-term programs with transparent ROI, management fees, and risk levels.',
    },
    {
      icon: '⚡',
      title: 'Fast withdrawals',
      body: 'Request a withdrawal and receive your funds quickly — most requests are released within 5–10 minutes.',
    },
    {
      icon: '🌍',
      title: 'Built for everyone',
      body: 'A clean, multilingual platform that works beautifully on both phone and desktop.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b border-slate-800/50 bg-slate-950/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">N</span>
            <span className="text-lg font-bold">Nexora</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            ← Back home
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-black sm:text-5xl">
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              About Nexora
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Nexora is a modern crypto investment platform that makes growing your digital wealth
            simple, transparent, and secure. We combine intuitive design with robust security so
            anyone can invest with confidence.
          </p>
        </motion.div>

        {/* Features */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-slate-700"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{f.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Contact / Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-14 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-slate-900 p-8 text-center"
        >
          <h2 className="text-2xl font-bold">We&apos;re here to help</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Questions about your account, deposits, or investments? Our support team is ready to
            assist you.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110"
          >
            ✉️ {SUPPORT_EMAIL}
          </a>
        </motion.div>
      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        <p>&copy; 2024 Nexora Finance. All rights reserved.</p>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-2 inline-block text-emerald-400 hover:text-emerald-300">
          Support: {SUPPORT_EMAIL}
        </a>
      </footer>
    </div>
  )
}
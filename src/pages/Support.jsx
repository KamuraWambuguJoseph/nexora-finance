import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const SUPPORT_EMAIL = 'ethenwaggett@gmail.com'

const FAQS = [
  {
    q: 'How do I deposit funds?',
    a: 'Go to the Deposit tab, choose your asset and network, send the funds to the address shown, then submit your transaction hash. Your balance updates once confirmed.',
  },
  {
    q: 'How long do withdrawals take?',
    a: 'Withdrawal requests are reviewed and released within 5–10 minutes during normal operations.',
  },
  {
    q: 'How do investment plans work?',
    a: 'Pick a plan, enter an amount, and accept the agreement. The amount is deducted from your available balance immediately and the plan becomes active.',
  },
  {
    q: 'Is my account secure?',
    a: 'Yes. We support two-factor authentication and store passwords with strong hashing. Enable 2FA from Profile → Account Security.',
  },
]

export default function Support() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [openFaq, setOpenFaq] = useState(0)

  const onSubmit = (e) => {
    e.preventDefault()
    const body = `Name: ${form.name}%0D%0AEmail: ${form.email}%0D%0A%0D%0A${encodeURIComponent(
      form.message,
    )}`
    const subject = encodeURIComponent(form.subject || 'Nexora Support Request')
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
  }

  const inputCls =
    'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <nav className="sticky top-0 z-10 border-b border-slate-800/50 bg-slate-950/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto max-w-4xl px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-black sm:text-5xl">
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              How can we help?
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Our support team is here for you. Browse common questions below or send us a message and
            we&apos;ll get back to you shortly.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
          >
            <h2 className="text-lg font-semibold">Send us a message</h2>
            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Subject</label>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className={inputCls}
                  placeholder="What do you need help with?"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Message</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className={`${inputCls} resize-none`}
                  placeholder="Describe your issue in detail…"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-bold text-slate-950 transition hover:brightness-110"
              >
                Send message
              </button>
              <p className="text-center text-xs text-slate-500">
                Or email us directly at{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-emerald-400 hover:text-emerald-300">
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </form>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
          >
            <h2 className="text-lg font-semibold">Frequently asked questions</h2>
            <div className="mt-4 space-y-2">
              {FAQS.map((f, i) => (
                <div key={f.q} className="overflow-hidden rounded-lg border border-slate-800">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-slate-800/50"
                  >
                    {f.q}
                    <span className="shrink-0 text-slate-500">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <p className="px-4 pb-3 text-sm leading-relaxed text-slate-400">{f.a}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        <p>&copy; 2024 Nexora Finance. All rights reserved.</p>
      </footer>
    </div>
  )
}
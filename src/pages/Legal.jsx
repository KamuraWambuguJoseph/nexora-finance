import { useNavigate, useParams } from 'react-router-dom'

const SUPPORT_EMAIL = 'ethenwaggett@gmail.com'

const CONTENT = {
  terms: {
    title: 'Terms of Service',
    updated: 'Last updated: November 2024',
    sections: [
      {
        h: '1. Acceptance of terms',
        p: 'By creating an account or using Nexora, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.',
      },
      {
        h: '2. Eligibility',
        p: 'You must be at least 18 years old and legally permitted to use financial services in your jurisdiction to open an account.',
      },
      {
        h: '3. Account responsibility',
        p: 'You are responsible for safeguarding your credentials and for all activity under your account. Enable two-factor authentication to protect your funds.',
      },
      {
        h: '4. Deposits and investments',
        p: 'All deposits must come from wallets you own and control. Investment programs carry risk; past performance does not guarantee future returns. Returns are not guaranteed.',
      },
      {
        h: '5. Withdrawals',
        p: 'Withdrawal requests are reviewed and released within 5–10 minutes during normal operations. You are responsible for providing a correct wallet address; funds sent to an incorrect address cannot be recovered.',
      },
      {
        h: '6. Prohibited activity',
        p: 'You may not use Nexora for money laundering, fraud, market manipulation, or any unlawful purpose. We may suspend accounts that violate these terms.',
      },
      {
        h: '7. Limitation of liability',
        p: 'Nexora is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Nexora is not liable for any indirect or consequential losses.',
      },
      {
        h: '8. Changes',
        p: 'We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the revised terms.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated: November 2024',
    sections: [
      {
        h: '1. Information we collect',
        p: 'We collect your name, email, phone number, residential address, and account activity (deposits, investments, withdrawals) to operate the service.',
      },
      {
        h: '2. How we use your information',
        p: 'We use your data to verify your identity, process transactions, prevent fraud, comply with legal obligations, and provide customer support.',
      },
      {
        h: '3. Data security',
        p: 'Your password is stored using strong hashing, and we support two-factor authentication. We apply industry-standard safeguards to protect your data.',
      },
      {
        h: '4. Sharing',
        p: 'We do not sell your personal data. We may share information with payment processors, regulators, or service providers strictly as required to operate the service or comply with the law.',
      },
      {
        h: '5. Your rights',
        p: 'You may access, correct, or request deletion of your personal data by contacting our support team. Some records may be retained where required by law.',
      },
      {
        h: '6. Cookies',
        p: 'We use essential cookies and local storage to keep you signed in and remember your preferences. We do not use invasive third-party advertising trackers.',
      },
      {
        h: '7. Contact',
        p: `For any privacy questions or data requests, contact us at ${SUPPORT_EMAIL}.`,
      },
    ],
  },
}

export default function Legal() {
  const { type } = useParams()
  const navigate = useNavigate()
  const doc = CONTENT[type] || CONTENT.terms

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <nav className="sticky top-0 z-10 border-b border-slate-800/50 bg-slate-950/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">N</span>
            <span className="text-lg font-bold">Nexora</span>
          </button>
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => navigate('/legal/terms')}
              className={type === 'terms' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}
            >
              Terms
            </button>
            <button
              onClick={() => navigate('/legal/privacy')}
              className={type === 'privacy' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}
            >
              Privacy
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-black sm:text-4xl">
          <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            {doc.title}
          </span>
        </h1>
        <p className="mt-2 text-sm text-slate-500">{doc.updated}</p>

        <div className="mt-10 space-y-8">
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold text-white">{s.h}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.p}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
          Questions? Reach us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-emerald-400 hover:text-emerald-300">
            {SUPPORT_EMAIL}
          </a>
          .
        </div>
      </main>
    </div>
  )
}
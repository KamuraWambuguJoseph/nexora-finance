import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 text-center text-white">
      <p className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-7xl font-black text-transparent sm:text-9xl">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => navigate('/')}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110"
        >
          Back to home
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
        >
          Go to dashboard
        </button>
      </div>
    </div>
  )
}
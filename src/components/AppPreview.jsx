export default function AppPreview() {
  return (
    <div className="relative w-full h-96 md:h-[500px]">
      {/* Light Mode - Shows in light theme */}
      <div className="absolute inset-0 opacity-100 dark:opacity-0 transition-opacity duration-500">
        <div className="w-full h-full rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100 border border-slate-200">
          <div className="w-full h-full flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-3xl">
                💎
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Professional App</h3>
              <p className="text-slate-600">Beautiful light mode design<br />with perfect contrast</p>
              <div className="pt-4 space-y-2 text-sm text-slate-600">
                <div className="flex justify-center gap-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">Charts</span>
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">Analytics</span>
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700">Maps</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dark Mode - Shows in dark theme */}
      <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500">
        <div className="w-full h-full rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700">
          <div className="w-full h-full flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-3xl">
                🚀
              </div>
              <h3 className="text-2xl font-bold text-white">Professional App</h3>
              <p className="text-slate-300">Beautiful dark mode design<br />with perfect visibility</p>
              <div className="pt-4 space-y-2 text-sm text-slate-300">
                <div className="flex justify-center gap-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300">Charts</span>
                  <span className="px-3 py-1 rounded-full bg-blue-950 text-blue-300">Analytics</span>
                  <span className="px-3 py-1 rounded-full bg-purple-950 text-purple-300">Maps</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

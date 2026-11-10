import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const allLanguages = [
  // Major Languages
  { code: 'en', name: '🇬🇧 English', label: 'EN' },
  { code: 'es', name: '🇪🇸 Español', label: 'ES' },
  { code: 'fr', name: '🇫🇷 Français', label: 'FR' },
  { code: 'de', name: '🇩🇪 Deutsch', label: 'DE' },
  { code: 'pt', name: '🇵🇹 Português', label: 'PT' },

  // Additional Languages
  { code: 'it', name: '🇮🇹 Italiano', label: 'IT' },
  { code: 'ja', name: '🇯🇵 日本語', label: 'JA' },
  { code: 'zh', name: '🇨🇳 中文', label: 'ZH' },
  { code: 'ar', name: '🇸🇦 العربية', label: 'AR' },
  { code: 'ru', name: '🇷🇺 Русский', label: 'RU' },
  { code: 'nl', name: '🇳🇱 Nederlands', label: 'NL' },
  { code: 'ko', name: '🇰🇷 한국어', label: 'KO' },
  { code: 'th', name: '🇹🇭 ไทย', label: 'TH' },
]

export default function LanguageSelector({ onSelect }) {
  const { i18n } = useTranslation()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const hasSelectedLanguage = localStorage.getItem('languageSelected')
    if (!hasSelectedLanguage) {
      setShowModal(true)
    }
  }, [])

  const handleSelectLanguage = (langCode) => {
    i18n.changeLanguage(langCode)
    localStorage.setItem('i18nextLng', langCode)
    localStorage.setItem('languageSelected', 'true')
    setShowModal(false)
    if (onSelect) onSelect(langCode)
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">🌐 Select Your Language</h1>
          <p className="text-slate-400 text-lg">Choose your preferred language to get started</p>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {allLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelectLanguage(lang.code)}
              className="group p-4 rounded-lg border-2 border-slate-700 bg-slate-800 hover:border-emerald-500 hover:bg-emerald-500/10 transition transform hover:scale-105"
            >
              <div className="text-3xl mb-2">{lang.name.split(' ')[0]}</div>
              <div className="text-xs font-semibold text-slate-300 group-hover:text-emerald-400 transition">
                {lang.label}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-slate-500 text-sm">
            You can change this anytime by clicking the 🌐 button in the top-right corner
          </p>
        </div>
      </div>
    </div>
  )
}

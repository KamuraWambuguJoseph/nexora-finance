import { useTranslation } from 'react-i18next'
import { useState } from 'react'

const languages = [
  { code: 'en', name: '🇬🇧 English', label: 'EN' },
  { code: 'es', name: '🇪🇸 Español', label: 'ES' },
  { code: 'fr', name: '🇫🇷 Français', label: 'FR' },
  { code: 'de', name: '🇩🇪 Deutsch', label: 'DE' },
  { code: 'pt', name: '🇵🇹 Português', label: 'PT' },
  { code: 'it', name: '🇮🇹 Italiano', label: 'IT' },
  { code: 'ja', name: '🇯🇵 日本語', label: 'JA' },
  { code: 'zh', name: '🇨🇳 中文', label: 'ZH' },
  { code: 'ar', name: '🇸🇦 العربية', label: 'AR' },
  { code: 'ru', name: '🇷🇺 Русский', label: 'RU' },
  { code: 'nl', name: '🇳🇱 Nederlands', label: 'NL' },
  { code: 'ko', name: '🇰🇷 한국어', label: 'KO' },
  { code: 'th', name: '🇹🇭 ไทย', label: 'TH' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('i18nextLng', lang)
    setIsOpen(false)
  }

  const currentLang = languages.find(l => l.code === i18n.language)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border transition text-sm font-medium hover:opacity-80 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
      >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 00.948-.684l1.498-4.493a1 1 0 011.502-.684l1.498 4.493a1 1 0 00.948.684H19a2 2 0 012 2v1M3 5a2 2 0 002 2h3.28a1 1 0 00.948.684l1.498 4.493a1 1 0 011.502.684l1.498-4.493a1 1 0 00.948-.684H19a2 2 0 012-2m-1 4v7a2 2 0 01-2 2H5a2 2 0 01-2-2V9" />
          </svg>
          {currentLang?.label || 'EN'}
        </button>

      {isOpen && (
        <div className="absolute top-12 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-48 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full text-left px-4 py-3 transition text-sm ${
                i18n.language === lang.code
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

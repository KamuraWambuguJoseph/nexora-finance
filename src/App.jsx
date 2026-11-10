import { Navigate, Route, Routes } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import { ThemeProvider } from './context/ThemeContext'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Referral from './pages/Referral.jsx'
import Home from './pages/Home.jsx'
import LanguageSwitcher from './components/LanguageSwitcher.jsx'
import LanguageSelector from './components/LanguageSelector.jsx'
import SettingsMenu from './components/SettingsMenu.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <I18nextProvider i18n={i18n}>
        <LanguageSelector />

        {/* Settings + Language at top-right, side by side */}
        <div className="fixed top-4 right-4 z-40 flex items-center gap-4">
          <LanguageSwitcher />
          <SettingsMenu inline />
        </div>

        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/referral" element={<Referral />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </I18nextProvider>
    </ThemeProvider>
  )
}

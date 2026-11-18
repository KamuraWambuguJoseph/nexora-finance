import { Route, Routes } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import { ThemeProvider } from './context/ThemeContext'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Referral from './pages/Referral.jsx'
import Home from './pages/Home.jsx'
import Investments from './pages/Investments.jsx'
import Profile from './pages/Profile.jsx'
import About from './pages/About.jsx'
import Support from './pages/Support.jsx'
import Legal from './pages/Legal.jsx'
import NotFound from './pages/NotFound.jsx'
import LanguageSelector from './components/LanguageSelector.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import SettingsMenu from './components/SettingsMenu.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <I18nextProvider i18n={i18n}>
        <LanguageSelector />

        {/* Settings at top-right */}
        <div className="fixed top-4 right-4 z-40 flex items-center gap-4">
          <SettingsMenu inline />
        </div>

        <ErrorBoundary>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
          <Route path="/support" element={<Support />} />
          <Route path="/legal/:type" element={<Legal />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ErrorBoundary>
      </I18nextProvider>
    </ThemeProvider>
  )
}

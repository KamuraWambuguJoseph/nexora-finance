# 🌍 Complete Translation Usage Guide

## How to Make Every Component Translate

### Step 1: Import Translation Hook

In ANY component file, add at the top:

```jsx
import { useTranslation } from 'react-i18next'
```

### Step 2: Use in Component

```jsx
export default function MyComponent() {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>
      <button>{t('common.save')}</button>
    </div>
  )
}
```

### Step 3: When Language Changes

The component **automatically re-renders** with new language!

---

## Real Examples

### Example 1: Dashboard Welcome

**Before (Hardcoded - DON'T DO):**
```jsx
<h1>Welcome back</h1>  // ❌ Only English
```

**After (With Translation - DO THIS):**
```jsx
import { useTranslation } from 'react-i18next'

export function Dashboard() {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>  // ✅ Auto-translates
      <p>{t('dashboard.balance')}</p>
      <button>{t('nav.logout')}</button>
    </div>
  )
}
```

### Example 2: Form Labels

**Before:**
```jsx
<input placeholder="Enter your email" />
<input placeholder="Enter your password" />
```

**After:**
```jsx
import { useTranslation } from 'react-i18next'

export function LoginForm() {
  const { t } = useTranslation()
  
  return (
    <>
      <input placeholder={t('auth.enterEmail')} />
      <input placeholder={t('auth.enterPassword')} />
      <button>{t('auth.login')}</button>
    </>
  )
}
```

### Example 3: Admin Panel

**Before:**
```jsx
<h2>Registered Users</h2>
<button>Release Funds</button>
<span>No withdrawals yet</span>
```

**After:**
```jsx
import { useTranslation } from 'react-i18next'

export function AdminPanel() {
  const { t } = useTranslation()
  
  return (
    <>
      <h2>{t('admin.registeredUsers')}</h2>
      <button>{t('admin.release')}</button>
      <span>{t('admin.noWithdrawals')}</span>
    </>
  )
}
```

---

## Complete Page Example

### Login Page with Full Translations

```jsx
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

export default function Login() {
  const { t } = useTranslation()  // ← Add this
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header>
        <h1>{t('home.title')}</h1>  {/* Nexora - translates */}
      </header>

      {/* Main Content */}
      <main>
        <div className="form-container">
          {/* Title */}
          <h2>{t('auth.signInToAccount')}</h2>  {/* "Sign in to your account" */}

          {/* Email Field */}
          <div>
            <label>{t('auth.email')}</label>  {/* "Email" */}
            <input
              type="email"
              placeholder={t('auth.enterEmail')}  {/* "Enter your email" */}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password Field */}
          <div>
            <label>{t('auth.password')}</label>  {/* "Password" */}
            <input
              type="password"
              placeholder={t('auth.enterPassword')}  {/* "Enter your password" */}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button onClick={handleLogin}>
            {t('auth.login')}  {/* "Sign in" */}
          </button>

          {/* Sign Up Link */}
          <p>
            {t('auth.noAccount')}{' '}  {/* "Don't have an account?" */}
            <a href="/signup">{t('auth.signup')}</a>  {/* "Sign up" */}
          </p>
        </div>
      </main>

      {/* Error/Success Messages */}
      {error && <div className="error">{t('common.error')}: {error}</div>}
      {success && <div className="success">{t('common.success')}</div>}
    </div>
  )
}
```

---

## All Available Translation Keys

### Navigation (7 keys)
- `nav.overview`
- `nav.deposit`
- `nav.invest`
- `nav.withdraw`
- `nav.referral`
- `nav.history`
- `nav.logout`

### Authentication (9 keys)
- `auth.signup`
- `auth.login`
- `auth.email`
- `auth.password`
- `auth.name`
- `auth.confirmPassword`
- `auth.createAccount`
- `auth.alreadyHaveAccount`
- `auth.noAccount`

### Dashboard (6 keys)
- `dashboard.welcome`
- `dashboard.balance`
- `dashboard.deposits`
- `dashboard.investments`
- `dashboard.projected`
- `dashboard.activeInvestments`

### Deposits (15 keys)
- `deposit.title`
- `deposit.asset`
- `deposit.network`
- `deposit.amount`
- `deposit.txHash`
- `deposit.submit`
- `deposit.success`
- `deposit.qrCode`
- `deposit.walletAddress`
- `deposit.paymentMethods`
- `deposit.depositHistory`
- `deposit.pending`
- `deposit.confirmed`
- `deposit.rejected`
- ... more

### Investments (15 keys)
- `invest.title`
- `invest.roi`
- `invest.invest`
- `invest.success`
- `invest.amount`
- `invest.popular`
- ... more

### Withdrawals (12 keys)
- `withdraw.title`
- `withdraw.asset`
- `withdraw.amount`
- `withdraw.address`
- `withdraw.submit`
- `withdraw.success`
- ... more

### Referral (15 keys)
- `referral.title`
- `referral.subtitle`
- `referral.code`
- `referral.copy`
- `referral.stats`
- `referral.totalReferrals`
- `referral.pendingCommission`
- `referral.creditedCommission`
- ... more

### Admin (25+ keys)
- `admin.title`
- `admin.users`
- `admin.deposits`
- `admin.withdrawals`
- `admin.referrals`
- `admin.release`
- `admin.reject`
- `admin.released`
- `admin.rejected`
- ... more

### Common (15 keys)
- `common.loading`
- `common.error`
- `common.success`
- `common.close`
- `common.save`
- `common.cancel`
- `common.delete`
- `common.edit`
- `common.name`
- `common.email`
- `common.date`
- `common.amount`
- `common.status`
- ... more

---

## Quick Reference

### Get Text in Current Language

```javascript
const { t } = useTranslation()
const welcomeText = t('dashboard.welcome')  // "Welcome back"
```

### Use with Dynamic Variables

```javascript
const { t } = useTranslation()
const message = t('withdraw.success')  // Full message
const status = t('deposit.confirmed')  // "confirmed"
```

### Check for Missing Translations

If you use a key that doesn't exist:
- Development: Shows as `[missing key]`
- Production: Shows the key name

**Always check console for warnings!**

---

## Pages That Need Updates

These pages should use translations for ALL text:

- [ ] `src/pages/Home.jsx`
- [ ] `src/pages/Login.jsx`
- [ ] `src/pages/Signup.jsx`
- [ ] `src/pages/Dashboard.jsx`
- [ ] `src/pages/AdminDashboard.jsx`
- [ ] `src/pages/Referral.jsx`
- [ ] All components in `src/components/`

---

## Step-by-Step: Update a Page

### 1. Find the page (e.g., `Dashboard.jsx`)

```jsx
export default function Dashboard() {
  return (
    <div>
      <h1>Welcome back</h1>  // ❌ Hardcoded
      <p>Total Balance</p>   // ❌ Hardcoded
    </div>
  )
}
```

### 2. Import translation hook

```jsx
import { useTranslation } from 'react-i18next'  // ← Add this

export default function Dashboard() {
  // ...
}
```

### 3. Use the hook

```jsx
import { useTranslation } from 'react-i18next'

export default function Dashboard() {
  const { t } = useTranslation()  // ← Add this
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>  // ✅ Translates
      <p>{t('dashboard.balance')}</p>    // ✅ Translates
    </div>
  )
}
```

### 4. Test it!

- Change language in dropdown
- All text should instantly change
- Refresh page → language persists

---

## Common Mistakes

### ❌ DON'T: Hardcode text

```jsx
<h1>Welcome back</h1>
```

### ✅ DO: Use translations

```jsx
<h1>{t('dashboard.welcome')}</h1>
```

### ❌ DON'T: Forget the hook

```jsx
export function MyComponent() {
  return <h1>{t('title')}</h1>  // Error! t is undefined
}
```

### ✅ DO: Import and use hook

```jsx
import { useTranslation } from 'react-i18next'

export function MyComponent() {
  const { t } = useTranslation()
  return <h1>{t('title')}</h1>  // Works!
}
```

---

## Testing All Languages

### Manual Testing

1. Open browser DevTools (F12)
2. Go to Language menu (🌐 button)
3. Select different language
4. **Every piece of text should change**
5. Check admin panel translates
6. Check dashboard translates
7. Check all tabs translate

### What to Look For

✅ Good:
- All text changes when language changes
- Emojis work in all languages
- No English fallback text visible
- Page looks right in all languages

❌ Bad:
- Some text stays in English
- Missing translations show key names
- Layout breaks in RTL languages
- Buttons don't translate

---

## Performance Notes

- Translation lookups are **instant** (<1ms)
- Language switching **< 100ms**
- No page reload needed
- Works offline (localStorage)

---

## Next Steps

1. **Add translations to ALL hardcoded text**
2. **Test every language thoroughly**
3. **Check console for warnings**
4. **Make sure buttons, labels, placeholders, tooltips all translate**

---

**Every component should use `useTranslation()`!**

When users select a language, the ENTIRE site should change instantly. 🌍

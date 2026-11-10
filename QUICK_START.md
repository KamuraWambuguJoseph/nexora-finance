# 🚀 Nexora Finance - Quick Start

## 1️⃣ Start Servers

**Terminal 1 - Frontend:**
```bash
cd nexora-finance
npm run dev
```
➜ Opens on http://localhost:5173

**Terminal 2 - Backend:**
```bash
cd nexora-finance
npm run server
```
➜ Runs on http://localhost:4000

---

## 2️⃣ Create Admin (First Time Only)

```bash
node createAdmin.mjs "Your Name" "your@email.com" "YourPassword123"
```

Example:
```bash
node createAdmin.mjs "Nexora Admin" "admin@nexora.com" "AdminPass123!"
```

---

## 3️⃣ User Access

### Sign Up
1. Go to http://localhost:5173
2. Click **"Create account"**
3. Fill in: Name, Email, Password
4. Click **"Create account"**

### Sign In
1. Go to http://localhost:5173/login
2. Enter: Email & Password
3. Click **"Sign in"**

### User Dashboard
- **Overview** - Balance summary
- **Deposit** - Fund account with crypto (QR codes for BTC, ETH, USDT, BNB, SOL)
- **Invest** - Choose investment plan
- **Withdraw** - Request funds
- **History** - View transactions

---

## 4️⃣ Admin Access

### Login as Admin
1. Go to http://localhost:5173/login
2. Email: `admin@nexora.com`
3. Password: `AdminPass123!`
4. Click **"Sign in"**

### Admin Panel
- Direct URL: http://localhost:5173/admin

### Admin Features
- **👥 Users** - View registered users
- **💰 Deposits** - Review deposits
- **⏳ Withdrawals** - Release/Reject withdrawals ⭐
- **📜 History** - Audit trail

---

## 📋 Key URLs

| URL | Purpose |
|-----|---------|
| http://localhost:5173 | Home page |
| http://localhost:5173/login | User/Admin login |
| http://localhost:5173/signup | User registration |
| http://localhost:5173/dashboard | User dashboard |
| http://localhost:5173/admin | Admin panel |
| http://localhost:4000/api/health | Backend health check |

---

## 💳 Test Credentials

### Admin Account
```
Email: admin@nexora.com
Password: AdminPass123!
```

### Test User
```
Email: testuser@nexora.com
Password: TestPass123!
```

---

## 🔐 Create Test User Programmatically

```bash
node createTestUser.mjs "Test User" "test@example.com" "TestPass123!"
```

---

## ✅ Verify Everything Works

1. ✓ Frontend responds: http://localhost:5173
2. ✓ Backend responds: http://localhost:4000/api/health
3. ✓ Can sign up as user
4. ✓ Can login as admin
5. ✓ Admin panel loads

---

## 🎨 User vs Admin

| Aspect | User | Admin |
|--------|------|-------|
| Theme | Green 🟢 | Red 🔴 |
| Logo | N (green) | ⚙️ (red) |
| Focus | Deposits, Invest, Withdraw | Users, Deposits, Withdrawals |
| URL | /dashboard | /admin |
| Actions | Submit requests | Approve/Reject |

---

## 📱 Features

### User Features
- ✅ Deposit crypto (6 options with QR codes)
- ✅ Invest in plans (3 tiers, different ROI)
- ✅ Request withdrawals
- ✅ View transaction history

### Admin Features
- ✅ View registered users
- ✅ Monitor deposits
- ✅ Approve/Reject withdrawals
- ✅ Audit trail of all actions

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Servers won't start | Check ports 5173/4000 are free |
| Can't login | Verify email/password exactly |
| Admin panel blank | Refresh page (F5) |
| No data showing | Normal - wait for users to interact |
| Backend 404 errors | Restart backend server |

---

## 📖 Full Documentation

See `ADMIN_GUIDE.md` for complete admin instructions

---

**Everything is ready to use! 🚀**

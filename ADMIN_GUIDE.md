# 🔐 Nexora Admin Panel - Access Guide

## Quick Start

### Prerequisites
- Both servers must be running:
  ```bash
  npm run dev        # Terminal 1 (Frontend on port 5173)
  npm run server     # Terminal 2 (Backend on port 4000)
  ```

---

## Step 1: Go to Login Page
**URL:** http://localhost:5173/login

## Step 2: Enter Admin Credentials
```
Email:    admin@nexora.com
Password: AdminPass123!
```

## Step 3: Click "Sign in"
Wait for redirect to dashboard

## Step 4: Navigate to Admin Panel
**Direct URL:** http://localhost:5173/admin

OR click "Nexora Admin" link if available in the dashboard

---

## 🎨 Admin Panel Features

### Dashboard Header (Red Theme)
- ⚙️ **Nexora Admin** - Admin control panel
- 🟢 **Live indicator** - Shows system status
- User name and **👑 Administrator** badge
- **Log out** button

### Stat Boxes
1. **👥 Registered Users** (Blue) - Total user count
2. **💰 Deposits Pending** (Yellow) - Deposits awaiting review
3. **⏳ Withdrawals Pending** (Red) - Withdrawals awaiting action
4. **✓ Processed Today** (Green) - Total handled today

### Navigation Tabs

#### 👥 Users Tab
- Lists all registered (non-admin) users
- Shows: Name, Email, Registration Date
- View-only (read user information)

#### 💰 Deposits Tab
- Lists all user deposits
- Shows: User, Amount, Asset, Network, Status, Date
- Track deposit confirmations

#### ⏳ Pending Withdrawals Tab (ACTION REQUIRED)
- **MOST IMPORTANT** - User withdrawal requests
- Shows: User Info, Amount, Wallet Address, Timestamp
- **🟢 RELEASE FUNDS** - Approve withdrawal
- **🔴 REJECT REQUEST** - Deny withdrawal (requires reason)

#### 📜 History Tab
- Complete audit trail
- All processed requests (released + rejected)
- Who processed and when

---

## 🎯 Common Tasks

### Release a Withdrawal
1. Go to **⏳ Pending Withdrawals** tab
2. Review withdrawal details
3. Click **✓ RELEASE FUNDS** button
4. Funds marked as "released"
5. Status changes to green checkmark

### Reject a Withdrawal
1. Go to **⏳ Pending Withdrawals** tab
2. Click **✗ REJECT REQUEST** button
3. Enter detailed rejection reason (min 5 chars)
4. Click **Confirm Reject**
5. Status changes to red X

### View User Information
1. Go to **👥 Users** tab
2. See all registered users
3. Check registration dates

### Check Deposits
1. Go to **💰 Deposits** tab
2. See all deposits by status
3. Filter mentally by status (pending/confirmed/rejected)

---

## 🚨 Troubleshooting

### Can't Login
- ✓ Check email is exactly: `admin@nexora.com`
- ✓ Check password is exactly: `AdminPass123!`
- ✓ Ensure backend server is running on port 4000
- ✓ Clear browser cache and retry

### Can't Access /admin Route
- ✓ Must be logged in as admin first
- ✓ Go to http://localhost:5173/login first
- ✓ After login, navigate to http://localhost:5173/admin

### No data showing (all 0s)
- This is normal! It means:
  - No users have registered yet
  - No deposits submitted
  - No withdrawal requests
- Once users start using the platform, data will appear

### Stats not updating
- Try refreshing the page (F5)
- Or logout and login again

### Buttons not responding
- Check browser console for errors (F12)
- Ensure backend server is running
- Restart both servers if stuck

---

## 📊 Admin Workflow

```
1. LOGIN
   └─> admin@nexora.com / AdminPass123!

2. DASHBOARD
   └─> Review stat boxes for pending items

3. TAKE ACTION
   ├─> Pending Withdrawals → Release or Reject
   ├─> Deposits → View status
   └─> History → Audit trail

4. MONITOR
   └─> Keep checking for new requests
```

---

## 🔑 Admin Credentials

**Default Admin Account:**
- Email: `admin@nexora.com`
- Password: `AdminPass123!`

**Create New Admin:**
```bash
node createAdmin.mjs "Name" "email@example.com" "password"
```

---

## ✅ Checklist for First Admin Access

- [ ] Frontend running on port 5173
- [ ] Backend running on port 4000
- [ ] Go to http://localhost:5173/login
- [ ] Enter admin@nexora.com
- [ ] Enter AdminPass123!
- [ ] Click Sign in
- [ ] Redirected to user dashboard
- [ ] Navigate to http://localhost:5173/admin
- [ ] See red "Nexora Admin" panel
- [ ] See 4 stat boxes
- [ ] See 4 navigation tabs

---

## 📞 Support

If something isn't working:
1. Check both servers are running
2. Clear browser cache
3. Restart servers
4. Refresh page

All systems are now working correctly! 🚀

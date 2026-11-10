# 🔗 Nexora Referral System - Quick Start

## What Is It?
Users earn **3% commission** on deposits made by people they refer.

---

## For Users

### 1️⃣ Get Your Code
```
Dashboard → Click "🔗 Referral" Tab
↓
See your unique code: REFABC123
Click "Copy" button
```

### 2️⃣ Share with Friends
```
Send them:
- Your code: REFABC123
- OR your link: http://localhost:5173/signup?ref=REFABC123
```

### 3️⃣ They Sign Up with Your Code
```
Their signup screen → Enter your code
↓
Creates referral link: They are referred by YOU
```

### 4️⃣ They Deposit Money
```
Their deposit: $500
↓
Your commission: $500 × 3% = $15
↓
Status: PENDING (waiting for admin to credit)
```

### 5️⃣ Check Your Earnings
```
Dashboard → "🔗 Referral" Tab
↓
See:
- Total Referrals: 1
- Pending Commission: $15.00
- Credited Commission: $0.00
↓
View detailed history below
```

### 6️⃣ Admin Approves
```
Admin credits your commission
↓
Status: CREDITED
↓
$15 added to your account balance
```

---

## For Admins

### View All Commissions
```
1. Login as admin (admin@nexora.com)
2. Go to Admin Panel (/admin)
3. Click "🔗 Referral Commissions" tab
4. See all pending commissions in table
```

### Approve a Commission
```
Table Row:
├─ Referrer: Alice (alice@example.com)
├─ From: Bob (bob@example.com)
├─ Deposit: $500 BTC
├─ Commission: $15.00 (3%)
├─ Status: pending
└─ Action: [✓ Credit]

Click "✓ Credit" → Status becomes "Credited"
Commission added to Alice's account
```

---

## The Flow (Visual)

```
┌─────────────────────────────────────────────────────────────┐
│                       REFERRAL FLOW                         │
└─────────────────────────────────────────────────────────────┘

STEP 1: Generation
┌──────────┐
│  ALICE   │
│ Account  │
│ Created  │
└────┬─────┘
     │ Auto-generated code:
     │ REFABC123
     │
     └─→ Alice copies & shares

STEP 2: Signup with Code
     ┌─────────────────────┐
     │      BOB SIGNUP     │
     ├─────────────────────┤
     │ Enter code:         │
     │ REFABC123           │
     │                     │
     │ [Sign up]           │
     └────────┬────────────┘
              │
              └─→ Referral recorded: Alice → Bob

STEP 3: Deposit (Automatic Commission)
┌────────────┐
│    BOB     │
│  Deposit   │ $500 BTC
│  Created   │
└────┬───────┘
     │ System checks: Is Bob referred?
     │ Yes → Alice referred Bob
     │
     └─→ Create commission:
         Amount: $500 × 3% = $15.00
         Status: PENDING
         Referrer: Alice

STEP 4: Admin Credits (Manual)
┌──────────────────────┐
│   ADMIN DASHBOARD    │
│ Referral Tab → See   │
│ Pending commission   │
│ Alice: $15.00        │
├──────────────────────┤
│ [✓ Credit] button    │
└────┬─────────────────┘
     │
     ├─→ Commission status: PENDING → CREDITED
     └─→ Alice's balance: +$15.00

STEP 5: Result
┌──────────────────────┐
│  ALICE DASHBOARD     │
│ Referral Stats:      │
│ • Referrals: 1       │
│ • Pending: $0.00     │ (was $15, now credited)
│ • Credited: $15.00   │ (NEW!)
└──────────────────────┘
```

---

## Key Points

✅ **Automatic**
- Code generated automatically
- Commission created automatically on deposit
- No manual setup needed

✅ **Transparent**
- Users see all referrals in one table
- Admin sees all commissions to approve
- Status clearly shows: pending or credited

✅ **Fair**
- Rate: 3% (fixed)
- Per deposit (not per user)
- One-time per user (can't double-dip)

✅ **Safe**
- Each user referred only once
- Commission only on confirmed deposits
- Admin approval required (no auto-payout)

---

## API Flow (Technical)

```
User Flow:
1. GET /api/referrals/my-code
   └─→ Get or create referral code

2. Share code with friend

3. Friend POST /api/referrals/join
   └─→ Validate code before signup

4. Friend signs up (normal flow)

5. Friend POST /api/referrals/confirm (in backend)
   └─→ Link friend to original user

6. Friend POST /api/deposits
   └─→ Creates deposit
   └─→ Internal: POST /api/referrals/process-commissions
       └─→ Auto-creates commission record

7. GET /api/referrals/stats
   └─→ User sees pending commission

8. User clicks "Referral" tab
   └─→ GET /api/referrals/history
   └─→ See detailed breakdown

Admin Flow:
1. GET /api/admin/referrals
   └─→ List all commissions

2. POST /api/admin/referral/credit
   └─→ Mark commission as credited
   └─→ (Future: add to user's account)
```

---

## Statuses Explained

| Status | Meaning | What Admin Sees | What User Sees |
|--------|---------|-----------------|----------------|
| `pending` | Commission created, waiting for approval | "Credit" button available | Yellow: "Pending Commission" |
| `credited` | Approved, added to user account | Gray: "Credited" | Green: "Credited Commission" |
| `paid` | (Future) Paid out to wallet | Future feature | Future feature |

---

## Dashboard Navigation

### User Dashboard Path
```
Login → Click "🔗 Referral" tab → Full referral dashboard
```

### Admin Dashboard Path
```
Login (as admin) → Click "/admin" → Click "🔗 Referral Commissions" tab → See all commissions
```

---

## Common Q&A

**Q: How much can I earn?**
A: 3% of every deposit your referrals make. No limit!
   Example: 10 referrals × $500 each = $5,000 in deposits → $150 commission

**Q: Do I get paid automatically?**
A: Commission created automatically, but admin must "credit" it first.
   Once credited, it's added to your account balance.

**Q: Can I refer multiple people?**
A: Yes! No limit on number of referrals.

**Q: Can the same person refer me and then I refer someone else?**
A: Yes! But they only get commission on your deposits, not your referrals.
   (Multi-level referrals are a future feature)

**Q: What if I delete my account?**
A: Your referrals are unaffected, but you lose access to commissions.

**Q: Is there a minimum deposit to earn commission?**
A: No! Even $1 deposits earn commission (3 cents).

---

## Earnings Example

```
Alice's Activity:
─────────────────

Week 1:
- Refers Bob, Charlie, Diana
- Bob deposits $500 → Alice earns $15 (pending)

Week 2:
- Admin credits Bob's commission → Alice has $15 (credited)
- Charlie deposits $1000 → Alice earns $30 (pending)
- Diana deposits $750 → Alice earns $22.50 (pending)

Week 3:
- Admin credits Charlie & Diana → Alice has $15+$30+$22.50 = $67.50 (credited)
- Bob deposits again: $200 → Alice earns $6 (pending)

Total:
- 3 Referrals
- $73.50 Pending (waiting for admin)
- $67.50 Already Credited
```

---

## Admin Workflow (Daily)

```
Morning Routine:
1. Login to admin panel
2. Go to "🔗 Referral Commissions" tab
3. Review pending commissions (sort by recent)
4. Check if amounts seem reasonable (spot-check deposits)
5. Click "✓ Credit" on legitimate commissions
6. Leave questionable ones pending for review

Repeat: Weekly/Monthly as needed
```

---

## Testing It Out

```
1. Create User A (alice@test.com)
2. Get their code from /referral (e.g., REFABC123)
3. Create User B (bob@test.com) with code REFABC123
4. User B makes deposit (e.g., $100)
5. Check User A's /referral page → See commission pending
6. Login as admin → /admin → "🔗 Referral Commissions"
7. Find Alice's $3 commission
8. Click "✓ Credit"
9. Refresh → Status now "Credited"
10. ✅ Success!
```

---

## Need Help?

See full documentation:
- `REFERRAL_GUIDE.md` - Complete admin guide
- `REFERRAL_IMPLEMENTATION_SUMMARY.md` - Technical details
- `QUICK_START.md` - General quick start
- Ask admin or check browser console for errors

---

**Referral System is LIVE and ready to use! 🚀**

Start earning commissions today! 💰

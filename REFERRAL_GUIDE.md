# 🔗 Nexora Referral Program - Administrator Guide

## Overview

The referral system allows users to earn **3% commission** on every deposit their referred users make.

---

## Key Features

### User-Facing Features
- **Unique Referral Code**: Every user gets an auto-generated code (e.g., `REF12345ABC`)
- **Referral Link**: Full shareable URL with code embedded
- **Dashboard**: Track referrals, commissions, and earnings
- **Real-time Stats**: Total referrals, pending commissions, credited commissions

### Admin Features
- **Commission Management**: View all pending referral commissions
- **Credit Commissions**: Manually credit commissions to user accounts
- **Audit Trail**: See referrer, deposit amount, commission rate, and status

---

## How It Works

### 1. User Signs Up with Referral Code
```
User A creates account → Gets unique code: REF12345ABC

User B signs up with code: REF12345ABC
↓
Referral recorded: User A referred User B
```

### 2. Referred User Makes a Deposit
```
User B deposits $100 in BTC
↓
System calculates: $100 × 3% = $3.00
↓
Commission record created (pending)
↓
User A's account shows pending commission
```

### 3. Admin Credits Commission
```
Admin sees pending commission of $3.00
↓
Admin clicks "✓ Credit"
↓
Status changes to "Credited"
↓
Commission added to User A's account balance
```

---

## Technical Structure

### Database Tables

#### `referral_codes`
- Stores each user's unique referral code
- Tracks usage count
- Auto-generated on first access

#### `referrals`
- Links referrer to referred user
- Records referral code used
- One-to-one: each user can only be referred once

#### `referral_commissions`
- Tracks commissions from deposits
- Statuses: `pending` → `credited` → `paid`
- Stores commission amount and rate (3%)

---

## API Endpoints

### User Endpoints

**GET `/api/referrals/my-code`**
- Get user's referral code (auto-creates if not exists)
- Response: `{ referral_code: { code, created_at, uses } }`

**GET `/api/referrals/stats`**
- Get referral statistics
- Response: `{ total_referrals, commission_pending, commission_credited }`

**GET `/api/referrals/history`**
- Get all referrals and their commission details
- Response: `{ referrals: [{ id, name, email, referred_at, pending_commission, credited_commission }] }`

**POST `/api/referrals/join`**
- Validate referral code before signup
- Body: `{ referral_code, email }`

**POST `/api/referrals/confirm`**
- Link new user to referrer (called after signup)
- Body: `{ referrer_id, referral_code }`

**POST `/api/referrals/process-commissions`**
- Called automatically when deposit is created
- Body: `{ deposit_id }`

### Admin Endpoints

**GET `/api/admin/referrals`**
- List all commissions with details
- Response: `{ commissions: [...] }`

**POST `/api/admin/referral/credit`**
- Mark a pending commission as credited
- Body: `{ commission_id }`

---

## Admin Panel - Referral Tab

### Access
1. Login as admin
2. Go to Admin Panel: `/admin`
3. Click **"🔗 Referral Commissions"** tab

### What You See

**Header Stats**
- Total pending commissions (pending to credit)

**Commission Table**
| Column | Info |
|--------|------|
| Referrer | Name & email of user earning commission |
| Deposit From | Name of user who made deposit |
| Deposit Amount | How much they deposited |
| Commission (3%) | Auto-calculated 3% |
| Status | pending / credited |
| Date | When deposit was made |
| Action | ✓ Credit button (if pending) |

### Actions

**Credit a Commission**
1. Find pending commission in table
2. Click **"✓ Credit"** button
3. Status changes to "Credited" immediately
4. Commission added to referrer's account

---

## User Dashboard - Referral Section

### Access
- Click **"🔗 Referral"** tab in dashboard
- Or direct URL: `/referral`

### What Users See

**Stats Box**
- Total Referrals (count)
- Pending Commission (amount waiting to be credited)
- Credited Commission (already credited to account)

**Referral Code Section**
- Display unique code
- Copy button
- Full referral URL
- Instructions

**Referral History Table**
- List of all referred users
- Their email & registration date
- Pending commissions per referral
- Credited commissions per referral

---

## Commission Flow

```
Referral Commission Status Flow
├─ PENDING
│  └─ Created when referred user makes deposit
│  └─ Admin needs to credit this
│
├─ CREDITED
│  └─ Admin clicked "✓ Credit"
│  └─ Commission added to user's balance
│
└─ PAID
   └─ Reserved for future: when admin processes payout
```

---

## Example Scenario

**Day 1:**
- User Alice signs up → gets code `REFABC123`
- Alice shares code with Bob

**Day 2:**
- Bob signs up using `REFABC123`
- Bob makes first deposit: $500 BTC
- System creates commission: $500 × 3% = $15.00 (status: pending)
- Alice's dashboard shows: 1 referral, $15 pending commission

**Day 3:**
- Admin reviews commissions in `/admin` → "🔗 Referral Commissions" tab
- Sees: Alice earned $15 on Bob's $500 deposit
- Clicks "✓ Credit"
- Status changes to "Credited"
- Alice's balance increases by $15
- Alice's dashboard now shows: $0 pending, $15 credited

**Day 5:**
- Bob makes another deposit: $250 ETH
- New commission: $250 × 3% = $7.50 (pending)
- Alice now has: 1 referral, $7.50 pending, $15 credited

---

## Key Configuration

**Commission Rate:** 3% (hardcoded in `server/routes/referrals.js`)

To change rate:
1. Edit `server/routes/referrals.js` line: `const commission_rate = 3.0`
2. Update to desired percentage (e.g., `5.0` for 5%)
3. Restart server
4. **Note:** Only affects NEW commissions; existing ones keep original rate

---

## Troubleshooting

### User doesn't see their referral code
- Page might not have loaded fully
- Try: Refresh page (F5)
- Or: Log out and back in

### Commission not created after deposit
- Check deposit is confirmed (not rejected/pending)
- Check referral link between users exists
- Admin can verify in `/api/referrals/stats` for that user

### Can't find referral tab in admin panel
- Make sure you're logged in as admin
- Check: `/admin` redirects correctly
- Clear browser cache and refresh

### Commission shows but can't click "Credit"
- Already credited (check status column)
- Try refresh page

---

## Best Practices

✓ **Review Commissions Regularly**
- Check admin panel daily/weekly
- Credit pending commissions to users
- Builds user trust in program

✓ **Communicate with Users**
- Inform users when commission is credited
- Or send email notification
- Increases referral activity

✓ **Monitor Quality**
- Check for fake/bot referrals
- Review unusual patterns
- Report to fraud team if needed

✗ **DON'T**
- Manually edit database commission amounts
- Skip verification of deposits
- Allow unlimited commissions per deposit

---

## Future Enhancements

Potential features for v2:
- Multiple-tier commissions (deeper referral chains)
- Custom commission rates per user tier
- Auto-credit after X days pending
- Email notifications to referrers
- Referral leaderboard / contest
- Commission payout tracking & reports

---

**Referral system active and ready to use! 🚀**

Need help? Check `QUICK_START.md` for admin credentials and access.

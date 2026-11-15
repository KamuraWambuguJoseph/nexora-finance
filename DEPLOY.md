# Nexora — Free Deployment Guide

Everything here runs on free tiers. No paid services required.

---

## 1. Create a free Resend account (for email)

1. Go to https://resend.com and sign up (free: 3,000 emails/month, 100/day).
2. Verify your email, then create an **API key** (starts with `re_`).
3. (Optional but recommended) Add and verify a sending domain so emails come from your own address instead of `onboarding@resend.dev`.

Keep the API key — you'll paste it into the platform's env vars below.

---

## 2. Free PostgreSQL database

Pick ONE:

**Option A — Supabase (recommended, permanent free tier)**
1. Create a project at https://supabase.com.
2. In Project Settings → Database, copy the **connection string** (URI). It looks like:
   `postgresql://postgres:PASSWORD@db.xxxx.supabase.co:5432/postgres`
3. Replace `PASSWORD` with your DB password.

**Option B — Neon (serverless Postgres)**
1. Create a project at https://neon.tech.
2. Copy the pooled connection string.

**Option C — Render Postgres** (free for 30 days, then $7/mo)
1. Only if you don't want an external DB.

Once you have a `DATABASE_URL`, run the schema on it once:
```bash
psql "YOUR_DATABASE_URL" -f server/database.sql
```

---

## 3. Deploy the app (one container, free)

**Option A — Render (recommended)**
1. Push this repo to GitHub.
2. At https://render.com → New → **Web Service** → connect your repo.
3. Settings:
   - **Runtime**: Docker
   - **Instance Type**: Free
4. Add environment variables (Render → Environment):

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | your Postgres URL from step 2 |
   | `JWT_SECRET` | a long random string (generate below) |
   | `CLIENT_ORIGIN` | `https://your-app.onrender.com` |
   | `RESEND_API_KEY` | your Resend key |
   | `EMAIL_FROM` | `Nexora <onboarding@resend.dev>` |
   | `NODE_ENV` | `production` |
   | `SERVE_FRONTEND` | `true` |

5. Click **Create Web Service**. First build takes a few minutes.

Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option B — Railway / Fly.io / Google Cloud Run**
Same idea: deploy the repo as a Docker container, set the same env vars. Any Docker host works.

---

## 4. Create the admin account

After the app is live, promote your account to admin:
```sql
UPDATE users SET is_admin = true WHERE email = 'you@example.com';
```
Run that on your Postgres (Supabase SQL editor / Neon console / psql).

---

## 5. Go live checklist

- [ ] `JWT_SECRET` is a real random string (not the placeholder)
- [ ] `CLIENT_ORIGIN` matches the live URL (no trailing slash)
- [ ] `RESEND_API_KEY` is set (otherwise emails only log to server console)
- [ ] `DATABASE_URL` points to the real database
- [ ] You can sign up, log in, and reset a password via email
- [ ] Admin account promoted, deposits show Confirm/Reject buttons

---

## Notes

- **Frontend + API run in one container.** The server serves the built React app and the API from the same port. No separate frontend deploy needed.
- **Free web services sleep after inactivity** (Render free spins down after ~15 min idle; first request wakes it, ~30s cold start). Normal for free tier.
- **Daily earnings job** runs hourly inside the container and is idempotent — safe across restarts.
- To deploy the frontend separately instead, set `SERVE_FRONTEND=false` and deploy the `dist/` folder to Vercel/Netlify, pointing `VITE_API_URL` at your API URL.
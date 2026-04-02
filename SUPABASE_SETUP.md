# Vested — Complete Supabase + Vercel Setup Guide
### For complete beginners. Every step explained. Nothing skipped.

---

## What you need before starting

- A free account on **https://supabase.com**
- A free account on **https://vercel.com**
- A **GitHub** account (to connect your code to Vercel)
- Your project code pushed to a GitHub repository

---

## PART 1 — Create Your Supabase Project

**Step 1.** Go to **https://supabase.com** and sign in (or create a free account).

**Step 2.** Click the green **"New project"** button.

**Step 3.** Fill in the form:
- **Name** → type `vested`
- **Database Password** → click "Generate a password" → **save it somewhere safe**
- **Region** → pick the closest to you
- **Plan** → Free

**Step 4.** Click **"Create new project"** and wait about 60 seconds for it to set up.

---

## PART 2 — Run the Database Schema

**Step 1.** In the left sidebar, click **"SQL Editor"**.

**Step 2.** Click **"New query"** (top left of the editor).

**Step 3.** Open the file `schema.sql` from this project folder. Select all text (Ctrl+A / Cmd+A) and copy it.

**Step 4.** Paste into the Supabase SQL Editor. Click **"Run"** (or press Ctrl+Enter).

**Step 5.** You should see: `Success. No rows returned.`

> This creates all 8 database tables, seeds 10 cryptocurrencies, 4 copy traders, and sets up all security rules. **You do NOT need to run `schema-patch-security.sql` separately** — everything is included in `schema.sql`.

---

## PART 3 — Get Your API Keys

**Step 1.** In the left sidebar, go to **Project Settings → API**.

**Step 2.** Copy these two values — you will need them in Step 5:

| Supabase label | Variable name for Vested |
|---|---|
| **Project URL** | `VITE_SUPABASE_URL` |
| **anon / public** key | `VITE_SUPABASE_ANON_KEY` |

The URL looks like: `https://abcdefgh.supabase.co`
The anon key is a long code starting with `eyJhbGci...`

> **Do not use the `service_role` key** — that bypasses all security. Only use the `anon` key.

---

## PART 4 — Configure Authentication

**Step 1.** In the left sidebar, go to **Authentication → URL Configuration**.

**Step 2.** Set **Site URL** to your Vercel domain:
```
https://your-app-name.vercel.app
```

**Step 3.** Under **Redirect URLs**, click **"Add URL"** and add:
```
https://your-app-name.vercel.app/**
```
(The `/**` at the end is required — it covers all pages.)

**Step 4.** Click **Save**.

> If you don't know your Vercel domain yet, do this step after deploying (Part 6). Your app will work but email confirmation links won't redirect correctly until this is set.

---

## PART 5 — Set Up Email Templates

This makes Supabase send beautiful branded emails instead of plain default ones.

### Confirm Signup email

**Step 1.** Go to **Authentication → Email Templates** → click **"Confirm signup"**.

**Step 2.** Open `email-templates/confirm-signup.html` from this project. Copy all of it.

**Step 3.** In Supabase, clear the existing template body and paste your copied HTML.

**Step 4.** Set Subject to: `Confirm your Vested account`

**Step 5.** Click **Save**.

### Reset Password email

**Step 1.** Click **"Reset password"** in the Email Templates list.

**Step 2.** Open `email-templates/reset-password.html`. Copy all of it.

**Step 3.** Paste into Supabase, replacing the existing content.

**Step 4.** Set Subject to: `Reset your Vested password`

**Step 5.** Click **Save**.

> The Withdrawal OTP email (`email-templates/withdrawal-otp.html`) is sent by you manually — not through Supabase. See Part 9.

---

## PART 6 — Deploy to Vercel

### Step 1: Push your code to GitHub

Push the contents of the `artifacts/vested/` folder as your GitHub repository root. Your repo should look like:
```
your-repo/
├── src/
├── email-templates/
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vercel.json        ← required
└── schema.sql
```

### Step 2: Import into Vercel

1. Go to **https://vercel.com** → **Add New Project**
2. Click **Import** next to your GitHub repository

### Step 3: Configure build settings

Vercel may auto-detect Vite. If it asks, set these manually:

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `.` (the repo root, or `artifacts/vested` if it's a monorepo) |
| Build Command | `npm run build` |
| Output Directory | `dist/public` |
| Install Command | `npm install` |

> **Important:** Output Directory must be `dist/public` — NOT just `dist`. This is already set in `vercel.json` so Vercel will use it automatically.

### Step 4: Add Environment Variables

Before clicking Deploy, go to **Environment Variables** and add:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` (your anon key from Part 3) |

### Step 5: Deploy

Click **Deploy**. Vercel will build and deploy. Takes about 1–2 minutes.

Your app will be live at `https://your-app.vercel.app` — the landing page loads at the root URL `/`.

---

## PART 7 — Make Yourself an Admin

After deploying, sign up in the app with your email address, then:

**Step 1.** Go back to Supabase → **SQL Editor → New query**.

**Step 2.** Run this (replace with your actual email):
```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

**Step 3.** You should see: `Success. 1 rows affected.`

**Step 4.** Sign out of the Vested app and sign back in. You will now see **Admin** in the sidebar.

---

## PART 8 — Add Deposit Wallet Addresses

Users will see these addresses when they make a deposit. Set them here:

**Step 1.** In Supabase → **SQL Editor → New query**, paste and run:

```sql
INSERT INTO public.platform_settings (key, value, label)
VALUES
  ('deposit_btc',   'YOUR_ACTUAL_BTC_ADDRESS',    'Bitcoin (BTC) Deposit Address'),
  ('deposit_eth',   'YOUR_ACTUAL_ETH_ADDRESS',    'Ethereum (ETH) Deposit Address'),
  ('deposit_usdt',  'YOUR_ACTUAL_USDT_ADDRESS',   'USDT (TRC-20) Deposit Address'),
  ('deposit_bnb',   'YOUR_ACTUAL_BNB_ADDRESS',    'BNB Deposit Address'),
  ('deposit_sol',   'YOUR_ACTUAL_SOL_ADDRESS',    'Solana (SOL) Deposit Address')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

You can also update these anytime from inside the app: **Admin → Platform Settings**.

---

## PART 9 — How Withdrawals and OTP Work

This is the security flow for withdrawals. You control it as the admin.

**The full flow:**

1. A user submits a withdrawal in the **Transactions** page → it shows as **Pending** in your admin panel

2. You go to **Admin → Transactions** and click **Approve** on the withdrawal

3. The system generates a 6-digit OTP code and shows it in your admin panel (15-minute expiry)

4. You send the code to the user — use the `email-templates/withdrawal-otp.html` template:
   - Replace `{{OTP_CODE}}` with the 6-digit code
   - Replace `{{USER_NAME}}` with the user's name
   - Replace `{{AMOUNT}}` with the withdrawal amount
   - Send via Gmail, Outlook, Resend, SendGrid, or any email service

5. The user goes to their **Transactions** page, clicks **"Enter OTP"**, types the code

6. If correct and not expired → withdrawal is confirmed

---

## PART 10 — Verify Everything Works

After completing all parts above, run through this checklist:

| Test | What to do | Expected result |
|---|---|---|
| Landing page | Visit your Vercel URL | The landing page loads with header, ticker, hero section |
| Sign up | Click Get Started → Sign Up | Account created, confirmation email sent |
| Email confirmation | Click link in email | You are redirected to your site and logged in |
| Dashboard | Sign in | Dashboard loads with your balance ($0) |
| Trade page | Click Trade | List of 10 cryptocurrencies appears |
| Copy Trading | Click Copy Trading | List of 4 approved traders appears |
| Admin access | Navigate to `/admin` | Admin dashboard loads (after making yourself admin) |
| Deposit flow | Go to Transactions → Deposit | Deposit addresses show from your platform settings |
| Withdrawal OTP | Submit withdrawal → approve in admin → enter OTP | Withdrawal confirmed |

---

## Troubleshooting

### 404 on the Vercel homepage
The Output Directory is wrong. Check that `vercel.json` is in your repo root and contains `"outputDirectory": "dist/public"`. If you set the Output Directory manually in Vercel's dashboard, change it to `dist/public`.

### "Missing Supabase environment variables" error in browser console
The env vars are not set in Vercel. Go to Vercel → your project → Settings → Environment Variables → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` → Redeploy.

### Email confirmation link goes to a 404 or doesn't log me in
Make sure your **Site URL** in Supabase Auth settings matches your Vercel domain exactly (`https://your-app.vercel.app`). Also make sure the Redirect URL is set to `https://your-app.vercel.app/**`.

### Schema SQL gave an error about "type already exists"
The schema was run before. To start fresh, run this in the SQL Editor:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```
Then re-run `schema.sql`.

### Cannot access /admin after setting my role to admin
Sign out and sign back in — the role is checked at login time.

### Trade/Copy Trading pages show empty lists
The seed data didn't run. Check that `schema.sql` ran completely (no errors). You can verify in **Table Editor → cryptocurrencies** — there should be 10 rows.

### Deposit addresses not showing in the app
Run the INSERT statement in Part 8. Verify in **Table Editor → platform_settings**.

---

## Quick Reference

| What you need | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon/public key |
| Vercel output directory | `dist/public` |
| Vercel build command | `npm run build` |
| Make yourself admin | Run UPDATE SQL in Supabase SQL Editor |
| Add deposit wallets | Run INSERT SQL in Supabase SQL Editor |
| Email templates | Paste HTML files into Supabase → Auth → Email Templates |

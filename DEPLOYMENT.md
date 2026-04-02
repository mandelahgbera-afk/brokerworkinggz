# Vested — Vercel Deployment Guide

## Prerequisites

1. A **Supabase** account and project (free tier works)
2. A **GitHub** account
3. A **Vercel** account (free tier works)

---

## Step 1: Set Up Supabase

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Set a strong database password and save it
3. Wait for the project to initialize (~1 min)

### 1.2 Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor → New query**
2. Paste the **entire contents** of `schema.sql` and click **Run**
3. You should see: `Success. No rows returned.`
4. This creates all 8 tables, seeds 10 cryptocurrencies, 4 copy traders, all RLS policies, and triggers in one step — nothing else needs to be run separately.

You should see these tables in **Table Editor**: `users`, `user_balances`, `cryptocurrencies`, `portfolio`, `transactions`, `copy_traders`, `copy_trades`, `platform_settings`

### 1.3 Add Your First Admin

After signing up through the app, run:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 1.4 Get Your API Keys

Go to **Project Settings → API**:
- Copy **Project URL** → this is `VITE_SUPABASE_URL`
- Copy **anon / public key** → this is `VITE_SUPABASE_ANON_KEY`

### 1.5 Configure Auth

Go to **Authentication → URL Configuration**:
- Set **Site URL** to your Vercel domain (e.g. `https://vested.vercel.app`)
- Add `https://your-vercel-domain.vercel.app/**` to **Redirect URLs**

---

## Step 2: Push to GitHub

The `artifacts/vested/` folder is a standalone React app. You have two options:

### Option A: Deploy just the `artifacts/vested` folder (Recommended)

Copy the contents of `artifacts/vested/` into a new GitHub repository root:
```
my-vested-repo/
├── src/
├── email-templates/
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vercel.json
└── ...
```

### Option B: Deploy the full monorepo

Keep the monorepo and configure Vercel to use `artifacts/vested` as the root directory.

---

## Step 3: Deploy to Vercel

### 3.1 Import Project

1. Go to [vercel.com](https://vercel.com) → Add New Project → Import Git Repository
2. Select your GitHub repo

### 3.2 Configure Build Settings

If using **Option A** (standalone repo):
- Framework Preset: **Vite**
- Build Command: `npm run build` or `vite build`
- Output Directory: `dist/public`
- Install Command: `npm install`

If using **Option B** (monorepo):
- Root Directory: `artifacts/vested`
- Build Command: `vite build`
- Output Directory: `dist/public`

### 3.3 Add Environment Variables

In **Settings → Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` (your anon key) |

### 3.4 Deploy

Click **Deploy**. The build runs `vite build`, outputs to `dist/public`, and `vercel.json` handles SPA routing so all routes redirect to `index.html`.

---

## Step 4: Post-Deployment Verification

1. Visit your Vercel URL — the landing page should load
2. Click **Get Started** → goes to `/auth` 
3. Sign up with an email — Supabase sends a confirmation email
4. Confirm your email, then sign in
5. Dashboard loads with your (empty) portfolio
6. To test admin: update your role in Supabase SQL Editor, then navigate to `/admin`

---

## Email Templates

The `email-templates/` folder contains production-ready HTML email templates:

- `withdrawal-otp.html` — sent when admin approves a withdrawal. Replace `{{OTP_CODE}}`, `{{USER_NAME}}`, `{{AMOUNT}}` with actual values via your email service (Resend, SendGrid, etc.)
- `confirm-signup.html` — Supabase handles this automatically; use as a reference for custom templates
- `reset-password.html` — same as above

To use them with **Resend** (recommended):
1. Sign up at resend.com
2. Add your domain
3. Use the Resend API to send emails with these templates filled in

---

## Troubleshooting Common Vercel Errors

### Error: `Cannot find module 'vite'`
→ Ensure `vite` is in your `package.json` dependencies (it is, under `devDependencies` with `catalog:` from workspace)
→ If deploying standalone, pin the version: `"vite": "^7.3.0"`

### Error: `VITE_SUPABASE_URL is not defined`
→ Add the env vars in Vercel Project Settings → Environment Variables → redeploy

### Error: `Page not found on refresh`
→ The `vercel.json` handles this with a rewrite rule. Ensure the file exists in your repo root.

### Error: Build fails with TypeScript errors
→ The `tsconfig.json` has `"noEmit": true` — Vite handles the actual build, TypeScript is type-check only
→ Check that all imports use `@/` path alias which maps to `src/`

### 404 on `/auth` or `/dashboard` after deploy
→ This means `vercel.json` is missing or not at the repo root. Verify it contains:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Architecture Notes

- **No server required** — this is a fully static SPA backed by Supabase
- **Supabase RLS** — Row Level Security policies control what users can see/do
- **OTP security** — OTPs are stored in the database and verified server-side (Supabase)
- All money amounts and trading are **simulated** — no real funds are moved

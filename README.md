# Vested — Crypto Copy Trading Platform

Vested is a full-featured crypto trading platform where users deposit funds, buy and sell cryptocurrencies, and copy the trades of expert traders. Every transaction is reviewed and approved by an admin. Built with React, Vite, TypeScript, and Supabase.

---

## What Users Can Do

- **Sign up** with email and password, confirm their email, then log in
- **Deposit funds** — send crypto to a platform wallet address, admin credits the balance
- **Buy and sell** any of 10 cryptocurrencies managed by the admin
- **Copy trade** — allocate funds to follow expert traders automatically
- **Withdraw** — request a withdrawal, admin approves it, then user verifies with a one-time code (OTP)
- **Track everything** — dashboard shows balance, portfolio value, and profit/loss

## What Admins Can Do

- **Approve or reject** all deposits, withdrawals, buy orders, and sell orders
- **Manage users** — view balances, promote users to admin
- **Manage cryptocurrencies** — add, edit, enable/disable coins on the platform
- **Manage copy traders** — add or edit expert traders users can follow
- **Set deposit wallet addresses** — configure BTC, ETH, USDT, and other wallet addresses per currency

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| UI components | shadcn/ui, Tailwind CSS, Framer Motion |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Deployment | Vercel |

---

## Getting Started

> **First time deploying?** Read the step-by-step guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) — it covers every click from zero to a live app. Nothing is skipped.

The short version:

1. Create a free [Supabase](https://supabase.com) project
2. Run `schema.sql` in the Supabase SQL Editor (one click, creates everything)
3. Push this code to GitHub and import it into [Vercel](https://vercel.com)
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel environment variables
5. Deploy — done

### Running Locally

```bash
# From the artifacts/vested folder, create a .env file:
echo "VITE_SUPABASE_URL=https://your-project.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=eyJhbGci..." >> .env

# Install and start
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the landing page loads at `/`.

---

## Routes

| Path | Page | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/auth` | Sign in / Sign up | Public |
| `/dashboard` | User dashboard | Logged in |
| `/trade` | Trade page | Logged in |
| `/copy-trading` | Copy traders | Logged in |
| `/portfolio` | Portfolio | Logged in |
| `/transactions` | Transactions + OTP | Logged in |
| `/settings` | Account settings | Logged in |
| `/admin` | Admin dashboard | Admin only |

---

## Deployment (Vercel)

### Build settings

The `vercel.json` in this repo sets everything automatically:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "installCommand": "npm install",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Environment variables to add in Vercel

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |

### Steps

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import
3. Select your GitHub repo
4. Add the two environment variables above
5. Click Deploy

That's it — the `vercel.json` handles build settings automatically. No manual configuration needed.

---

## Supabase Setup

See the full step-by-step guide: **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

Covers: creating the project, running the schema, configuring auth, email templates, admin setup, deposit wallets, and OTP withdrawals.

---

## Database Schema

8 tables, all in the `public` schema with Row Level Security enabled:

| Table | Purpose |
|---|---|
| `users` | Registered users with role field (`user` / `admin`) |
| `user_balances` | Each user's USD balance, invested, and profit/loss |
| `cryptocurrencies` | Tradeable cryptos (10 seeded) |
| `portfolio` | Each user's crypto holdings |
| `transactions` | All deposits, withdrawals, and trades (with OTP fields) |
| `copy_traders` | Available traders to copy (4 seeded) |
| `copy_trades` | Active user copy-trade allocations |
| `platform_settings` | Admin-configurable key/value settings (deposit wallets etc.) |

---

## OTP Withdrawal Flow

1. User submits withdrawal → status: `pending`
2. Admin goes to Admin → Transactions → clicks **Approve**
3. System immediately **deducts** the amount from the user's balance (reserved) and generates a 6-digit OTP
4. Admin copies the OTP from the approval screen and sends it to the user using the template in `/email-templates/withdrawal-otp.html`
5. User goes to Transactions → clicks **Enter OTP** → types code
6. System validates: code is correct, hasn't expired, hasn't been used before
7. Status changes to `completed`, `otp_verified = true`

> **Why deduct balance at step 3?** This prevents double-spending — the funds are reserved the moment admin approves, so the user can't trade with money that's pending withdrawal.

---

## Project Structure

```
artifacts/vested/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── Sidebar.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts        # All Supabase API calls
│   │   ├── auth.tsx      # Auth context + provider
│   │   └── supabase.ts   # Supabase client
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Trade.tsx
│   │   ├── Transactions.tsx
│   │   ├── CopyTrading.tsx
│   │   ├── Portfolio.tsx
│   │   ├── Settings.tsx
│   │   └── admin/        # Admin-only pages
│   └── App.tsx           # Routes + auth guards
├── email-templates/      # HTML email templates
├── schema.sql            # Full database schema + seed data
├── vercel.json           # Vercel deployment config
└── SUPABASE_SETUP.md     # Full Supabase setup guide
```

---

## Make Yourself Admin

After signing up, run this in the Supabase SQL Editor:

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

Then sign out and sign back in to activate admin access.

---

## Email Templates

Three HTML templates in `email-templates/`:

| File | Used for |
|---|---|
| `confirm-signup.html` | Email confirmation on sign-up (paste into Supabase Auth) |
| `reset-password.html` | Password reset email (paste into Supabase Auth) |
| `withdrawal-otp.html` | OTP code delivery (send manually, replace `{{OTP_CODE}}` and `{{AMOUNT}}`) |

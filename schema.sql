-- =============================================================================
-- VESTED — Supabase PostgreSQL Schema
-- Version: 1.2.0
-- Description: Full schema for the Vested crypto investment & copy-trading platform
-- Run this in: Supabase SQL Editor (Database > SQL Editor > New query)
-- =============================================================================
--
-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  SETUP CHECKLIST                                                        │
-- │                                                                         │
-- │  1. Run this ENTIRE file in Supabase SQL Editor once.                  │
-- │                                                                         │
-- │  2. In Supabase Dashboard → Authentication → URL Configuration:        │
-- │       - Add Site URL:  https://your-app.vercel.app                     │
-- │       - Add Redirect:  https://your-app.vercel.app/auth/callback       │
-- │       (Also add your Replit preview URL for local dev)                 │
-- │                                                                         │
-- │  3. Set Vercel environment variables:                                   │
-- │       VITE_SUPABASE_URL       = https://xxxx.supabase.co               │
-- │       VITE_SUPABASE_ANON_KEY  = eyJhbGciO...                           │
-- │                                                                         │
-- │  4. Sign up your first account via the app, then run this to           │
-- │     make yourself superadmin:                                           │
-- │                                                                         │
-- │       UPDATE public.users                                               │
-- │       SET role = 'admin'                                                │
-- │       WHERE email = 'your@email.com';                                  │
-- │                                                                         │
-- │  5. Log out and log back in — you'll land on the Admin panel.          │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE transaction_type AS ENUM (
  'deposit',
  'withdrawal',
  'buy',
  'sell',
  'copy_profit'
);

CREATE TYPE transaction_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'completed'
);

CREATE TYPE risk_level AS ENUM (
  'low',
  'medium',
  'high'
);

CREATE TYPE user_role AS ENUM (
  'user',
  'admin'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- ----------------------------------------------------------------------------
-- users
-- Extends Supabase auth.users with application-level profile data
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id     UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  role        user_role NOT NULL DEFAULT 'user',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email   ON public.users(email);
CREATE INDEX idx_users_auth_id ON public.users(auth_id);

-- ----------------------------------------------------------------------------
-- user_balances
-- Tracks each user's USD balance and P&L
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_balances (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email        TEXT NOT NULL UNIQUE REFERENCES public.users(email) ON DELETE CASCADE,
  balance_usd       NUMERIC(20, 8) NOT NULL DEFAULT 0 CHECK (balance_usd >= 0),
  total_invested    NUMERIC(20, 8) NOT NULL DEFAULT 0 CHECK (total_invested >= 0),
  total_profit_loss NUMERIC(20, 8) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_balances_email ON public.user_balances(user_email);

-- ----------------------------------------------------------------------------
-- cryptocurrencies
-- Platform-listed tradeable assets
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cryptocurrencies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol      TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  price       NUMERIC(24, 8) NOT NULL DEFAULT 0 CHECK (price >= 0),
  change_24h  NUMERIC(10, 4) NOT NULL DEFAULT 0,
  market_cap  NUMERIC(30, 2) DEFAULT 0,
  volume_24h  NUMERIC(30, 2) DEFAULT 0,
  icon_color  TEXT NOT NULL DEFAULT '#F7931A',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cryptos_symbol ON public.cryptocurrencies(symbol);
CREATE INDEX idx_cryptos_active ON public.cryptocurrencies(is_active);

-- ----------------------------------------------------------------------------
-- portfolio
-- Each row = one coin holding per user
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portfolio (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email     TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  crypto_symbol  TEXT NOT NULL REFERENCES public.cryptocurrencies(symbol) ON UPDATE CASCADE,
  amount         NUMERIC(30, 8) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  avg_buy_price  NUMERIC(24, 8) NOT NULL DEFAULT 0 CHECK (avg_buy_price >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_email, crypto_symbol)
);

CREATE INDEX idx_portfolio_user   ON public.portfolio(user_email);
CREATE INDEX idx_portfolio_symbol ON public.portfolio(crypto_symbol);

-- ----------------------------------------------------------------------------
-- transactions
-- Full audit log of all financial activity
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email      TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  type            transaction_type NOT NULL,
  amount          NUMERIC(20, 8) NOT NULL CHECK (amount > 0),
  crypto_symbol   TEXT REFERENCES public.cryptocurrencies(symbol) ON UPDATE CASCADE,
  crypto_amount   NUMERIC(30, 8) CHECK (crypto_amount >= 0),
  status          transaction_status NOT NULL DEFAULT 'pending',
  notes           TEXT,
  wallet_address  TEXT,
  reviewed_by     TEXT REFERENCES public.users(email),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user    ON public.transactions(user_email);
CREATE INDEX idx_transactions_status  ON public.transactions(status);
CREATE INDEX idx_transactions_type    ON public.transactions(type);
CREATE INDEX idx_transactions_created ON public.transactions(created_at DESC);

-- ----------------------------------------------------------------------------
-- copy_traders
-- Verified elite traders available for copy-trading
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.copy_traders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trader_name         TEXT NOT NULL,
  specialty           TEXT,
  total_profit_pct    NUMERIC(10, 4) NOT NULL DEFAULT 0,
  monthly_profit_pct  NUMERIC(10, 4) NOT NULL DEFAULT 0,
  win_rate            NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (win_rate BETWEEN 0 AND 100),
  total_trades        INTEGER NOT NULL DEFAULT 0 CHECK (total_trades >= 0),
  followers           INTEGER NOT NULL DEFAULT 0 CHECK (followers >= 0),
  profit_split_pct    NUMERIC(5, 2) NOT NULL DEFAULT 20 CHECK (profit_split_pct BETWEEN 0 AND 100),
  min_allocation      NUMERIC(20, 2) NOT NULL DEFAULT 100 CHECK (min_allocation >= 0),
  is_approved         BOOLEAN NOT NULL DEFAULT FALSE,
  risk_level          risk_level NOT NULL DEFAULT 'medium',
  avatar_color        TEXT NOT NULL DEFAULT '#6366f1',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_copy_traders_approved ON public.copy_traders(is_approved);

-- ----------------------------------------------------------------------------
-- copy_trades
-- Active copy-trading relationships (user → trader)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.copy_trades (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email       TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  trader_id        UUID NOT NULL REFERENCES public.copy_traders(id) ON DELETE CASCADE,
  trader_name      TEXT NOT NULL,
  allocation       NUMERIC(20, 8) NOT NULL CHECK (allocation > 0),
  profit_loss      NUMERIC(20, 8) NOT NULL DEFAULT 0,
  profit_loss_pct  NUMERIC(10, 4) NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_email, trader_id, is_active)
);

CREATE INDEX idx_copy_trades_user   ON public.copy_trades(user_email);
CREATE INDEX idx_copy_trades_trader ON public.copy_trades(trader_id);
CREATE INDEX idx_copy_trades_active ON public.copy_trades(is_active);

-- ----------------------------------------------------------------------------
-- platform_settings
-- Key-value store for super admin configuration (deposit addresses, etc.)
-- SECURITY: Only admins can read/write via RLS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT NOT NULL UNIQUE,
  value       TEXT NOT NULL,
  label       TEXT,
  updated_by  TEXT REFERENCES public.users(email),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_platform_settings_key ON public.platform_settings(key);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- Auto-update `updated_at` on any row change
-- SET search_path = '' prevents search_path injection (fixes function_search_path_mutable warning)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','user_balances','cryptocurrencies','portfolio',
    'transactions','copy_traders','copy_trades','platform_settings'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cryptocurrencies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_traders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_trades         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings   ENABLE ROW LEVEL SECURITY;

-- Helper: get the current user's email from JWT
-- SET search_path = '' prevents search_path injection (fixes function_search_path_mutable warning)
CREATE OR REPLACE FUNCTION public.auth_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT NULLIF(TRIM(current_setting('request.jwt.claims', true)::json->>'email'), '')
$$;

-- Helper: check if current user is admin
-- SET search_path = '' prevents search_path injection (fixes function_search_path_mutable warning)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE email = public.auth_email() AND role = 'admin'
  )
$$;

-- ----------------------------------------------------------------------------
-- users policies
-- ----------------------------------------------------------------------------
CREATE POLICY "users_select_own"  ON public.users FOR SELECT USING (email = public.auth_email() OR public.is_admin());
CREATE POLICY "users_update_own"  ON public.users FOR UPDATE USING (email = public.auth_email()) WITH CHECK (email = public.auth_email());
CREATE POLICY "users_admin_all"   ON public.users FOR ALL USING (public.is_admin());

-- Allow the app to INSERT new user rows on first login (unauthenticated insert is blocked by Supabase anon role)
CREATE POLICY "users_insert_own"  ON public.users FOR INSERT WITH CHECK (auth_id = auth.uid());

-- ----------------------------------------------------------------------------
-- user_balances policies
-- ----------------------------------------------------------------------------
CREATE POLICY "balances_own"        ON public.user_balances FOR SELECT USING (user_email = public.auth_email());
CREATE POLICY "balances_own_insert" ON public.user_balances FOR INSERT WITH CHECK (user_email = public.auth_email());
CREATE POLICY "balances_admin_all"  ON public.user_balances FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- cryptocurrencies policies (public read, admin write)
-- ----------------------------------------------------------------------------
CREATE POLICY "cryptos_read_active"  ON public.cryptocurrencies FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "cryptos_admin_write"  ON public.cryptocurrencies FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- portfolio policies
-- ----------------------------------------------------------------------------
CREATE POLICY "portfolio_own"        ON public.portfolio FOR SELECT USING (user_email = public.auth_email());
CREATE POLICY "portfolio_own_write"  ON public.portfolio FOR INSERT WITH CHECK (user_email = public.auth_email());
CREATE POLICY "portfolio_own_update" ON public.portfolio FOR UPDATE USING (user_email = public.auth_email());
CREATE POLICY "portfolio_admin_all"  ON public.portfolio FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- transactions policies
-- ----------------------------------------------------------------------------
CREATE POLICY "txns_own_read"    ON public.transactions FOR SELECT USING (user_email = public.auth_email() OR public.is_admin());
CREATE POLICY "txns_own_insert"  ON public.transactions FOR INSERT WITH CHECK (user_email = public.auth_email());
CREATE POLICY "txns_admin_all"   ON public.transactions FOR ALL USING (public.is_admin());

-- Allow users to verify their own approved withdrawal OTP
-- (sets otp_verified = true and status = 'completed')
CREATE POLICY "txns_own_otp_update" ON public.transactions FOR UPDATE
  USING (user_email = public.auth_email() AND type = 'withdrawal' AND status = 'approved')
  WITH CHECK (user_email = public.auth_email());

-- ----------------------------------------------------------------------------
-- copy_traders policies (public read approved, admin write)
-- ----------------------------------------------------------------------------
CREATE POLICY "traders_read_approved"  ON public.copy_traders FOR SELECT USING (is_approved = TRUE OR public.is_admin());
CREATE POLICY "traders_admin_write"    ON public.copy_traders FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- copy_trades policies
-- ----------------------------------------------------------------------------
CREATE POLICY "copy_trades_own"        ON public.copy_trades FOR SELECT USING (user_email = public.auth_email() OR public.is_admin());
CREATE POLICY "copy_trades_own_write"  ON public.copy_trades FOR INSERT WITH CHECK (user_email = public.auth_email());
CREATE POLICY "copy_trades_own_update" ON public.copy_trades FOR UPDATE USING (user_email = public.auth_email());
CREATE POLICY "copy_trades_admin_all"  ON public.copy_trades FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- platform_settings policies — ADMIN ONLY, users can read deposit addresses only
-- ----------------------------------------------------------------------------
CREATE POLICY "settings_admin_all"  ON public.platform_settings FOR ALL USING (public.is_admin());
CREATE POLICY "settings_user_read"  ON public.platform_settings FOR SELECT
  USING (key LIKE 'deposit_%');

-- =============================================================================
-- SEED DATA
-- =============================================================================

INSERT INTO public.cryptocurrencies (symbol, name, price, change_24h, market_cap, volume_24h, icon_color, is_active)
VALUES
  ('BTC',   'Bitcoin',    67842.50, 2.43,   1330000000000, 28500000000, '#F7931A', TRUE),
  ('ETH',   'Ethereum',   3521.80,  -0.82,  423000000000,  14200000000, '#627EEA', TRUE),
  ('BNB',   'BNB',        598.40,   1.15,   88000000000,   1850000000,  '#F3BA2F', TRUE),
  ('SOL',   'Solana',     182.60,   5.34,   82000000000,   4300000000,  '#9945FF', TRUE),
  ('ADA',   'Cardano',    0.612,    -1.24,  21800000000,   620000000,   '#0033AD', TRUE),
  ('XRP',   'Ripple',     0.574,    0.89,   31200000000,   1100000000,  '#00AAE4', TRUE),
  ('DOGE',  'Dogecoin',   0.1842,   3.21,   26300000000,   1750000000,  '#C2A633', TRUE),
  ('AVAX',  'Avalanche',  38.92,    -2.15,  16100000000,   540000000,   '#E84142', TRUE),
  ('MATIC', 'Polygon',    0.921,    1.67,   9200000000,    410000000,   '#8247E5', TRUE),
  ('LINK',  'Chainlink',  17.84,    4.20,   10500000000,   680000000,   '#2A5ADA', TRUE)
ON CONFLICT (symbol) DO NOTHING;

INSERT INTO public.copy_traders (trader_name, specialty, total_profit_pct, monthly_profit_pct, win_rate, total_trades, followers, profit_split_pct, min_allocation, is_approved, risk_level, avatar_color)
VALUES
  ('Alex Chen',    'DeFi & Layer 2',    182.4, 14.2, 74.5, 1842, 412, 20, 100,  TRUE, 'medium', '#6366f1'),
  ('Sarah Kim',    'BTC Swing Trading', 124.8,  8.9, 81.2,  986, 287, 15, 200,  TRUE, 'low',    '#10b981'),
  ('Marcus Volta', 'Altcoin Momentum',  320.1, 22.6, 62.8, 2340, 654, 25, 500,  TRUE, 'high',   '#f59e0b'),
  ('Elena Torres', 'SOL Ecosystem',      98.3,  6.4, 78.9,  645, 198, 20, 100,  TRUE, 'low',    '#ec4899')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- OTP COLUMNS — must run BEFORE views so t.* in views includes these columns
-- =============================================================================

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS otp_code       TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS otp_verified    BOOLEAN DEFAULT FALSE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS otp_expires_at  TIMESTAMPTZ;

-- =============================================================================
-- VIEWS
-- WITH (security_invoker = on) ensures views respect the querying user's RLS
-- instead of running as the view creator (fixes security_definer_view errors)
-- DROP first to avoid "cannot change name of view column" errors on re-run
-- =============================================================================

-- Admin view: full transaction log with user info
DROP VIEW IF EXISTS public.admin_transactions;
CREATE VIEW public.admin_transactions
WITH (security_invoker = on) AS
SELECT
  t.*,
  u.full_name AS user_full_name,
  u.role      AS user_role
FROM public.transactions t
LEFT JOIN public.users u ON u.email = t.user_email;

-- Admin view: user summary with balance
DROP VIEW IF EXISTS public.admin_user_summary;
CREATE VIEW public.admin_user_summary
WITH (security_invoker = on) AS
SELECT
  u.id, u.email, u.full_name, u.role, u.created_at,
  COALESCE(b.balance_usd, 0)       AS balance_usd,
  COALESCE(b.total_invested, 0)    AS total_invested,
  COALESCE(b.total_profit_loss, 0) AS total_profit_loss
FROM public.users u
LEFT JOIN public.user_balances b ON b.user_email = u.email;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================

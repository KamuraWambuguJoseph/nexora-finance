-- ------------------------------------------------------------------
-- USERS: core user table
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  membership_id VARCHAR(20) UNIQUE,
  referral_code_used VARCHAR(20),
  preferred_currency VARCHAR(3) DEFAULT 'USD',
  total_assets NUMERIC(18, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_admin BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ------------------------------------------------------------------
-- TRANSACTIONS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount     NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category   VARCHAR(100) NOT NULL DEFAULT 'General',
  note       TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, occurred_at DESC);

-- ------------------------------------------------------------------
-- DEPOSITS: crypto deposits submitted by users with tx hash proof
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deposits (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset         VARCHAR(20) NOT NULL,
  network       VARCHAR(40) NOT NULL,
  amount        NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  wallet_address VARCHAR(120) NOT NULL,
  tx_hash       VARCHAR(190) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'confirmed'
                CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deposits_user ON deposits (user_id);

-- ------------------------------------------------------------------
-- INVESTMENTS: plans a user has bought into
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investments (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id       VARCHAR(40) NOT NULL,
  plan_name     VARCHAR(80) NOT NULL,
  amount        NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  roi_percent   NUMERIC(6, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'completed', 'withdrawn')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  matures_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_investments_user ON investments (user_id);

-- ------------------------------------------------------------------
-- WITHDRAWALS: crypto withdrawals requested by users (admin-reviewed)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS withdrawals (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset         VARCHAR(20) NOT NULL,
  amount        NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  wallet_address VARCHAR(190) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'released', 'rejected')),
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at   TIMESTAMPTZ,
  released_by   VARCHAR(80),
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals (user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals (status);

-- ------------------------------------------------------------------
-- USER ASSETS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_assets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL,
  amount NUMERIC(18, 8) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, asset_type)
);

CREATE INDEX IF NOT EXISTS idx_user_assets_user ON user_assets (user_id);

-- ------------------------------------------------------------------
-- CURRENCY RATES
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS currency_rates (
  id SERIAL PRIMARY KEY,
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate NUMERIC(18, 8) NOT NULL,
  rate_source VARCHAR(50) DEFAULT 'manual',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_currency, to_currency)
);

INSERT INTO currency_rates (from_currency, to_currency, rate) VALUES
('USD', 'KES', 130.5), ('KES', 'USD', 0.00767),
('USD', 'JPY', 149.5), ('JPY', 'USD', 0.00669),
('USD', 'EUR', 0.92), ('EUR', 'USD', 1.087),
('USD', 'GBP', 0.79), ('GBP', 'USD', 1.266),
('BTC', 'USD', 42000), ('ETH', 'USD', 2300),
('USD', 'BTC', 0.0000238), ('USD', 'ETH', 0.000435)
ON CONFLICT (from_currency, to_currency) DO UPDATE SET rate = EXCLUDED.rate;

-- ------------------------------------------------------------------
-- REFERRALS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referral_codes (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code          VARCHAR(20) NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  uses          INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes (user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes (code);

CREATE TABLE IF NOT EXISTS referrals (
  id              SERIAL PRIMARY KEY,
  referrer_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code   VARCHAR(20) NOT NULL,
  referred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_referral UNIQUE(referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON referrals (referred_user_id);

CREATE TABLE IF NOT EXISTS referral_commissions (
  id              SERIAL PRIMARY KEY,
  referrer_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deposit_id      INTEGER NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
  commission_amount NUMERIC(12, 2) NOT NULL CHECK (commission_amount > 0),
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 3.00,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'credited', 'paid')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  credited_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON referral_commissions (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_deposit ON referral_commissions (deposit_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions (status);

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
  asset         VARCHAR(20) NOT NULL,               -- BTC / ETH / USDT
  network       VARCHAR(40) NOT NULL,               -- e.g. TRC20 / ERC20 / Bitcoin
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
  asset         VARCHAR(20) NOT NULL,               -- BTC / ETH / USDT / BNB / SOL
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
-- REFERRALS: tracking referral codes, links, and commissions
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referral_codes (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code          VARCHAR(20) NOT NULL UNIQUE,         -- e.g., REF12345ABC
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  uses          INTEGER DEFAULT 0                     -- count of successful referrals
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes (user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes (code);

-- Track which user referred which user
CREATE TABLE IF NOT EXISTS referrals (
  id              SERIAL PRIMARY KEY,
  referrer_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code   VARCHAR(20) NOT NULL,
  referred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_referral UNIQUE(referred_user_id)  -- Each user can only be referred once
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON referrals (referred_user_id);

-- Track commission earnings from referral deposits
CREATE TABLE IF NOT EXISTS referral_commissions (
  id              SERIAL PRIMARY KEY,
  referrer_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deposit_id      INTEGER NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
  commission_amount NUMERIC(12, 2) NOT NULL CHECK (commission_amount > 0),
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 3.00,  -- 3% default
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'credited', 'paid')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  credited_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON referral_commissions (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_deposit ON referral_commissions (deposit_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions (status);

-- ------------------------------------------------------------------
-- ADMIN ACCOUNT SETUP
-- ------------------------------------------------------------------
-- CREATE DEFAULT ADMIN (update password hash as needed)
-- Run this separately or update with your own admin credentials:
-- INSERT INTO users (name, email, password_hash, is_admin)
-- VALUES ('Admin', 'admin@nexora.com', '$2a$10$...hashed_password...', true)
-- ON CONFLICT (email) DO NOTHING;

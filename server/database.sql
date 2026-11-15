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
  phone VARCHAR(30),
  address TEXT,
  country VARCHAR(80),
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret VARCHAR(64),
  reset_token_hash VARCHAR(64),
  reset_token_expires TIMESTAMPTZ,
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
-- INVESTMENT PROGRAMS: configurable admin programs
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investment_programs (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  slug             VARCHAR(60) NOT NULL UNIQUE,
  icon             VARCHAR(100) NOT NULL DEFAULT '📈',
  min_investment   NUMERIC(18, 2) NOT NULL CHECK (min_investment >= 0),
  max_investment   NUMERIC(18, 2) NULL,
  duration_days    INTEGER NOT NULL CHECK (duration_days > 0),
  roi_percent      NUMERIC(6, 2) DEFAULT 0,
  daily_rate_pct   NUMERIC(6, 3) NOT NULL DEFAULT 0,
  risk_level       VARCHAR(20) NOT NULL DEFAULT 'medium'
                   CHECK (risk_level IN ('low', 'medium', 'high', 'very_high')),
  management_fee   NUMERIC(6, 2) DEFAULT 0,
  description      TEXT NOT NULL DEFAULT '',
  strategy         TEXT NOT NULL DEFAULT '',
  underlying_activity TEXT NOT NULL DEFAULT '',
  withdrawal_conditions TEXT NOT NULL DEFAULT '',
  terms            TEXT NOT NULL DEFAULT '',
  is_active        BOOLEAN NOT NULL DEFAULT true,
  display_order    INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investment_programs_active ON investment_programs (is_active);
CREATE INDEX IF NOT EXISTS idx_investment_programs_order ON investment_programs (display_order);

-- ------------------------------------------------------------------
-- USER INVESTMENTS: investments purchased by users
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_investments (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id       INTEGER NOT NULL REFERENCES investment_programs(id) ON DELETE CASCADE,
  program_name     VARCHAR(100) NOT NULL,
  reference        VARCHAR(40) NOT NULL UNIQUE,
  amount           NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  min_investment   NUMERIC(18, 2) NOT NULL,
  max_investment   NUMERIC(18, 2) NULL,
  roi_percent      NUMERIC(6, 2) NOT NULL,
  duration_days    INTEGER NOT NULL,
  management_fee   NUMERIC(18, 2) NOT NULL DEFAULT 0,
  net_amount       NUMERIC(18, 2) NOT NULL,
  expected_value   NUMERIC(18, 2) NOT NULL,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  matures_at       TIMESTAMPTZ NOT NULL,
  days_remaining   INTEGER NOT NULL DEFAULT 0,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'active', 'matured', 'withdrawable', 'completed', 'cancelled')),
  agreement_signed BOOLEAN NOT NULL DEFAULT false,
  agreement_signed_at TIMESTAMPTZ,
  last_credited_at TIMESTAMPTZ,
  total_earned     NUMERIC(18, 2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_investments_user ON user_investments (user_id);
CREATE INDEX IF NOT EXISTS idx_user_investments_status ON user_investments (status);
CREATE INDEX IF NOT EXISTS idx_user_investments_reference ON user_investments (reference);

-- ------------------------------------------------------------------
-- INVESTMENT EARNINGS: daily yield credits to user balance
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investment_earnings (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investment_id INTEGER NOT NULL REFERENCES user_investments(id) ON DELETE CASCADE,
  amount        NUMERIC(18, 2) NOT NULL,
  day_index     INTEGER NOT NULL,
  credited_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inv_earnings_user ON investment_earnings (user_id);
CREATE INDEX IF NOT EXISTS idx_inv_earnings_investment ON investment_earnings (investment_id);

-- ------------------------------------------------------------------
-- INVESTMENT TRANSACTIONS: financial ledger for investments
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investment_transactions (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investment_id    INTEGER REFERENCES user_investments(id) ON DELETE SET NULL,
  type             VARCHAR(40) NOT NULL CHECK (type IN (
    'investment', 'maturity_payout', 'early_withdrawal', 'fee', 'reinvestment', 'cancelled_refund'
  )),
  amount           NUMERIC(18, 2) NOT NULL,
  net_amount       NUMERIC(18, 2) NOT NULL DEFAULT 0,
  fee_amount       NUMERIC(18, 2) NOT NULL DEFAULT 0,
  balance_before   NUMERIC(18, 2) NOT NULL DEFAULT 0,
  balance_after    NUMERIC(18, 2) NOT NULL DEFAULT 0,
  reference        VARCHAR(80) NOT NULL DEFAULT '',
  description      TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investment_transactions_user ON investment_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_investment ON investment_transactions (investment_id);

-- ------------------------------------------------------------------
-- INVESTMENT PERFORMANCE: recorded performance snapshots
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investment_performance (
  id               SERIAL PRIMARY KEY,
  program_id       INTEGER NOT NULL REFERENCES investment_programs(id) ON DELETE CASCADE,
  recorded_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_invested   NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_payouts    NUMERIC(18, 2) NOT NULL DEFAULT 0,
  active_count     INTEGER NOT NULL DEFAULT 0,
  matured_count    INTEGER NOT NULL DEFAULT 0,
  notes            TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_investment_performance_program ON investment_performance (program_id);

-- ------------------------------------------------------------------
-- INVESTMENT AGREEMENTS: signed user agreements
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investment_agreements (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investment_id    INTEGER REFERENCES user_investments(id) ON DELETE SET NULL,
  program_id       INTEGER NOT NULL REFERENCES investment_programs(id) ON DELETE CASCADE,
  agreement_text   TEXT NOT NULL DEFAULT '',
  version          VARCHAR(20) NOT NULL DEFAULT '1.0',
  signed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address       VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_investment_agreements_user ON investment_agreements (user_id);
CREATE INDEX IF NOT EXISTS idx_investment_agreements_investment ON investment_agreements (investment_id);

-- ------------------------------------------------------------------
-- INVESTMENT WITHDRAWALS: withdrawal requests from matured investments
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investment_withdrawals (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investment_id    INTEGER NOT NULL REFERENCES user_investments(id) ON DELETE CASCADE,
  amount           NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'released', 'rejected')),
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at      TIMESTAMPTZ,
  reviewed_by      VARCHAR(80),
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_investment_withdrawals_user ON investment_withdrawals (user_id);
CREATE INDEX IF NOT EXISTS idx_investment_withdrawals_status ON investment_withdrawals (status);

-- ------------------------------------------------------------------
-- INVESTMENT NOTIFICATIONS: maturity/withdrawal notifications
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investment_notifications (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investment_id    INTEGER REFERENCES user_investments(id) ON DELETE SET NULL,
  type             VARCHAR(40) NOT NULL DEFAULT 'info',
  title            VARCHAR(160) NOT NULL DEFAULT '',
  message          TEXT NOT NULL DEFAULT '',
  read_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investment_notifications_user ON investment_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_investment_notifications_unread ON investment_notifications (user_id, read_at);

-- ------------------------------------------------------------------
-- ADMIN AUDIT LOGS: audit history of program/financial changes
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id               SERIAL PRIMARY KEY,
  admin_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action           VARCHAR(80) NOT NULL DEFAULT '',
  entity           VARCHAR(80) NOT NULL DEFAULT '',
  entity_id        INTEGER,
  changes          JSONB NOT NULL DEFAULT '{}',
  details          TEXT NOT NULL DEFAULT '',
  ip_address       VARCHAR(45),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON admin_audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON admin_audit_logs (created_at DESC);

-- ------------------------------------------------------------------
-- SEED DEFAULT INVESTMENT PROGRAMS (only if table is empty)
-- ------------------------------------------------------------------
INSERT INTO investment_programs (name, slug, icon, min_investment, max_investment, duration_days, roi_percent, daily_rate_pct, risk_level, management_fee, description, strategy, underlying_activity, withdrawal_conditions, terms, display_order)
SELECT * FROM (VALUES
  ('Starter', 'starter', '🟦', 20, NULL::numeric, 30, 150.00, 5.000, 'low', 0.00, 'An entry-level plan for beginners to start investing with low capital. 30-day term with daily yield.', 'Conservative diversified pool', 'Low-risk liquid assets and short-term instruments', 'Principal locked for 30 days. Daily earnings credited to your wallet. Withdrawal available after maturity. Early withdrawal incurs 5% penalty.', 'Daily earnings credited every 24 hours. Principal returned at maturity. Early withdrawal permitted with penalty.', 1),
  ('Growth', 'growth', '🟩', 70, NULL::numeric, 60, 257.14, 4.286, 'medium', 0.50, 'A mid-tier plan for growing investors seeking steady returns. 60-day term with daily yield.', 'Balanced portfolio of equities and fixed income', 'Moderate-risk mixed assets with 60-day horizon', 'Principal locked for 60 days. Daily earnings credited to your wallet. Withdrawal available after maturity. Early withdrawal incurs 4% penalty.', 'Daily earnings credited every 24 hours. Principal returned at maturity. Early withdrawal permitted with penalty.', 2),
  ('Advanced', 'advanced', '🟦', 120, NULL::numeric, 90, 375.03, 4.167, 'medium', 0.75, 'Advanced opportunities for investors seeking more growth. 90-day term with daily yield.', 'Balanced growth portfolio', 'Moderate-to-high risk instruments', 'Principal locked for 90 days. Daily earnings credited to your wallet. Withdrawal available after maturity. Early withdrawal incurs 3% penalty.', 'Daily earnings credited every 24 hours. Principal returned at maturity. Early withdrawal permitted with penalty.', 3),
  ('Premium', 'premium', '🟦', 200, NULL::numeric, 120, 480.00, 4.000, 'high', 1.00, 'Premium plan for higher-capital investors. 120-day term with daily yield.', 'Growth-oriented equity fund', 'Higher-risk equity instruments', 'Principal locked for 120 days. Daily earnings credited to your wallet. Withdrawal available after maturity. Early withdrawal incurs 3% penalty.', 'Daily earnings credited every 24 hours. Principal returned at maturity. Early withdrawal permitted with penalty.', 4),
  ('Gold', 'gold', '🟨', 500, NULL::numeric, 180, 720.00, 4.000, 'high', 1.50, 'High-capital opportunities with enhanced features. 180-day term with daily yield.', 'Strategic asset allocation', 'Premium-tier instruments', 'Principal locked for 180 days. Daily earnings credited to your wallet. Withdrawal available after maturity. Early withdrawal incurs 2.5% penalty.', 'Daily earnings credited every 24 hours. Principal returned at maturity. Early withdrawal permitted with penalty.', 5),
  ('Diamond', 'diamond', '💎', 1000, NULL::numeric, 270, 945.00, 3.500, 'very_high', 2.00, 'Exclusive plan for high-capital investors. 270-day term with daily yield.', 'Concentrated high-conviction portfolio', 'High-risk specialized instruments', 'Principal locked for 270 days. Daily earnings credited to your wallet. Withdrawal available after maturity. Early withdrawal incurs 2% penalty.', 'Daily earnings credited every 24 hours. Principal returned at maturity. Early withdrawal permitted with penalty.', 6),
  ('Black Elite', 'black-elite', '🖤', 1500, NULL::numeric, 365, 851.55, 2.333, 'very_high', 2.50, 'VIP plan for eligible high-capital investors. 365-day term with daily yield.', 'Elite institutional-grade strategy', 'Exclusive high-capital instruments', 'Principal locked for 365 days. Daily earnings credited to your wallet. Withdrawal available after maturity. Early withdrawal incurs 1.5% penalty.', 'Daily earnings credited every 24 hours. Principal returned at maturity. Early withdrawal permitted with penalty.', 7)
) AS v(name, slug, icon, min_investment, max_investment, duration_days, roi_percent, daily_rate_pct, risk_level, management_fee, description, strategy, underlying_activity, withdrawal_conditions, terms, display_order)
WHERE NOT EXISTS (SELECT 1 FROM investment_programs);

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

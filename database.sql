-- Run this once in your nexora database:
--   psql -U postgres -d nexora -f database.sql
-- (or paste into pgAdmin / DBeaver)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  membership_id VARCHAR(20) UNIQUE,
  referral_code_used VARCHAR(20),
  preferred_currency VARCHAR(3) DEFAULT 'USD',
  total_assets  NUMERIC(18, 2) DEFAULT 0,
  phone         VARCHAR(30),
  address       TEXT,
  country       VARCHAR(80),
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret  VARCHAR(64),
  is_admin      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

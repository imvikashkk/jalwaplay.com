-- Jalwaplay database schema.
-- Safe to run multiple times (idempotent) and on an existing database:
--   npm run db:setup        (uses DB_* from .env.local)
--   or: psql "$DATABASE_URL" -f src/lib/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  mobile       VARCHAR(15) UNIQUE,
  country_code VARCHAR(5) NOT NULL DEFAULT '91',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Email login support (mobile becomes optional; one of the two is required)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(254);
ALTER TABLE users ALTER COLUMN mobile DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_identity_chk CHECK (mobile IS NOT NULL OR email IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS otps (
  id         SERIAL PRIMARY KEY,
  mobile     VARCHAR(15),
  otp        VARCHAR(128) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- OTPs are stored hashed; identifier = mobile number or lower-cased email
ALTER TABLE otps ALTER COLUMN otp TYPE VARCHAR(128);
ALTER TABLE otps ALTER COLUMN mobile DROP NOT NULL;
ALTER TABLE otps ADD COLUMN IF NOT EXISTS identifier VARCHAR(254);
ALTER TABLE otps ADD COLUMN IF NOT EXISTS channel    VARCHAR(10) NOT NULL DEFAULT 'mobile';
ALTER TABLE otps ADD COLUMN IF NOT EXISTS attempts   INTEGER NOT NULL DEFAULT 0;
UPDATE otps SET identifier = mobile WHERE identifier IS NULL;
CREATE INDEX IF NOT EXISTS idx_otps_mobile ON otps(mobile);
CREATE INDEX IF NOT EXISTS idx_otps_identifier ON otps(identifier, created_at DESC);

CREATE TABLE IF NOT EXISTS plans (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  original_price INTEGER NOT NULL,
  price          INTEGER NOT NULL,
  duration_days  INTEGER NOT NULL,
  description    TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the plans defined in the app (LandingPage PLANS) — only on an empty table,
-- so plans already configured in an existing database are never touched.
INSERT INTO plans (name, original_price, price, duration_days, description)
SELECT * FROM (VALUES
  ('3 Day Pass', 167, 167,  3, 'Quick binge access'),
  ('Fortnight',  199, 199, 15, '15 din ka pura mazza'),
  ('Monthly',    299, 299, 30, 'Poora mahine ka mazza'),
  ('Quarterly',  499, 499, 90, '3 mahine, ek saath bachat')
) AS v(name, original_price, price, duration_days, description)
WHERE NOT EXISTS (SELECT 1 FROM plans);

CREATE TABLE IF NOT EXISTS subscriptions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  plan_id     INTEGER NOT NULL REFERENCES plans(id),
  start_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date    TIMESTAMPTZ NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'active',  -- active | expired | cancelled
  payment_id  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sub_user ON subscriptions(user_id);

CREATE TABLE IF NOT EXISTS payments (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id),
  plan_id           INTEGER NOT NULL REFERENCES plans(id),
  txn_id            VARCHAR(100) NOT NULL UNIQUE,
  amount            INTEGER NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | success | failed
  gateway_txn_id    VARCHAR(200),
  gateway_response  JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pay_txn ON payments(txn_id);
CREATE INDEX IF NOT EXISTS idx_pay_user ON payments(user_id);

-- Legacy column names (PostgreSQL has no RENAME COLUMN IF EXISTS)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='easebuzz_txn_id') THEN
    ALTER TABLE payments RENAME COLUMN easebuzz_txn_id TO gateway_txn_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='easebuzz_response') THEN
    ALTER TABLE payments RENAME COLUMN easebuzz_response TO gateway_response;
  END IF;
END $$;

-- ── Marketing / Pixel tracking ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS pixels (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(50)  NOT NULL UNIQUE,
  label         VARCHAR(100) NOT NULL,
  pixel_id      VARCHAR(20)  NOT NULL,
  access_token  TEXT         NOT NULL,
  ad_account_id VARCHAR(30),
  is_default    BOOLEAN      NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pixels_one_default ON pixels(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_pixels_slug ON pixels(slug);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS campaign_slug       VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS capi_sent           BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS capi_error          TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS meta_campaign_id    VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS meta_campaign_name  VARCHAR(200);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS fbp                 VARCHAR(200);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS fbc                 VARCHAR(200);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gp_intent_id        VARCHAR(200);

-- First-touch campaign attribution (was used by the code but missing here).
-- `mobile` holds the login identifier (mobile number or email).
CREATE TABLE IF NOT EXISTS phone_attributions (
  mobile             VARCHAR(254) PRIMARY KEY,
  campaign_slug      VARCHAR(50),
  meta_campaign_id   VARCHAR(50),
  meta_campaign_name VARCHAR(200),
  fbp                VARCHAR(200),
  fbc                VARCHAR(200),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE phone_attributions ALTER COLUMN mobile TYPE VARCHAR(254);

-- Affiliate S2S postback tracking (?pub=..&click_id=..)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS pub               VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS click_id          VARCHAR(200);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS postback_status   VARCHAR(20);   -- NULL | sending | sent | failed
ALTER TABLE payments ADD COLUMN IF NOT EXISTS postback_response TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS postback_sent_at  TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_pay_click ON payments(click_id) WHERE click_id IS NOT NULL;
ALTER TABLE phone_attributions ADD COLUMN IF NOT EXISTS pub      VARCHAR(50);
ALTER TABLE phone_attributions ADD COLUMN IF NOT EXISTS click_id VARCHAR(200);

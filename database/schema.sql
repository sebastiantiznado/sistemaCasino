CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code VARCHAR(32) UNIQUE NOT NULL,
  initial_balance BIGINT NOT NULL DEFAULT 0 CHECK (initial_balance >= 0),
  balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id),
  station_id INTEGER REFERENCES stations(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('entry', 'bet', 'adjustment', 'exit')),
  stake BIGINT NOT NULL DEFAULT 0 CHECK (stake >= 0),
  payout BIGINT NOT NULL DEFAULT 0 CHECK (payout >= 0),
  amount_delta BIGINT NOT NULL,
  balance_before BIGINT NOT NULL CHECK (balance_before >= 0),
  balance_after BIGINT NOT NULL CHECK (balance_after >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);
CREATE INDEX IF NOT EXISTS idx_transactions_player ON transactions(player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

INSERT INTO stations (name, code) VALUES
  ('Puesto 01', 'P01'),
  ('Puesto 02', 'P02'),
  ('Puesto 03', 'P03'),
  ('Puesto 04', 'P04'),
  ('Puesto 05', 'P05'),
  ('Puesto 06', 'P06')
ON CONFLICT (code) DO NOTHING;

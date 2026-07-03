-- RB Comfort Stay — database schema
-- Run automatically by `npm run db:setup`, or paste into the Neon SQL editor.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS homes (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  max_guests  INT NOT NULL DEFAULT 6,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id          SERIAL PRIMARY KEY,
  home_id     INT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_name  TEXT NOT NULL,
  district    TEXT NOT NULL,
  state       TEXT NOT NULL,
  phone       TEXT NOT NULL,
  num_members INT NOT NULL,
  num_days    INT NOT NULL,
  check_in    DATE NOT NULL,
  check_out   DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_home_dates
  ON bookings (home_id, check_in, check_out) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings (user_id);

CREATE TABLE IF NOT EXISTS home_images (
  id         SERIAL PRIMARY KEY,
  home_id    INT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  image_data TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_home_images_home ON home_images (home_id, sort_order);

-- Add room-type and pricing to bookings (idempotent for existing tables)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_type TEXT NOT NULL DEFAULT 'non_ac_non_ac';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price_per_night INT NOT NULL DEFAULT 2100;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_price INT NOT NULL DEFAULT 0;

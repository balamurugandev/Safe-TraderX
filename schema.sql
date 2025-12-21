-- Safe TradeX Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- MIGRATION SCRIPT (Non-destructive)
-- Run this if you have existing data
-- ============================================

-- Add new columns to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS max_trades_per_day int DEFAULT 10;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS brokerage_per_order numeric DEFAULT 20;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS current_streak int DEFAULT 0;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS last_streak_date date;

-- Lot sizing columns
ALTER TABLE settings ADD COLUMN IF NOT EXISTS max_lot_size int DEFAULT 50;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS lot_value numeric DEFAULT 50;

-- Penalty tracking
ALTER TABLE settings ADD COLUMN IF NOT EXISTS penalty_active boolean DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS last_incident_report text;

-- Add is_loss column to trades (computed from pnl_amount)
-- Note: If this fails, the column may already exist or your Postgres version doesn't support GENERATED columns
-- In that case, we'll compute is_loss in the application
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_trades' AND column_name = 'is_loss') THEN
    ALTER TABLE daily_trades ADD COLUMN is_loss boolean DEFAULT false;
  END IF;
END $$;

-- Add setup_type column for trade tagging
ALTER TABLE daily_trades ADD COLUMN IF NOT EXISTS setup_type text;

-- Add market_state column for market condition tracking
ALTER TABLE daily_trades ADD COLUMN IF NOT EXISTS market_state text;

-- Update existing trades to set is_loss based on pnl_amount
UPDATE daily_trades SET is_loss = (pnl_amount < 0) WHERE is_loss IS NULL;

-- ============================================
-- FRESH INSTALL SCRIPT
-- Only run this for a completely new setup
-- ============================================

-- DROP TABLE IF EXISTS daily_trades;
-- DROP TABLE IF EXISTS settings;

-- -- Create settings table with all fields
-- CREATE TABLE settings (
--   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--   starting_capital numeric NOT NULL DEFAULT 0,
--   max_daily_loss_percent numeric NOT NULL DEFAULT 2,
--   daily_profit_target_percent numeric NOT NULL DEFAULT 5,
--   max_trades_per_day int NOT NULL DEFAULT 10,
--   brokerage_per_order numeric NOT NULL DEFAULT 20,
--   current_streak int NOT NULL DEFAULT 0,
--   last_streak_date date,
--   updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
-- );

-- -- Create daily_trades table with all fields
-- CREATE TABLE daily_trades (
--   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--   trade_name text NOT NULL,
--   pnl_amount numeric NOT NULL,
--   comments text,
--   is_loss boolean DEFAULT false,
--   trade_date date DEFAULT current_date NOT NULL,
--   created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
-- );

-- -- Disable RLS for single-user app
-- ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_trades DISABLE ROW LEVEL SECURITY;

-- -- Grant access
-- GRANT ALL ON settings TO anon;
-- GRANT ALL ON daily_trades TO anon;

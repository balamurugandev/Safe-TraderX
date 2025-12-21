-- Safe TradeX Database Schema
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS daily_trades;
DROP TABLE IF EXISTS settings;

-- Create settings table (simplified without user_id for single-user app)
CREATE TABLE settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  starting_capital numeric NOT NULL DEFAULT 0,
  max_daily_loss_percent numeric NOT NULL DEFAULT 0,
  daily_profit_target_percent numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create daily_trades table
CREATE TABLE daily_trades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_name text NOT NULL,
  pnl_amount numeric NOT NULL,
  trade_date date DEFAULT current_date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable RLS for single-user app (no authentication needed)
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_trades DISABLE ROW LEVEL SECURITY;

-- Grant access to anon role
GRANT ALL ON settings TO anon;
GRANT ALL ON daily_trades TO anon;

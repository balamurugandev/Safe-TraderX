-- Create table for storing daily percentage targets and notes
CREATE TABLE daily_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  target_percentage NUMERIC DEFAULT 1.0, -- Default daily growth target (e.g., 1.0%)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy to allow anonymous access (since we are using anon key for simplicity in this project)
-- In a real app, you'd want authenticated policies
ALTER TABLE daily_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select" ON daily_targets FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON daily_targets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON daily_targets FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON daily_targets FOR DELETE USING (true);

-- Add global target columns to settings if they don't exist
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS monthly_target_percent NUMERIC DEFAULT 20.0,
ADD COLUMN IF NOT EXISTS yearly_target_percent NUMERIC DEFAULT 200.0;

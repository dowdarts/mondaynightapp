-- PostgreSQL script for Supabase
-- Create nightly_stats table for storing end-of-night statistics
CREATE TABLE IF NOT EXISTS nightly_stats (
    id BIGSERIAL PRIMARY KEY,
    session_date DATE NOT NULL,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    total_matches INTEGER NOT NULL DEFAULT 0,
    total_score INTEGER NOT NULL DEFAULT 0,
    total_darts INTEGER NOT NULL DEFAULT 0,
    total_tons INTEGER NOT NULL DEFAULT 0,
    total_finishes INTEGER NOT NULL DEFAULT 0,
    avg_score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one entry per user per night
    UNIQUE(user_id, session_date)
);

-- Enable Row Level Security
ALTER TABLE nightly_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own nightly stats" ON nightly_stats;
DROP POLICY IF EXISTS "Users can update their own nightly stats" ON nightly_stats;
DROP POLICY IF EXISTS "Users can delete their own nightly stats" ON nightly_stats;
DROP POLICY IF EXISTS "Users can view all nightly stats for leaderboard" ON nightly_stats;

-- Create policies for nightly_stats
CREATE POLICY "Users can insert their own nightly stats"
ON nightly_stats FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nightly stats"
ON nightly_stats FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nightly stats"
ON nightly_stats FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow all authenticated users to view all nightly stats for YTD leaderboard
CREATE POLICY "Users can view all nightly stats for leaderboard"
ON nightly_stats FOR SELECT
TO authenticated
USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nightly_stats_user_id ON nightly_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_nightly_stats_session_date ON nightly_stats(session_date);
CREATE INDEX IF NOT EXISTS idx_nightly_stats_user_date ON nightly_stats(user_id, session_date);

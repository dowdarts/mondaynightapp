-- Supabase Database Setup for Dart League Scoring App
-- Run this SQL in your Supabase SQL Editor
-- Note: This is PostgreSQL syntax, not MS SQL Server

-- Create dart_sessions table
CREATE TABLE IF NOT EXISTS dart_sessions (
    id TEXT PRIMARY KEY,
    current_match INTEGER NOT NULL DEFAULT 1,
    current_game INTEGER NOT NULL DEFAULT 1,
    current_dart_box INTEGER NOT NULL DEFAULT 3,
    game_data JSONB NOT NULL,
    match_complete BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create match_history table
CREATE TABLE IF NOT EXISTS match_history (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    match_number INTEGER NOT NULL,
    status TEXT NOT NULL,
    game_data JSONB NOT NULL,
    totals JSONB NOT NULL,
    my_finishes INTEGER DEFAULT 0,
    partner_finishes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES dart_sessions(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_match_history_session_id ON match_history(session_id);
CREATE INDEX IF NOT EXISTS idx_match_history_match_number ON match_history(match_number);
CREATE INDEX IF NOT EXISTS idx_dart_sessions_updated_at ON dart_sessions(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE dart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (adjust based on your security needs)
-- These policies allow anyone to read/write data
-- For production, you may want to add user authentication

CREATE POLICY "Allow anonymous insert on dart_sessions"
ON dart_sessions FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous select on dart_sessions"
ON dart_sessions FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous update on dart_sessions"
ON dart_sessions FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow anonymous delete on dart_sessions"
ON dart_sessions FOR DELETE
TO anon
USING (true);

CREATE POLICY "Allow anonymous insert on match_history"
ON match_history FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous select on match_history"
ON match_history FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous update on match_history"
ON match_history FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow anonymous delete on match_history"
ON match_history FOR DELETE
TO anon
USING (true);

-- Optional: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dart_sessions_updated_at 
    BEFORE UPDATE ON dart_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security on tables
ALTER TABLE dart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own sessions" ON dart_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON dart_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON dart_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON dart_sessions;

DROP POLICY IF EXISTS "Users can insert their own match history" ON match_history;
DROP POLICY IF EXISTS "Users can update their own match history" ON match_history;
DROP POLICY IF EXISTS "Users can view their own match history" ON match_history;
DROP POLICY IF EXISTS "Users can delete their own match history" ON match_history;

-- Policies for dart_sessions table
CREATE POLICY "Users can insert their own sessions"
ON dart_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = split_part(id, '_', 1));

CREATE POLICY "Users can update their own sessions"
ON dart_sessions FOR UPDATE
TO authenticated
USING (auth.uid()::text = split_part(id, '_', 1))
WITH CHECK (auth.uid()::text = split_part(id, '_', 1));

CREATE POLICY "Users can view their own sessions"
ON dart_sessions FOR SELECT
TO authenticated
USING (auth.uid()::text = split_part(id, '_', 1));

CREATE POLICY "Users can delete their own sessions"
ON dart_sessions FOR DELETE
TO authenticated
USING (auth.uid()::text = split_part(id, '_', 1));

-- Policies for match_history table
CREATE POLICY "Users can insert their own match history"
ON match_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = split_part(session_id, '_', 1));

CREATE POLICY "Users can update their own match history"
ON match_history FOR UPDATE
TO authenticated
USING (auth.uid()::text = split_part(session_id, '_', 1))
WITH CHECK (auth.uid()::text = split_part(session_id, '_', 1));

CREATE POLICY "Users can view their own match history"
ON match_history FOR SELECT
TO authenticated
USING (auth.uid()::text = split_part(session_id, '_', 1));

CREATE POLICY "Users can delete their own match history"
ON match_history FOR DELETE
TO authenticated
USING (auth.uid()::text = split_part(session_id, '_', 1));

-- Allow all users to view all match history for YTD leaderboard
CREATE POLICY "Users can view all match history for leaderboard"
ON match_history FOR SELECT
TO authenticated
USING (true);

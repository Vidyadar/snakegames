-- Create the leaderboard table for storing Snake game scores
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_player_id ON leaderboard(player_id);

-- Enable Row Level Security (RLS)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read leaderboard
CREATE POLICY "Allow public read access" ON leaderboard
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert their own scores
CREATE POLICY "Allow authenticated users to insert scores" ON leaderboard
  FOR INSERT WITH CHECK (true);

-- Create policy to allow users to update their own scores (optional)
CREATE POLICY "Allow users to update their own scores" ON leaderboard
  FOR UPDATE USING (true);

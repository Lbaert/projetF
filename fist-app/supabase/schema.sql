-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  discord_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  role VARCHAR(50) DEFAULT 'visitor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('clip', 'music', 'reference', 'soundboard', 'highlight')),
  content TEXT NOT NULL,
  file_path VARCHAR(500),
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  is_highlight BOOLEAN DEFAULT false,
  cut_timestamps JSONB DEFAULT '[]'::jsonb
);

-- Votes table
CREATE TABLE votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated can create posts" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Authenticated can create votes" ON votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own votes" ON votes FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_votes_post_id ON votes(post_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);

-- Function to update score on vote change
CREATE OR REPLACE FUNCTION update_post_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET score = score + NEW.value WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET score = score - OLD.value WHERE id = OLD.post_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE posts SET score = score - OLD.value + NEW.value WHERE id = NEW.post_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vote changes
CREATE TRIGGER update_score_on_vote
AFTER INSERT OR DELETE OR UPDATE OF value ON votes
FOR EACH ROW EXECUTE FUNCTION update_post_score();

-- Prevent deletion of post if it is referenced as source_id by other posts
CREATE OR REPLACE FUNCTION prevent_delete_if_has_children()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM posts WHERE source_id = OLD.id) THEN
    RAISE EXCEPTION 'Cannot delete post that is referenced as source';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_post_delete_if_children
  BEFORE DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_if_has_children();

-- Delete storage file when a post is deleted
CREATE OR REPLACE FUNCTION delete_post_storage()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.file_path IS NOT NULL AND OLD.file_path != '' THEN
    DELETE FROM supabase.storage.objects WHERE bucket_id = 'clips' AND name = OLD.file_path;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_delete_delete_storage
  AFTER DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION delete_post_storage();

-- ============================================
-- ONE-TIME CLEANUP: Run this once to clean existing orphaned data
-- Remove posts whose source_id points to a deleted post
-- DELETE FROM posts WHERE source_id IS NOT NULL AND source_id NOT IN (SELECT id FROM posts);

-- Remove storage files that have no corresponding post
-- This requires listing all files in storage and comparing with posts.file_path
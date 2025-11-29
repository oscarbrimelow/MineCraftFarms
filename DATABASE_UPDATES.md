# Database Updates for New Features

Run these SQL statements in your Supabase SQL editor to add all the new features:

## 1. Following Table

```sql
-- Following table (users following other users)
CREATE TABLE IF NOT EXISTS following (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_following_follower ON following(follower_id);
CREATE INDEX IF NOT EXISTS idx_following_following ON following(following_id);

-- Enable RLS
ALTER TABLE following ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Following relationships are viewable by everyone" ON following
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON following
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON following
  FOR DELETE USING (auth.uid() = follower_id);
```

## 2. Comment Reactions Table

```sql
-- Comment reactions table
CREATE TABLE IF NOT EXISTS comment_reactions (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'helpful')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id, reaction_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user ON comment_reactions(user_id);

-- Enable RLS
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Comment reactions are viewable by everyone" ON comment_reactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can react to comments" ON comment_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON comment_reactions
  FOR DELETE USING (auth.uid() = user_id);
```

## 3. User Badges Table

```sql
-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- Enable RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "User badges are viewable by everyone" ON user_badges
  FOR SELECT USING (true);

CREATE POLICY "System can award badges" ON user_badges
  FOR INSERT WITH CHECK (true);
```

## 4. Farm Testing Table

```sql
-- Farm testing table (community testing)
CREATE TABLE IF NOT EXISTS farm_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tested BOOLEAN DEFAULT true,
  test_result TEXT CHECK (test_result IN ('works', 'works_with_issues', 'does_not_work')),
  test_notes TEXT,
  tested_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(farm_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_farm_tests_farm ON farm_tests(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_tests_user ON farm_tests(user_id);

-- Enable RLS
ALTER TABLE farm_tests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Farm tests are viewable by everyone" ON farm_tests
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can test farms" ON farm_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test results" ON farm_tests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own test results" ON farm_tests
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update farm_tests updated_at
CREATE OR REPLACE FUNCTION update_farm_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update farm_tests updated_at
CREATE TRIGGER update_farm_tests_updated_at_trigger
  BEFORE UPDATE ON farm_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_farm_tests_updated_at();
```

## Complete SQL (All in One)

You can run all of the above in one go, or run them separately. The order doesn't matter as long as all tables are created before the triggers.


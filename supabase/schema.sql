-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'))
);

-- Farms table
CREATE TABLE IF NOT EXISTS farms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  platform TEXT[] NOT NULL,
  versions TEXT[] NOT NULL,
  video_url TEXT,
  materials JSONB DEFAULT '[]'::jsonb,
  optional_materials JSONB DEFAULT '[]'::jsonb,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  preview_image TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public BOOLEAN DEFAULT true,
  upvotes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  search_vector TSVECTOR,
  steps JSONB,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  estimated_time INTEGER,
  chunk_requirements TEXT,
  height_requirements TEXT,
  notes TEXT
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_type TEXT NOT NULL CHECK (item_type IN ('farm', 'comment')),
  item_id UUID NOT NULL,
  reason TEXT NOT NULL,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upvotes table
CREATE TABLE IF NOT EXISTS upvotes (
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (farm_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_farms_author ON farms(author_id);
CREATE INDEX IF NOT EXISTS idx_farms_platform ON farms USING GIN(platform);
CREATE INDEX IF NOT EXISTS idx_farms_versions ON farms USING GIN(versions);
CREATE INDEX IF NOT EXISTS idx_farms_tags ON farms USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_farms_public ON farms(public) WHERE public = true;
CREATE INDEX IF NOT EXISTS idx_farms_search ON farms USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_farms_upvotes ON farms(upvotes_count DESC);
CREATE INDEX IF NOT EXISTS idx_farms_created ON farms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_farm ON comments(farm_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_upvotes_user ON upvotes(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status) WHERE status = 'pending';

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_farm_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.materials::text, '')), 'D');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector
CREATE TRIGGER update_farm_search_vector_trigger
  BEFORE INSERT OR UPDATE ON farms
  FOR EACH ROW
  EXECUTE FUNCTION update_farm_search_vector();

-- Function to sync user on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Farms policies
CREATE POLICY "Public farms are viewable by everyone" ON farms
  FOR SELECT USING (public = true OR auth.uid() = author_id);

CREATE POLICY "Users can insert own farms" ON farms
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own farms" ON farms
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own farms" ON farms
  FOR DELETE USING (auth.uid() = author_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Upvotes policies
CREATE POLICY "Upvotes are viewable by everyone" ON upvotes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert upvotes" ON upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own upvotes" ON upvotes
  FOR DELETE USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('moderator', 'admin')
  ));

CREATE POLICY "Authenticated users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Moderators can update reports" ON reports
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('moderator', 'admin')
  ));


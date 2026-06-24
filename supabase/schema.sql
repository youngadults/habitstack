-- StackFlow Supabase Database Schema
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    theme TEXT DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============ STACKS ============
CREATE TABLE IF NOT EXISTS stacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    trigger TEXT NOT NULL,
    color TEXT DEFAULT 'indigo',
    icon TEXT DEFAULT '☕',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stacks" ON stacks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stacks" ON stacks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stacks" ON stacks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stacks" ON stacks
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_stacks_user_id ON stacks(user_id);

-- ============ HABITS ============
CREATE TABLE IF NOT EXISTS habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits" ON habits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits" ON habits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON habits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON habits
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_habits_stack_id ON habits(stack_id);
CREATE INDEX idx_habits_user_id ON habits(user_id);

-- ============ COMPLETIONS ============
CREATE TABLE IF NOT EXISTS completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(habit_id, completed_at)
);

ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions" ON completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own completions" ON completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions" ON completions
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_completions_habit_id ON completions(habit_id);
CREATE INDEX idx_completions_user_id ON completions(user_id);
CREATE INDEX idx_completions_date ON completions(completed_at);

-- ============ ACHIEVEMENTS ============
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_key TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_key)
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own achievements" ON achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ REALTIME SUBSCRIPTIONS ============
-- Enable realtime for sync
ALTER PUBLICATION supabase_realtime ADD TABLE stacks;
ALTER PUBLICATION supabase_realtime ADD TABLE habits;
ALTER PUBLICATION supabase_realtime ADD TABLE completions;
ALTER PUBLICATION supabase_realtime ADD TABLE achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
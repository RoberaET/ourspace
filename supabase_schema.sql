-- =====================================
-- COMPLETE SETUP SCHEMA FOR OUR SPACE (IDEMPOTENT)
-- Safe to run multiple times without hitting "Already Exists" errors!
-- =====================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT,
    partner_id UUID REFERENCES auth.users(id),
    lat NUMERIC,
    lng NUMERIC,
    invite_code TEXT UNIQUE,
    age INTEGER,
    location_name TEXT,
    avatar_url TEXT,
    onboarded BOOLEAN DEFAULT false
);

-- Upgrade existing tables if run repeatedly
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles selectable by anyone" ON public.profiles;
CREATE POLICY "Profiles selectable by anyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles insertable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles insertable by authenticated users" ON public.profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Profiles updatable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles updatable by authenticated users" ON public.profiles FOR UPDATE USING (auth.role() = 'authenticated');


-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    assigned_to UUID REFERENCES auth.users(id),
    creator_id UUID REFERENCES auth.users(id)
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tasks selectable by all" ON public.tasks;
CREATE POLICY "Tasks selectable by all" ON public.tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tasks insertable by authenticated users" ON public.tasks;
CREATE POLICY "Tasks insertable by authenticated users" ON public.tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tasks updatable by authenticated users" ON public.tasks;
CREATE POLICY "Tasks updatable by authenticated users" ON public.tasks FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Tasks deletable by authenticated users" ON public.tasks;
CREATE POLICY "Tasks deletable by authenticated users" ON public.tasks FOR DELETE USING (auth.role() = 'authenticated');


-- 3. Dates Table
CREATE TABLE IF NOT EXISTS public.dates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    description TEXT,
    creator_id UUID REFERENCES auth.users(id)
);

ALTER TABLE public.dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dates selectable by all" ON public.dates;
CREATE POLICY "Dates selectable by all" ON public.dates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Dates insertable by authenticated users" ON public.dates;
CREATE POLICY "Dates insertable by authenticated users" ON public.dates FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Dates updatable by authenticated users" ON public.dates;
CREATE POLICY "Dates updatable by authenticated users" ON public.dates FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Dates deletable by authenticated users" ON public.dates;
CREATE POLICY "Dates deletable by authenticated users" ON public.dates FOR DELETE USING (auth.role() = 'authenticated');


-- 4. Relationship Table
CREATE TABLE IF NOT EXISTS public.relationship (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user1 UUID REFERENCES auth.users(id),
    user2 UUID REFERENCES auth.users(id),
    anniversary_date DATE,
    last_disagreement_date DATE
);

ALTER TABLE public.relationship ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Relationship selectable by all" ON public.relationship;
CREATE POLICY "Relationship selectable by all" ON public.relationship FOR SELECT USING (true);

DROP POLICY IF EXISTS "Relationship insertable by auth" ON public.relationship;
CREATE POLICY "Relationship insertable by auth" ON public.relationship FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Relationship updatable by auth" ON public.relationship;
CREATE POLICY "Relationship updatable by auth" ON public.relationship FOR UPDATE USING (auth.role() = 'authenticated');


-- 5. Moods Table
CREATE TABLE IF NOT EXISTS public.moods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    date DATE NOT NULL,
    mood TEXT NOT NULL,
    UNIQUE(user_id, date)
);

ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Moods selectable by all" ON public.moods;
CREATE POLICY "Moods selectable by all" ON public.moods FOR SELECT USING (true);

DROP POLICY IF EXISTS "Moods insertable by auth" ON public.moods;
CREATE POLICY "Moods insertable by auth" ON public.moods FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Moods updatable by auth" ON public.moods;
CREATE POLICY "Moods updatable by auth" ON public.moods FOR UPDATE USING (auth.role() = 'authenticated');


-- 6. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Messages selectable by all" ON public.messages;
CREATE POLICY "Messages selectable by all" ON public.messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Messages insertable by auth" ON public.messages;
CREATE POLICY "Messages insertable by auth" ON public.messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 7. Photos/Gallery Table
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Photos selectable by all" ON public.photos;
CREATE POLICY "Photos selectable by all" ON public.photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Photos insertable by auth" ON public.photos;
CREATE POLICY "Photos insertable by auth" ON public.photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 8. Disagreements Table
CREATE TABLE IF NOT EXISTS public.disagreements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    topic TEXT NOT NULL,
    user1_id UUID REFERENCES auth.users(id),
    user1_story TEXT,
    user2_id UUID REFERENCES auth.users(id),
    user2_story TEXT,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.disagreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Disagreements selectable by all" ON public.disagreements;
CREATE POLICY "Disagreements selectable by all" ON public.disagreements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Disagreements insertable by auth" ON public.disagreements;
CREATE POLICY "Disagreements insertable by auth" ON public.disagreements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Disagreements updatable by auth" ON public.disagreements;
CREATE POLICY "Disagreements updatable by auth" ON public.disagreements FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Disagreements deletable by auth" ON public.disagreements;
CREATE POLICY "Disagreements deletable by auth" ON public.disagreements FOR DELETE USING (auth.role() = 'authenticated');

-- Note: Make sure to create a storage bucket in Supabase called "gallery" and make it public!

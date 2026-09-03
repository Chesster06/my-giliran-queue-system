-- ==============================================================================
-- MyGiliran: Supabase PostgreSQL Database Schema
-- Run this in your Supabase Project -> SQL Editor -> Run
-- ==============================================================================

-- 1. Create Profiles / Merchants Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  business_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'merchant',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Queues Table
CREATE TABLE IF NOT EXISTS public.queues (
  id TEXT PRIMARY KEY,
  creator_id TEXT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  slug TEXT UNIQUE NOT NULL,
  prefix TEXT DEFAULT 'A',
  starting_number INTEGER DEFAULT 1,
  current_counter INTEGER DEFAULT 0,
  current_serving TEXT DEFAULT '-',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Queue Entries Table
CREATE TABLE IF NOT EXISTS public.queue_entries (
  id TEXT PRIMARY KEY,
  queue_id TEXT NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  queue_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone_number TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'serving', 'completed', 'cancelled'
  counter_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 4. Create Indexes for High Performance Lookups
CREATE INDEX IF NOT EXISTS idx_queues_slug ON public.queues(slug);
CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_id ON public.queue_entries(queue_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON public.queue_entries(status);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

-- 6. Public Access Policies for Zero-Friction QR & Walk-in Experience
-- Profiles
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public profiles insert" ON public.profiles;
CREATE POLICY "Public profiles insert" ON public.profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public profiles update" ON public.profiles;
CREATE POLICY "Public profiles update" ON public.profiles FOR UPDATE USING (true);

-- Queues (public read for TV & Customers, all access for admin)
DROP POLICY IF EXISTS "Public queues select" ON public.queues;
CREATE POLICY "Public queues select" ON public.queues FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public queues insert" ON public.queues;
CREATE POLICY "Public queues insert" ON public.queues FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public queues update" ON public.queues;
CREATE POLICY "Public queues update" ON public.queues FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public queues delete" ON public.queues;
CREATE POLICY "Public queues delete" ON public.queues FOR DELETE USING (true);

-- Queue Entries (Customers can join, see queue, admin can update/delete)
DROP POLICY IF EXISTS "Public entries select" ON public.queue_entries;
CREATE POLICY "Public entries select" ON public.queue_entries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public entries insert" ON public.queue_entries;
CREATE POLICY "Public entries insert" ON public.queue_entries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public entries update" ON public.queue_entries;
CREATE POLICY "Public entries update" ON public.queue_entries FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public entries delete" ON public.queue_entries;
CREATE POLICY "Public entries delete" ON public.queue_entries FOR DELETE USING (true);

-- 7. Enable Supabase Realtime Replication on Queues & Entries
ALTER PUBLICATION supabase_realtime ADD TABLE public.queues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;

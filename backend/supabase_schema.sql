-- ==============================================================================
-- ClarityAI - Complete Supabase PostgreSQL Schema & Security Policies
-- ==============================================================================
-- Run this script in your Supabase Dashboard SQL Editor to prepare your database.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (Linked with Supabase Auth auth.users or standalone)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL DEFAULT '[SUPABASE_MANAGED_AUTH]',
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    page_count INTEGER DEFAULT 1,
    archetype TEXT DEFAULT 'General Document',
    status TEXT DEFAULT 'ready',
    error_message TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    share_token TEXT UNIQUE DEFAULT uuid_generate_v4()::text,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. DOCUMENT ANALYSES TABLE
CREATE TABLE IF NOT EXISTS public.document_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID UNIQUE REFERENCES public.documents(id) ON DELETE CASCADE,
    executive_summary TEXT NOT NULL,
    key_takeaways JSONB DEFAULT '[]'::jsonb,
    stakeholders JSONB DEFAULT '[]'::jsonb,
    risks_and_requirements JSONB DEFAULT '[]'::jsonb,
    suggested_questions JSONB DEFAULT '[]'::jsonb,
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. ACTION ITEMS TABLE (Interactive To-Dos)
CREATE TABLE IF NOT EXISTS public.action_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    category TEXT DEFAULT 'General',
    assignee TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    page_number INTEGER,
    order_idx INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 5. DEADLINES TABLE (.ics Export)
CREATE TABLE IF NOT EXISTS public.deadlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date TEXT NOT NULL,
    description TEXT,
    page_number INTEGER,
    category TEXT DEFAULT 'Deadline',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. CHAT MESSAGES TABLE (Grounded Copilot)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_share_token ON public.documents(share_token);
CREATE INDEX IF NOT EXISTS idx_action_items_document_id ON public.action_items(document_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_document_id ON public.deadlines(document_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_document_id ON public.chat_messages(document_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own profile
CREATE POLICY "Users can manage own profile" ON public.users
    FOR ALL USING (auth.uid() = id);

-- Allow users to view and manage their own documents, or view public shared documents
CREATE POLICY "Users can access own documents" ON public.documents
    FOR ALL USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can access own document analyses" ON public.document_analyses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.id = document_analyses.document_id 
            AND (d.user_id = auth.uid() OR d.is_public = TRUE)
        )
    );

CREATE POLICY "Users can access action items" ON public.action_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.id = action_items.document_id 
            AND (d.user_id = auth.uid() OR d.is_public = TRUE)
        )
    );

CREATE POLICY "Users can access deadlines" ON public.deadlines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.id = deadlines.document_id 
            AND (d.user_id = auth.uid() OR d.is_public = TRUE)
        )
    );

CREATE POLICY "Users can access chat messages" ON public.chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.id = chat_messages.document_id 
            AND (d.user_id = auth.uid() OR d.is_public = TRUE)
        )
    );

-- Optional trigger: auto-create public.users row when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

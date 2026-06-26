-- NexSite SQL Schema for Supabase

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Websites Table
CREATE TABLE IF NOT EXISTS public.websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    business_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    template TEXT NOT NULL DEFAULT 'business',
    design_style TEXT NOT NULL DEFAULT 'modern',
    content_json JSONB NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    logo_url TEXT,
    plan TEXT NOT NULL DEFAULT 'free',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE NOT NULL,
    plan TEXT NOT NULL,
    amount INTEGER NOT NULL,
    billing_cycle TEXT NOT NULL,
    status TEXT NOT NULL,
    next_due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE NOT NULL,
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'INR' NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Generation Sessions Table (temp storage for chats before sign-up)
CREATE TABLE IF NOT EXISTS public.generation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_data JSONB NOT NULL,
    generated_content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS websites_slug_idx ON public.websites (slug);

-- Enable RLS (Row Level Security) on tables
-- But since the backend server acts as service role to manage the system, we can allow public reads for published sites
-- and authenticate dashboard calls via JWT or service role key.
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_sessions ENABLE ROW LEVEL SECURITY;

-- Set up basic policies:
-- Anyone can read published websites
CREATE POLICY "Allow public read of published websites" ON public.websites
    FOR SELECT USING (status = 'published');

-- Authenticated users can read/write their own websites
CREATE POLICY "Allow users to manage their own websites" ON public.websites
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Anyone can submit a lead (contact form submissions)
CREATE POLICY "Allow public inserts for leads" ON public.leads
    FOR INSERT WITH CHECK (true);

-- Website owners can read leads for their own websites
CREATE POLICY "Allow owners to view leads" ON public.leads
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.websites
            WHERE websites.id = leads.website_id AND websites.user_id = auth.uid()
        )
    );

-- Website owners can read payments for their own websites
CREATE POLICY "Allow owners to view payments" ON public.payments
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.websites
            WHERE websites.id = payments.website_id AND websites.user_id = auth.uid()
        )
    );

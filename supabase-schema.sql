-- Create tables for the lead generation app

-- Table: scrapedlocations
CREATE TABLE public.scrapedlocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialty TEXT,
    address TEXT,
    phonenumber TEXT,
    email TEXT,
    scrapedat TIMESTAMP WITH TIME ZONE DEFAULT now(),
    searchquery TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS) for scrapedlocations
ALTER TABLE public.scrapedlocations ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to only see their own data
CREATE POLICY "Users can view their own scrapedlocations"
ON public.scrapedlocations
FOR SELECT
USING (auth.uid() = user_id);

-- Create a policy that allows users to insert their own data
CREATE POLICY "Users can insert their own scrapedlocations"
ON public.scrapedlocations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create a policy that allows users to update their own data
CREATE POLICY "Users can update their own scrapedlocations"
ON public.scrapedlocations
FOR UPDATE
USING (auth.uid() = user_id);

-- Create a policy that allows users to delete their own data
CREATE POLICY "Users can delete their own scrapedlocations"
ON public.scrapedlocations
FOR DELETE
USING (auth.uid() = user_id);

-- Table: waitlistleads
CREATE TABLE public.waitlistleads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    usecase TEXT,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS) for waitlistleads
ALTER TABLE public.waitlistleads ENABLE ROW LEVEL SECURITY;

-- Fix: Allow anonymous (unauthenticated) inserts into waitlistleads
CREATE POLICY "Allow anonymous inserts to waitlistleads"
ON public.waitlistleads
FOR INSERT
WITH CHECK (true);

-- Only allow admins to view waitlistleads
CREATE POLICY "Only admins can view waitlistleads"
ON public.waitlistleads
FOR SELECT
USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'isAdmin' = 'true'
));

-- Create a function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'isAdmin' = 'true'
    )
  );
END;
$$ LANGUAGE plpgsql; 
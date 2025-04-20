-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can insert waitlistleads" ON public.waitlistleads;
DROP POLICY IF EXISTS "Allow anonymous inserts to waitlistleads" ON public.waitlistleads;

-- Create a new policy that explicitly allows anonymous inserts
CREATE POLICY "Allow anonymous inserts to waitlistleads"
ON public.waitlistleads
FOR INSERT
TO anon
WITH CHECK (true);

-- Explicitly enable security bypass for the anon role
ALTER TABLE public.waitlistleads FORCE ROW LEVEL SECURITY;
GRANT INSERT ON public.waitlistleads TO anon; 
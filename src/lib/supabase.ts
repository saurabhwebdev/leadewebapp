import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uiokhjnhqeorzamkabju.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpb2toam5ocWVvcnphbWthYmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxODE5OTYsImV4cCI6MjA2MDc1Nzk5Nn0.brBww8LwfKuRfi6e-zixDkY-v4_vtX4DVs8SalpHZO8';

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 
# Firebase to Supabase Migration Guide

This document provides instructions for completing the migration from Firebase to Supabase in the Lead Generator application.

## Migration Steps

### Step 1: Supabase Setup

1. Go to the [Supabase dashboard](https://app.supabase.com/) and log in or create an account
2. Create a new project named "LeadGenApp" (or another name of your choice)
3. Copy the project URL and anon key from the project settings
4. Set up the Supabase schema by executing the SQL in `supabase-schema.sql` in the SQL Editor

### Step 2: Configure Google OAuth

1. In the Supabase dashboard, go to Authentication → Providers
2. Enable Google provider
3. Set up your Google OAuth credentials:
   - Create a new project in the Google Cloud Console (if needed)
   - Configure OAuth consent screen
   - Create OAuth credentials
   - Add authorized redirect URI: `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret to Supabase

### Step 3: Update Environment Variables

1. Create a `.env` file in the project root (if not already created)
2. Add the Supabase environment variables:
   ```
   VITE_SUPABASE_URL=https://uiokhjnhqeorzamkabju.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpb2toam5ocWVvcnphbWthYmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxODE5OTYsImV4cCI6MjA2MDc1Nzk5Nn0.brBww8LwfKuRfi6e-zixDkY-v4_vtX4DVs8SalpHZO8
   ```

### Step 4: Test the Application

1. Run the application:
   ```
   npm run dev
   ```
2. Test the authentication by signing in with Google
3. Test data persistence by using the lead generation features
4. Verify that data is being stored in Supabase tables

### Step 5: Data Migration (if needed)

If you need to migrate existing data from Firebase to Supabase:

1. Export your Firebase Firestore data
2. Transform the data to match the Supabase schema
3. Import the data into Supabase using one of these methods:
   - Use the Supabase dashboard to upload CSV files
   - Create a migration script using Supabase JS client
   - Use pgAdmin or another PostgreSQL client to bulk import data

## File Changes

The following files have been updated to use Supabase instead of Firebase:

1. `src/lib/supabase.ts` - Supabase client configuration
2. `src/contexts/SupabaseAuthContext.tsx` - Authentication context for Supabase
3. `src/lib/supabaseDb.ts` - Database operations using Supabase
4. `src/lib/supabaseScraper.ts` - Updated scraper implementation
5. `src/pages/AuthCallback.tsx` - Handler for OAuth redirects
6. Various components updated to use the Supabase auth context

## Cleaning Up

After the migration is complete and everything is working correctly, you can clean up by:

1. Removing unused Firebase dependencies
2. Deleting unused Firebase configuration files
3. Updating any documentation or READMEs to reflect the new Supabase backend

## Troubleshooting

- **Authentication Issues**: Make sure the Google OAuth credentials are correctly configured in Supabase
- **Database Access**: Check Row Level Security (RLS) policies if users can't access data
- **Missing Environment Variables**: Verify that all required environment variables are set correctly 
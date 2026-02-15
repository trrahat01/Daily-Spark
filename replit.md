# Daily Spark - Motivation & Quotes

## Overview
A React Native (Expo) mobile app for browsing, favoriting, and sharing motivational quotes. Includes a protected admin panel for managing content.

## Architecture
- **Frontend**: Expo Router (file-based routing), React Native, TypeScript
- **Backend**: Express server on port 5000 (landing page + API proxy)
- **Database**: Supabase (PostgreSQL) for quotes, categories, admins, ad_settings
- **State**: React Query for server state, AsyncStorage for local favorites & admin session
- **UI**: DM Sans font, amber/navy color scheme

## Supabase Integration
- `lib/supabase.ts` - Supabase client config using env vars
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` stored as secrets
- All CRUD operations go directly to Supabase from the client
- Favorites (liked quotes) stored locally in AsyncStorage
- Admin login checks `admins` table in Supabase (email + pin)

## Database Tables (Supabase)
- `quotes` - id, text, author, category, image_url, created_at
- `admins` - id, email, pin
- `ad_settings` - id, banner_enabled, interstitial_enabled
- `categories` - id, name

## Key Files
- `lib/supabase.ts` - Supabase client
- `lib/quote-storage.ts` - All CRUD operations (quotes, categories, admin auth)
- `lib/data.ts` - TypeScript interfaces
- `components/QuoteCard.tsx` - Animated quote card component
- `app/(tabs)/index.tsx` - Home screen with quotes & category filter
- `app/(tabs)/favorites.tsx` - Favorited quotes
- `app/(tabs)/admin.tsx` - Admin login + dashboard menu
- `app/admin/*.tsx` - Admin screens (add, edit, bulk upload, categories, manage)

## Recent Changes
- 2026-02-15: Connected app to Supabase (replaced AsyncStorage-only approach)
- Admin login now uses Supabase `admins` table (email + pin)
- All quote CRUD operations use Supabase
- Categories managed via Supabase `categories` table
- Favorites remain local (AsyncStorage) for instant UX

## User Preferences
- Uses Supabase as backend database
- Admin credentials changeable from Supabase dashboard
- Default admin: admin@dailyspark.com / PIN: 1234

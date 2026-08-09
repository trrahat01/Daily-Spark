# Daily Spark — Motivational Quotes & Daily Inspiration

A free, multi-language motivational quotes app built with **React Native (Expo SDK 54)**
and **Supabase**, monetized with **AdMob** (test ads during development).

> Package: `com.dailyspark.quotes` · App name: **Daily Spark**

## Features
- Read + search quotes by **category** (Motivation, Success, Life, Wisdom, Love, …)
- **Multi-language**: English, Hindi, Spanish, French (extensible in the seed script)
- **Quote of the Day** and **Surprise Me**
- **Favorite** quotes and **hide** quotes (per-user/device only — other users still see them)
- **Category & language filtering**
- AdMob ads with frequency capping (banner + rare interstitial)
- Dark/light theme, share quotes, offline-friendly Supabase config

## Tech
- Expo Router · React Native · React Query · Reanimated · Supabase (PostgREST) · AdMob

## Setup
```bash
npm install
```

## Environment
Set these (or they fall back to the values already in `lib/supabase.ts`):
```bash
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

## Seeding the database (min. 100k quotes, all categories)
1. Add the `language` column (once):
   - **Supabase → SQL Editor:**
     `alter table public.quotes add column if not exists language text not null default 'English';`
   - or from the terminal with your DB password:
     ```bash
     $env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.yxrfyzqhwuvuxwdfzcjs.supabase.co:5432/postgres"
     npx tsx scripts/migrate.ts
     ```
2. Upload quotes (idempotent, batched, multi-language, all categories):
   ```bash
   $env:EXPO_PUBLIC_SUPABASE_URL="https://yxrfyzqhwuvuxwdfzcjs.supabase.co"
   $env:EXPO_PUBLIC_SUPABASE_ANON_KEY="YOUR_ANON_KEY"
   npx tsx scripts/seed-quotes.ts 100000
   ```
   Pass a larger number to upload more. Add themes/templates in `LANG_DATA`
   (`scripts/seed-quotes.ts`) to increase variety further.

## Run locally
```bash
npx expo start
```

## Build for Play Store (user app)
```bash
$env:EXPO_PUBLIC_APP_VARIANT="user"
npx eas build -p android --profile production-user --clear-cache
npx eas submit -p android --profile production-user --id BUILD_ID
```

## Publishing notes
Public Pack: see `PLAYSTORE_LISTING.md` · Privacy Policy: `PRIVACY_POLICY.md`
Create the Play console app with package `com.dailyspark.quotes`.
Swap the AdMob **test** App ID for your real one before release.
# Daily Spark — Motivational Quotes & Daily Inspiration

A free, **Android** motivational quotes app built with **React Native (Expo SDK 54)** and
**Supabase**, monetized with **AdMob** (test ads during development). No login required.

> Package: `com.dailyspark.quotes` · App name: **Daily Spark**
> Proprietary software — see `LICENSE`. Not for use without the owner's permission.

## Features
- Read + search quotes by **category** (Motivation, Success, Life, Wisdom, Love, …)
- **Multi-language**: user picks a language and sees quotes in that language
  (English, Hindi, Spanish, French — extensible to more)
- **Quote of the Day** and **Surprise Me**
- **Favorite** quotes and **hide** quotes (per-device only — other users still see them)
- **Category & language filtering**
- **Share any quote as an image** with the Daily Spark logo + name (image watermarking)
- AdMob ads with frequency capping (banner + rare interstitial)
- Dark/light theme, offline-friendly Supabase config
- No accounts / no login

## Tech
- Expo Router · React Native · React Query · Reanimated · Supabase (PostgREST) · AdMob

## Setup
```bash
npm install   # runs patch-package (applies the AdMob RN-0.81 patch in /patches)
```

## Environment
Set these (or they fall back to the values already in `lib/supabase.ts`):
```bash
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

## Seeding the database (250k+ quotes, all categories, multi-language)
1. Add the `language` column (once):
   - **Supabase → SQL Editor:**
     `alter table public.quotes add column if not exists language text not null default 'English';`
   - or from the terminal with your DB password:
     ```bash
     $env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.yxrfyzqhwuvuxwdfzcjs.supabase.co:5432/postgres"
     npx tsx scripts/migrate.ts
     ```
2. Upload quotes (idempotent, batched, multi-language, all categories, with author names):
   ```bash
   $env:EXPO_PUBLIC_SUPABASE_URL="https://yxrfyzqhwuvuxwdfzcjs.supabase.co"
   $env:EXPO_PUBLIC_SUPABASE_ANON_KEY="YOUR_ANON_KEY"
   npx tsx scripts/seed-quotes.ts 250000
   ```
   Default target is `250000`. Pass a larger number to upload more. Add more languages /
   themes in `LANG_DATA` (`scripts/seed-quotes.ts`) to expand variety and language coverage.

## Run locally
```bash
npx expo start
```

## Build for Play Store (Android)
```bash
$env:EXPO_PUBLIC_APP_VARIANT="user"
npx eas build -p android --profile production-user --clear-cache
npx eas submit -p android --profile production-user --id BUILD_ID
```

## Publishing notes
- Store listing text: `PLAYSTORE_LISTING.md`
- **Full step-by-step publish guide:** `PLAYSTORE_PUBLISHING_GUIDE.md`
- **Privacy policy (public):** `https://trrahat01.github.io/daily-spark-privacy/`
- Create the Play console app with package `com.dailyspark.quotes`.
- Import a privacy-policy URL and mark **Ads / AdMob** in the Data Safety form.
- Swap the AdMob **test** App ID for your real one before release.

## License
PROPRIETARY — all rights reserved. See `LICENSE`. This project may not be copied,
redistributed, or used to build/publish another app without the owner's explicit license.
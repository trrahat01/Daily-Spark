# Daily Spark — Release Notes

## Version 2.3.1 (2026-08-29)
**Build:** Android versionCode `6` · iOS buildNumber `6` · package `com.dailyspark.quotes`

### 🔧 Fixes
- **Fixed quotes not loading** — the home feed now returns quotes reliably. Resolved
  a Supabase query timeout by ordering by id and bounding the result, and aligned
  language/country matching so selected languages always show their native quotes.
- **Improved Explore category layout** — category chips now wrap into a tidy grid
  under a clean "Browse topics" header.

---

## Version 2.3.0 (2026-08-29)
**Build:** Android versionCode `5` · iOS buildNumber `5` · package `com.dailyspark.quotes`

### ✨ New in this release
- **13 native languages, 12 categories** — Quotes are now available in English,
  Hindi, Spanish, French, German, Arabic, Portuguese, Bengali, Urdu, Indonesian,
  Japanese, Korean, and Chinese, across categories including Motivational,
  Inspirational, Life, Success, Wisdom, Love, Friendship, Happiness, Courage, Hope,
  **Romantic ❤️**, and **Sad 💔**.
- **Authentic, native content — no machine translation** — Every quote is
  original to its language/country and is displayed with its home country and
  original language. An English quote is never automatically translated into
  another language.
- **Romantic ❤️ quotes** — emotional quotes about love, first love, long-distance
  love, soulmates, missing someone, and commitment.
- **Sad 💔 quotes** — emotional quotes about heartbreak, lost love, separation,
  loneliness, betrayal, regret, and moving on.
- **Categories managed from Supabase** — Category names are stored and managed in
  the Supabase database and read by the app and seeder at runtime (no hardcoded
  lists in the app).

### 🔧 Improvements
- Expanded the quote database with hundreds of thousands of native quotes across
  all 13 languages and 12 categories.
- Kept all existing features: daily notification, streak calendar, Firebase
  Analytics, favorites, share, and language/country filtering.

### 📱 Getting started
- After updating, allow **notifications** when prompted to get the daily reminder.
- Choose any language/country in Settings to browse its native quotes.

---

## Version 2.2.0 (2026-08-22)
**Build:** Android versionCode `4` · iOS buildNumber `4` · package `com.dailyspark.quotes`

### ✨ New in this release
- **Daily Spark reminder** — A daily local notification every morning nudges you to open
  today's quote. Tapping it jumps straight to the Quote of the Day. (Requires notification
  permission on first launch.)
- **Streak tracker + 7-day flame calendar** — The home screen now shows your current day
  streak and "Best" streak, plus a 7-day flame calendar to help you build a daily habit.
- **Firebase Analytics** — The app now reports opens and key engagement events
  (quote viewed / shared / favorited, category opened, search) so we can understand and
  improve the experience. Data powers "active users / DAU" reporting.

### 🔧 Improvements
- Version bumped to 2.2.0 for the Play Store update.

### 📱 Getting started
- After updating, allow **notifications** when prompted to get the daily morning reminder.

---

## Version 2.1.0
Initial Play Store release.
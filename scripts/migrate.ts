/**
 * One-command DB migration: adds the missing `language` column (+ indexes) to
 * the Supabase `quotes` table. Idempotent — safe to run repeatedly.
 *
 * Usage (PowerShell):
 *   $env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.yxrfyzqhwuvuxwdfzcjs.supabase.co:5432/postgres"
 *   npx tsx scripts/migrate.ts
 *
 * Or, without any terminal command, run this in the Supabase Dashboard
 * (SQL Editor):
 *   alter table public.quotes add column if not exists language text not null default 'English';
 */
import { Pool } from "pg";

const DATABASE_URL = (
  process.env.DATABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_DB_URL ||
  ""
).trim();

if (!DATABASE_URL) {
  console.error(
    "\nNo DATABASE_URL found.\n" +
      "Set it to your Supabase direct connection string (replace YOUR_PASSWORD), e.g.:\n" +
      "  $env:DATABASE_URL=\"postgresql://postgres:YOUR_PASSWORD@db.yxrfyzqhwuvuxwdfzcjs.supabase.co:5432/postgres\"\n" +
      "then run this script again.\n\n" +
      "If you don't have the DB password, create the column in the Supabase Dashboard -> SQL Editor:\n" +
      "  alter table public.quotes add column if not exists language text not null default 'English';\n"
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    await pool.query(
      "alter table public.quotes add column if not exists language text not null default 'English';"
    );
    // Country-based quote system (native/original quotes, never machine-translated).
    await pool.query(
      "alter table public.quotes add column if not exists country text;"
    );
    await pool.query(
      "alter table public.quotes add column if not exists original_language text;"
    );
    await pool.query(
      "alter table public.quotes add column if not exists source text;"
    );
    await pool.query(
      "alter table public.quotes add column if not exists is_original boolean default true;"
    );
    await pool.query(
      "create index if not exists quotes_language_idx on public.quotes (language);"
    );
    await pool.query(
      "create index if not exists quotes_country_idx on public.quotes (country);"
    );
    await pool.query(
      "create index if not exists quotes_original_language_idx on public.quotes (original_language);"
    );
    await pool.query(
      "create index if not exists quotes_category_idx on public.quotes (category);"
    );
    console.log(
      "OK: 'language', 'country', 'original_language', 'source', 'is_original' columns and indexes are ready."
    );
  } catch (error: any) {
    console.error("Migration failed:", error?.message);
    process.exit(1);
  } finally {
    await pool.end().catch(() => {});
  }
}

main();
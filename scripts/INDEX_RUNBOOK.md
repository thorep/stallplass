# Index Maintenance Runbook

This runbook lists the exact order to run the SQL scripts and Prisma commands to clean up old indexes, recreate the needed ones, and validate performance for `/api/search`.

## Order of Operations

1) Take a snapshot
   - Run in Supabase SQL editor: `scripts/index_report.sql`
   - Purpose: Save a BEFORE report of all indexes.

2) Dry-run prune (review only)
   - Run: `scripts/prune_indexes_to_whitelist.sql` (DRY RUN section at the top)
   - Purpose: Lists which non-critical indexes would be dropped (keeps PK/UNIQUE/constraint-owned/trigram + our Prisma whitelist).

3) Prune (execute)
   - In the same file: uncomment the DO $$ ... END $$ block and run it to DROP redundant indexes.
   - Purpose: Remove stale/duplicate indexes safely.

4) Prisma migrate + generate (run locally/CI — not in SQL editor)
   - Dev: `npx prisma migrate dev --name add_search_indexes && npx prisma generate`
   - Prod: `npx prisma migrate deploy && npx prisma generate`
   - Purpose: Recreate the new, targeted Prisma indexes added in `prisma/schema.prisma`.

5) Text search indexes (trigram)
   - Run: `scripts/create_trgm_indexes.sql`
   - Purpose: Create GIN trigram indexes for fast `contains/ILIKE` text searches on stables/boxes/services/profiles/forum.

6) Verify expectations
   - Run: `scripts/verify_expected_indexes.sql`
   - Purpose: Reports any missing Prisma-whitelisted indexes and missing trigram indexes.

7) Inspect and sanity-check
   - Run: `scripts/db_insights.sql`
   - Purpose: Confirm table/index size distribution and scan usage looks healthy.

8) Functional sanity for `/api/search`
   - Manually exercise `/api/search` with common filters/sorts and a few text queries.
   - Optionally enable pg_stat_statements and collect a short observation window.

## Notes

- Do not remove constraints (primary keys and unique constraints). The prune script protects them.
- If you previously created custom trigram indexes with different names, they are preserved. The prune script keeps any `GIN(trgm)` indexes.
- If verify reports missing trigram indexes, re-run `scripts/create_trgm_indexes.sql`.


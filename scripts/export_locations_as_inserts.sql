-- Export counties and municipalities as INSERT ... ON CONFLICT statements.
-- Run this in the PROD database (Supabase SQL editor).
-- Copy the output and run it in DEV to replicate locations with the same IDs.

-- 1) Counties
SELECT format(
  'INSERT INTO "counties" ("id","name","countyNumber","createdAt","updatedAt") VALUES (%L,%L,%L,%L,%L)
   ON CONFLICT ("id") DO UPDATE SET "name"=EXCLUDED."name", "countyNumber"=EXCLUDED."countyNumber", "updatedAt"=NOW();',
  "id", "name", "countyNumber", "createdAt", "updatedAt"
) AS sql
FROM "counties"
ORDER BY "countyNumber";

-- 2) Municipalities
SELECT format(
  'INSERT INTO "municipalities" ("id","name","municipalityNumber","countyId","createdAt","updatedAt") VALUES (%L,%L,%L,%L,%L,%L)
   ON CONFLICT ("id") DO UPDATE SET "name"=EXCLUDED."name", "municipalityNumber"=EXCLUDED."municipalityNumber", "countyId"=EXCLUDED."countyId", "updatedAt"=NOW();',
  "id", "name", "municipalityNumber", "countyId", "createdAt", "updatedAt"
) AS sql
FROM "municipalities"
ORDER BY "municipalityNumber";

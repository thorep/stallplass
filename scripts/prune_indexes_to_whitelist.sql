-- Prune non-critical indexes to a safe whitelist derived from Prisma schema and text-search needs.
-- Run in Supabase SQL editor.
-- This script keeps:
--  - Primary keys and unique constraints
--  - Indexes owned by constraints
--  - Trigram GIN indexes (pg_trgm) for text search
--  - Indexes whose (table, ordered columns) match the whitelist below (sort order ignored)
-- Everything else is considered redundant and will be listed/dropped.

-- ===== Whitelist: desired (table, columns[]) combos
-- Note: Order matters for leading columns. Sort direction is ignored.
WITH desired AS (
  SELECT * FROM (
    VALUES
      -- stables
      ('stables',        ARRAY['archived','createdAt']::text[]),
      ('stables',        ARRAY['deletedAt','createdAt']),
      ('stables',        ARRAY['countyId','archived','createdAt']),
      ('stables',        ARRAY['municipalityId','archived','createdAt']),
      ('stables',        ARRAY['ownerId','archived','createdAt']),
      ('stables',        ARRAY['name']),
      ('stables',        ARRAY['rating']),

      -- boxes
      ('boxes',          ARRAY['stableId']),
      ('boxes',          ARRAY['archived','availableQuantity','createdAt']),
      ('boxes',          ARRAY['price']),
      ('boxes',          ARRAY['name']),
      ('boxes',          ARRAY['boxType']),
      ('boxes',          ARRAY['maxHorseSize']),
      ('boxes',          ARRAY['dagsleie']),

      -- services
      ('services',       ARRAY['archived','isActive','createdAt']),
      ('services',       ARRAY['serviceTypeId']),
      ('services',       ARRAY['title']),
      ('services',       ARRAY['userId']),

      -- service_areas
      ('service_areas',  ARRAY['serviceId']),
      ('service_areas',  ARRAY['county']),
      ('service_areas',  ARRAY['municipality']),

      -- amenity link tables
      ('box_amenity_links',    ARRAY['amenityId','boxId']),
      ('stable_amenity_links', ARRAY['amenityId','stableId']),

      -- messages
      ('messages',       ARRAY['conversationId','createdAt']),

      -- profiles (used for nickname search; B-tree ok, trigram kept separately)
      ('profiles',       ARRAY['nickname']),

      -- forum
      ('forum_posts',    ARRAY['authorId']),
      ('forum_posts',    ARRAY['categoryId','isPinned','createdAt']),
      ('forum_posts',    ARRAY['createdAt']),
      ('forum_posts',    ARRAY['parentId','createdAt']),
      ('forum_posts',    ARRAY['viewCount','createdAt']),
      ('forum_categories', ARRAY['sectionId']),
      ('forum_categories', ARRAY['slug']),
      ('forum_categories', ARRAY['sortOrder','isActive']),
      ('forum_sections', ARRAY['sortOrder','isActive']),
      ('forum_reactions', ARRAY['postId']),
      ('forum_reactions', ARRAY['postId','type']),
      ('forum_reactions', ARRAY['userId']),
      ('forum_tags',     ARRAY['name']),
      ('forum_tags',     ARRAY['threadId']),

      -- conversations (FK lookup indexes)
      ('conversations', ARRAY['boxId']),
      ('conversations', ARRAY['horseSaleId']),
      ('conversations', ARRAY['partLoanHorseId']),
      ('conversations', ARRAY['serviceId']),
      ('conversations', ARRAY['stableId']),

      -- horse_shares (FK lookup indexes)
      ('horse_shares',  ARRAY['horseId']),
      ('horse_shares',  ARRAY['sharedById']),
      ('horse_shares',  ARRAY['sharedWithId']),

      -- part_loan_horses (owner lookups)
      ('part_loan_horses', ARRAY['userId']),

      -- stable_faqs
      ('stable_faqs',   ARRAY['stableId']),

      -- custom logs
      ('custom_log_categories', ARRAY['horseId']),
      ('custom_log_categories', ARRAY['horseId','isActive','sortOrder']),
      ('custom_log_categories', ARRAY['ownerId']),
      ('custom_logs',    ARRAY['categoryId','createdAt']),
      ('custom_logs',    ARRAY['categoryId']),
      ('custom_logs',    ARRAY['horseId']),
      ('custom_logs',    ARRAY['profileId']),

      -- budget
      ('budget_items',   ARRAY['horseId','startMonth']),
      ('budget_items',   ARRAY['horseId','isRecurring']),
      ('budget_overrides', ARRAY['month']),

      -- favorites
      ('favorites',      ARRAY['userId']),
      ('favorites',      ARRAY['entityType','entityId']),

      -- horse sales / buys
      ('horse_sales',    ARRAY['archived','deletedAt','createdAt']),
      ('horse_sales',    ARRAY['userId','createdAt']),
      ('horse_sales',    ARRAY['countyId']),
      ('horse_sales',    ARRAY['municipalityId']),
      ('horse_sales',    ARRAY['breedId']),
      ('horse_sales',    ARRAY['disciplineId']),
      ('horse_sales',    ARRAY['gender']),
      ('horse_sales',    ARRAY['size']),
      ('horse_sales',    ARRAY['price']),
      ('horse_sales',    ARRAY['age']),
      ('horse_sales',    ARRAY['height']),

      ('horse_buys',     ARRAY['archived','deletedAt','createdAt']),
      ('horse_buys',     ARRAY['breedId']),
      ('horse_buys',     ARRAY['disciplineId']),
      ('horse_buys',     ARRAY['userId']),
      ('horse_buys',     ARRAY['gender']),
      ('horse_buys',     ARRAY['priceMin']),
      ('horse_buys',     ARRAY['priceMax']),
      ('horse_buys',     ARRAY['ageMin']),
      ('horse_buys',     ARRAY['ageMax']),
      ('horse_buys',     ARRAY['heightMin']),
      ('horse_buys',     ARRAY['heightMax'])
  ) AS t(table_name, columns)
)
, indexes AS (
  SELECT
    i.oid                           AS index_oid,
    n.nspname                       AS schema,
    t.relname                       AS table_name,
    i.relname                       AS index_name,
    am.amname                       AS method,
    ix.indisprimary                 AS is_primary,
    ix.indisunique                  AS is_unique,
    (c.oid IS NOT NULL)             AS is_constraint_owned,
    ix.indpred IS NOT NULL          AS is_partial,
    pg_get_indexdef(i.oid)          AS indexdef,
    (
      SELECT array_agg(att.attname ORDER BY k.ordinality)
      FROM unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ordinality)
      JOIN pg_attribute att
        ON att.attrelid = t.oid
       AND att.attnum   = k.attnum
    )                                AS columns,
    (
      SELECT array_agg(
               CASE
                 WHEN opc.opcname IS NOT NULL THEN opc.opcname
                 ELSE NULL
               END
               ORDER BY k.ordinality
             )
      FROM unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ordinality)
      LEFT JOIN pg_attribute att
        ON att.attrelid = t.oid AND att.attnum = k.attnum
      LEFT JOIN pg_type ty
        ON ty.oid = att.atttypid
      LEFT JOIN pg_opclass opc
        ON opc.oid = ix.indclass[k.ordinality]
    ) AS opclasses
  FROM pg_index ix
  JOIN pg_class t          ON t.oid  = ix.indrelid
  JOIN pg_class i          ON i.oid  = ix.indexrelid
  JOIN pg_namespace n      ON n.oid  = t.relnamespace
  JOIN pg_am am            ON am.oid = i.relam
  LEFT JOIN pg_constraint c ON c.conindid = i.oid
  WHERE n.nspname = 'public'
)

-- ===== DRY RUN: list what would be dropped (safe set)
SELECT format('DROP INDEX IF EXISTS %I.%I;', schema, index_name) AS drop_stmt,
       table_name, index_name, method, columns, opclasses
FROM indexes idx
WHERE
  -- Keep constraints
  NOT is_primary
  AND NOT is_unique
  AND NOT is_constraint_owned
  -- Keep trigram text-search indexes (GIN + gin_trgm_ops)
  AND NOT (
    method = 'gin' AND EXISTS (
      SELECT 1 FROM unnest(opclasses) AS oc(opc)
      WHERE opc::text ILIKE '%trgm%'
    )
  )
  -- Keep partial / expression indexes (safer to preserve)
  AND NOT is_partial
  -- Keep whitelisted column combos (sort ignored)
  AND NOT EXISTS (
    SELECT 1 FROM desired d
    WHERE d.table_name = idx.table_name
      AND d.columns    = (idx.columns::text[])
  )
ORDER BY table_name, index_name;

-- ===== EXECUTE: actually drop (uncomment to run)
DO $plpgsql$
DECLARE r record;
BEGIN
  FOR r IN (
    WITH desired AS (
      SELECT * FROM (
        VALUES
          -- stables
          ('stables',        ARRAY['archived','createdAt']::text[]),
          ('stables',        ARRAY['deletedAt','createdAt']),
          ('stables',        ARRAY['countyId','archived','createdAt']),
          ('stables',        ARRAY['municipalityId','archived','createdAt']),
          ('stables',        ARRAY['ownerId','archived','createdAt']),
          ('stables',        ARRAY['name']),
          ('stables',        ARRAY['rating']),
          -- boxes
          ('boxes',          ARRAY['stableId']),
          ('boxes',          ARRAY['archived','availableQuantity','createdAt']),
          ('boxes',          ARRAY['price']),
          ('boxes',          ARRAY['name']),
          ('boxes',          ARRAY['boxType']),
          ('boxes',          ARRAY['maxHorseSize']),
          ('boxes',          ARRAY['dagsleie']),
          -- services
          ('services',       ARRAY['archived','isActive','createdAt']),
          ('services',       ARRAY['serviceTypeId']),
          ('services',       ARRAY['title']),
          ('services',       ARRAY['userId']),
          -- service_areas
          ('service_areas',  ARRAY['serviceId']),
          ('service_areas',  ARRAY['county']),
          ('service_areas',  ARRAY['municipality']),
          -- amenity link tables
          ('box_amenity_links',    ARRAY['amenityId','boxId']),
          ('stable_amenity_links', ARRAY['amenityId','stableId']),
          -- messages
          ('messages',       ARRAY['conversationId','createdAt']),
          -- profiles
          ('profiles',       ARRAY['nickname']),
          -- forum
          ('forum_posts',    ARRAY['authorId']),
          ('forum_posts',    ARRAY['categoryId','isPinned','createdAt']),
          ('forum_posts',    ARRAY['createdAt']),
          ('forum_posts',    ARRAY['parentId','createdAt']),
          ('forum_posts',    ARRAY['viewCount','createdAt']),
          ('forum_categories', ARRAY['sectionId']),
          ('forum_categories', ARRAY['slug']),
          ('forum_categories', ARRAY['sortOrder','isActive']),
          ('forum_sections', ARRAY['sortOrder','isActive']),
          ('forum_reactions', ARRAY['postId']),
          ('forum_reactions', ARRAY['postId','type']),
          ('forum_reactions', ARRAY['userId']),
          ('forum_tags',     ARRAY['name']),
          ('forum_tags',     ARRAY['threadId']),
          -- conversations
          ('conversations', ARRAY['boxId']),
          ('conversations', ARRAY['horseSaleId']),
          ('conversations', ARRAY['partLoanHorseId']),
          ('conversations', ARRAY['serviceId']),
          ('conversations', ARRAY['stableId']),
          -- horse_shares
          ('horse_shares',  ARRAY['horseId']),
          ('horse_shares',  ARRAY['sharedById']),
          ('horse_shares',  ARRAY['sharedWithId']),
          -- part_loan_horses
          ('part_loan_horses', ARRAY['userId']),
          -- stable_faqs
          ('stable_faqs',   ARRAY['stableId']),
          -- custom logs
          ('custom_log_categories', ARRAY['horseId']),
          ('custom_log_categories', ARRAY['horseId','isActive','sortOrder']),
          ('custom_log_categories', ARRAY['ownerId']),
          ('custom_logs',    ARRAY['categoryId','createdAt']),
          ('custom_logs',    ARRAY['categoryId']),
          ('custom_logs',    ARRAY['horseId']),
          ('custom_logs',    ARRAY['profileId']),
          -- budget
          ('budget_items',   ARRAY['horseId','startMonth']),
          ('budget_items',   ARRAY['horseId','isRecurring']),
          ('budget_overrides', ARRAY['month']),
          -- favorites
          ('favorites',      ARRAY['userId']),
          ('favorites',      ARRAY['entityType','entityId']),
          -- horse sales / buys
          ('horse_sales',    ARRAY['archived','deletedAt','createdAt']),
          ('horse_sales',    ARRAY['userId','createdAt']),
          ('horse_sales',    ARRAY['countyId']),
          ('horse_sales',    ARRAY['municipalityId']),
          ('horse_sales',    ARRAY['breedId']),
          ('horse_sales',    ARRAY['disciplineId']),
          ('horse_sales',    ARRAY['gender']),
          ('horse_sales',    ARRAY['size']),
          ('horse_sales',    ARRAY['price']),
          ('horse_sales',    ARRAY['age']),
          ('horse_sales',    ARRAY['height']),
          ('horse_buys',     ARRAY['archived','deletedAt','createdAt']),
          ('horse_buys',     ARRAY['breedId']),
          ('horse_buys',     ARRAY['disciplineId']),
          ('horse_buys',     ARRAY['userId']),
          ('horse_buys',     ARRAY['gender']),
          ('horse_buys',     ARRAY['priceMin']),
          ('horse_buys',     ARRAY['priceMax']),
          ('horse_buys',     ARRAY['ageMin']),
          ('horse_buys',     ARRAY['ageMax']),
          ('horse_buys',     ARRAY['heightMin']),
          ('horse_buys',     ARRAY['heightMax'])
      ) AS t(table_name, columns)
    )
    , indexes AS (
      SELECT
        i.oid                           AS index_oid,
        n.nspname                       AS schema,
        t.relname                       AS table_name,
        i.relname                       AS index_name,
        am.amname                       AS method,
        ix.indisprimary                 AS is_primary,
        ix.indisunique                  AS is_unique,
        (c.oid IS NOT NULL)             AS is_constraint_owned,
        ix.indpred IS NOT NULL          AS is_partial,
        (
          SELECT array_agg(att.attname ORDER BY k.ordinality)
          FROM unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ordinality)
          JOIN pg_attribute att
            ON att.attrelid = t.oid
           AND att.attnum   = k.attnum
        )                                AS columns,
        (
          SELECT array_agg(
                   CASE WHEN opc.opcname IS NOT NULL THEN opc.opcname ELSE NULL END
                   ORDER BY k.ordinality
                 )
          FROM unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ordinality)
          LEFT JOIN pg_opclass opc
            ON opc.oid = ix.indclass[k.ordinality]
        ) AS opclasses
      FROM pg_index ix
      JOIN pg_class t          ON t.oid  = ix.indrelid
      JOIN pg_class i          ON i.oid  = ix.indexrelid
      JOIN pg_namespace n      ON n.oid  = t.relnamespace
      JOIN pg_am am            ON am.oid = i.relam
      LEFT JOIN pg_constraint c ON c.conindid = i.oid
      WHERE n.nspname = 'public'
    )
    SELECT schema, index_name
    FROM indexes idx
    WHERE NOT is_primary
      AND NOT is_unique
      AND NOT is_constraint_owned
      AND NOT (
        method = 'gin' AND EXISTS (
          SELECT 1 FROM unnest(opclasses) AS oc(opc)
          WHERE opc::text ILIKE '%trgm%'
        )
      )
      AND NOT is_partial
      AND NOT EXISTS (
        SELECT 1 FROM desired d
        WHERE d.table_name = idx.table_name
          AND d.columns    = (idx.columns::text[])
      )
  ) LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I.%I;', r.schema, r.index_name);
  END LOOP;
END
$plpgsql$;

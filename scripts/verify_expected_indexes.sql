-- Verify that expected indexes exist (post-migrate) and report any missing.
-- Run in Supabase SQL editor. Read-only.

-- Desired Prisma indexes by (table, columns[]) combos (sort ignored)
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
, idx AS (
  SELECT
    n.nspname                       AS schema,
    t.relname                       AS table_name,
    i.relname                       AS index_name,
    am.amname                       AS method,
    ix.indisprimary                 AS is_primary,
    ix.indisunique                  AS is_unique,
    (c.oid IS NOT NULL)             AS is_constraint_owned,
    (
      SELECT array_agg(att.attname ORDER BY k.ordinality)
      FROM unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ordinality)
      JOIN pg_attribute att
        ON att.attrelid = t.oid
       AND att.attnum   = k.attnum
    )                                AS columns,
    (
      SELECT array_agg(opc.opcname ORDER BY k.ordinality)
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
SELECT 'MISSING_SCHEMA_INDEX' AS type,
       d.table_name,
       d.columns,
       'No matching index found' AS detail
FROM desired d
LEFT JOIN idx ON idx.table_name = d.table_name AND (idx.columns::text[]) = d.columns
WHERE idx.index_name IS NULL
UNION ALL
-- Verify trigram GIN indexes for text search needs
SELECT 'MISSING_TRIGRAM_INDEX' AS type,
       t.table_name,
       ARRAY[t.column_name]::text[] AS columns,
       'Expected GIN(trgm) on '||t.table_name||'.'||t.column_name AS detail
FROM (
  SELECT * FROM (
    VALUES
      ('stables','name'),
      ('stables','description'),
      ('boxes','name'),
      ('boxes','description'),
      ('services','title'),
      ('services','description'),
      ('profiles','nickname'),
      ('forum_posts','title'),
      ('forum_posts','content')
  ) AS v(table_name, column_name)
) t
WHERE NOT EXISTS (
  SELECT 1
  FROM idx
  WHERE idx.table_name = t.table_name
    AND idx.method = 'gin'
    AND (idx.columns::text[]) = ARRAY[t.column_name]::text[]
    AND EXISTS (
      SELECT 1 FROM unnest(idx.opclasses) AS oc(opc)
      WHERE opc::text ILIKE '%trgm%'
    )
)
ORDER BY 1,2,3;

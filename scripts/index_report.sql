-- Detailed index report for public schema
-- Run in Supabase SQL editor. Read-only.

WITH idx AS (
  SELECT
    n.nspname                             AS schema,
    t.relname                             AS table_name,
    i.relname                             AS index_name,
    am.amname                             AS method,
    ix.indisprimary                       AS is_primary,
    ix.indisunique                        AS is_unique,
    (c.oid IS NOT NULL)                   AS is_constraint_owned,
    ix.indpred IS NOT NULL                AS is_partial,
    pg_get_indexdef(i.oid)                AS indexdef,
    pg_relation_size(i.oid)               AS bytes,
    COALESCE(psui.idx_scan,0)             AS idx_scan,
    (
      SELECT array_agg(att.attname ORDER BY k.ordinality)
      FROM unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ordinality)
      JOIN pg_attribute att
        ON att.attrelid = t.oid
       AND att.attnum   = k.attnum
    )                                      AS columns,
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
  LEFT JOIN pg_stat_user_indexes psui ON psui.indexrelid = i.oid
  WHERE n.nspname = 'public'
)
SELECT
  schema,
  table_name,
  index_name,
  method,
  is_primary,
  is_unique,
  is_constraint_owned,
  is_partial,
  columns,
  opclasses,
  pg_size_pretty(bytes) AS size,
  idx_scan,
  indexdef
FROM idx
ORDER BY table_name, is_primary DESC, is_unique DESC, bytes DESC;

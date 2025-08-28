ALTER TABLE "public"."budget_items"
  ADD COLUMN "intervalWeeks" INTEGER,
  ADD COLUMN "weekday" INTEGER;

-- Optional: simple check constraints (Postgres)
ALTER TABLE "public"."budget_items"
  ADD CONSTRAINT budget_items_weekday_check CHECK ("weekday" IS NULL OR ("weekday" >= 1 AND "weekday" <= 7));


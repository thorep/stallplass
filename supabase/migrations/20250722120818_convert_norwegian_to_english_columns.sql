-- Convert Norwegian column names to English in production
-- Only rename if Norwegian columns exist

-- base_prices table: Norwegian -> English (if Norwegian columns exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'base_prices' AND column_name = 'grunnpris') THEN
        ALTER TABLE base_prices RENAME COLUMN grunnpris TO price;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'base_prices' AND column_name = 'er_aktiv') THEN
        ALTER TABLE base_prices RENAME COLUMN er_aktiv TO is_active;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'base_prices' AND column_name = 'opprettet_dato') THEN
        ALTER TABLE base_prices RENAME COLUMN opprettet_dato TO created_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'base_prices' AND column_name = 'oppdatert_dato') THEN
        ALTER TABLE base_prices RENAME COLUMN oppdatert_dato TO updated_at;
    END IF;
END $$;

-- pricing_discounts table: Norwegian -> English
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_discounts' AND column_name = 'rabatt_prosent') THEN
        ALTER TABLE pricing_discounts RENAME COLUMN rabatt_prosent TO percentage;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_discounts' AND column_name = 'maaneder') THEN
        ALTER TABLE pricing_discounts RENAME COLUMN maaneder TO months;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_discounts' AND column_name = 'er_aktiv') THEN
        ALTER TABLE pricing_discounts RENAME COLUMN er_aktiv TO is_active;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_discounts' AND column_name = 'opprettet_dato') THEN
        ALTER TABLE pricing_discounts RENAME COLUMN opprettet_dato TO created_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_discounts' AND column_name = 'oppdatert_dato') THEN
        ALTER TABLE pricing_discounts RENAME COLUMN oppdatert_dato TO updated_at;
    END IF;
END $$;
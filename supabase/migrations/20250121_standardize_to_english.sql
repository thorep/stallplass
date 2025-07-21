-- Migration to standardize all database tables and columns to English
-- This reverses the Norwegian terminology migration

BEGIN;

-- 1. Rename tables from Norwegian to English

-- Core tables
ALTER TABLE brukere RENAME TO users;
ALTER TABLE staller RENAME TO stables;
ALTER TABLE stallplasser RENAME TO boxes;
ALTER TABLE utleie RENAME TO rentals;
ALTER TABLE betalinger RENAME TO payments;
ALTER TABLE samtaler RENAME TO conversations;
ALTER TABLE meldinger RENAME TO messages;
ALTER TABLE anmeldelser RENAME TO reviews;

-- Amenity tables
ALTER TABLE stallplass_fasiliteter RENAME TO box_amenities;
ALTER TABLE stall_fasiliteter RENAME TO stable_amenities;
ALTER TABLE stallplass_fasilitet_lenker RENAME TO box_amenity_links;
ALTER TABLE stall_fasilitet_lenker RENAME TO stable_amenity_links;

-- FAQ table
ALTER TABLE stall_ofte_spurte_sporsmal RENAME TO stable_faqs;

-- 2. Rename columns in users table
ALTER TABLE users RENAME COLUMN er_admin TO is_admin;
ALTER TABLE users RENAME COLUMN opprettet_dato TO created_at;
ALTER TABLE users RENAME COLUMN oppdatert_dato TO updated_at;

-- 3. Rename columns in stables table
ALTER TABLE stables RENAME COLUMN eier_id TO owner_id;
ALTER TABLE stables RENAME COLUMN eier_navn TO owner_name;
ALTER TABLE stables RENAME COLUMN antall_anmeldelser TO review_count;
ALTER TABLE stables RENAME COLUMN antall_stallplasser TO total_boxes;
ALTER TABLE stables RENAME COLUMN bilde_beskrivelser TO image_descriptions;
ALTER TABLE stables RENAME COLUMN reklame_aktiv TO advertising_active;
ALTER TABLE stables RENAME COLUMN reklame_start_dato TO advertising_start_date;
ALTER TABLE stables RENAME COLUMN reklame_slutt_dato TO advertising_end_date;
ALTER TABLE stables RENAME COLUMN opprettet_dato TO created_at;
ALTER TABLE stables RENAME COLUMN oppdatert_dato TO updated_at;

-- 4. Rename columns in boxes table
ALTER TABLE boxes RENAME COLUMN stall_id TO stable_id;
ALTER TABLE boxes RENAME COLUMN maanedlig_pris TO price;
ALTER TABLE boxes RENAME COLUMN er_tilgjengelig TO is_available;
ALTER TABLE boxes RENAME COLUMN er_aktiv TO is_active;
ALTER TABLE boxes RENAME COLUMN er_innendors TO is_indoor;
ALTER TABLE boxes RENAME COLUMN har_vindu TO has_window;
ALTER TABLE boxes RENAME COLUMN har_strom TO has_electricity;
ALTER TABLE boxes RENAME COLUMN har_vann TO has_water;
ALTER TABLE boxes RENAME COLUMN maks_hest_storrelse TO max_horse_size;
ALTER TABLE boxes RENAME COLUMN er_sponset TO is_sponsored;
ALTER TABLE boxes RENAME COLUMN sponset_til TO sponsored_until;
ALTER TABLE boxes RENAME COLUMN sponset_start_dato TO sponsored_start_date;
ALTER TABLE boxes RENAME COLUMN bilde_beskrivelser TO image_descriptions;
ALTER TABLE boxes RENAME COLUMN spesielle_notater TO special_notes;
ALTER TABLE boxes RENAME COLUMN stallplass_type TO box_type;
ALTER TABLE boxes RENAME COLUMN opprettet_dato TO created_at;
ALTER TABLE boxes RENAME COLUMN oppdatert_dato TO updated_at;

-- 5. Rename columns in rentals table
ALTER TABLE rentals RENAME COLUMN stallplass_id TO box_id;
ALTER TABLE rentals RENAME COLUMN stall_id TO stable_id;
ALTER TABLE rentals RENAME COLUMN leietaker_id TO rider_id;
ALTER TABLE rentals RENAME COLUMN samtale_id TO conversation_id;
ALTER TABLE rentals RENAME COLUMN start_dato TO start_date;
ALTER TABLE rentals RENAME COLUMN slutt_dato TO end_date;
ALTER TABLE rentals RENAME COLUMN maanedlig_pris TO monthly_price;
ALTER TABLE rentals RENAME COLUMN opprettet_dato TO created_at;
ALTER TABLE rentals RENAME COLUMN oppdatert_dato TO updated_at;

-- 6. Rename columns in payments table
ALTER TABLE payments RENAME COLUMN bruker_id TO user_id;
ALTER TABLE payments RENAME COLUMN stall_id TO stable_id;
ALTER TABLE payments RENAME COLUMN total_belop TO total_amount;
ALTER TABLE payments RENAME COLUMN betalingsmetode TO payment_method;
ALTER TABLE payments RENAME COLUMN vipps_ordre_id TO vipps_order_id;
ALTER TABLE payments RENAME COLUMN vipps_referanse TO vipps_reference;
ALTER TABLE payments RENAME COLUMN betalt_dato TO paid_at;
ALTER TABLE payments RENAME COLUMN feilet_dato TO failed_at;
ALTER TABLE payments RENAME COLUMN feil_arsak TO failure_reason;
ALTER TABLE payments RENAME COLUMN opprettet_dato TO created_at;
ALTER TABLE payments RENAME COLUMN oppdatert_dato TO updated_at;

-- 7. Rename columns in conversations table
ALTER TABLE conversations RENAME COLUMN leietaker_id TO rider_id;
ALTER TABLE conversations RENAME COLUMN stall_id TO stable_id;
ALTER TABLE conversations RENAME COLUMN stallplass_id TO box_id;
ALTER TABLE conversations RENAME COLUMN opprettet_dato TO created_at;
ALTER TABLE conversations RENAME COLUMN oppdatert_dato TO updated_at;

-- 8. Rename columns in messages table
ALTER TABLE messages RENAME COLUMN samtale_id TO conversation_id;
ALTER TABLE messages RENAME COLUMN avsender_id TO sender_id;
ALTER TABLE messages RENAME COLUMN melding_type TO message_type;
ALTER TABLE messages RENAME COLUMN er_lest TO is_read;
ALTER TABLE messages RENAME COLUMN opprettet_dato TO created_at;

-- 9. Rename columns in reviews table
ALTER TABLE reviews RENAME COLUMN utleie_id TO rental_id;
ALTER TABLE reviews RENAME COLUMN anmelder_id TO reviewer_id;
ALTER TABLE reviews RENAME COLUMN anmeldt_id TO reviewee_id;
ALTER TABLE reviews RENAME COLUMN anmeldt_type TO reviewee_type;
ALTER TABLE reviews RENAME COLUMN stall_id TO stable_id;
ALTER TABLE reviews RENAME COLUMN kommunikasjon_vurdering TO communication_rating;
ALTER TABLE reviews RENAME COLUMN renslighet_vurdering TO cleanliness_rating;
ALTER TABLE reviews RENAME COLUMN fasiliteter_vurdering TO facilities_rating;
ALTER TABLE reviews RENAME COLUMN palitelighet_vurdering TO reliability_rating;
ALTER TABLE reviews RENAME COLUMN er_offentlig TO is_public;
ALTER TABLE reviews RENAME COLUMN er_moderert TO is_moderated;
ALTER TABLE reviews RENAME COLUMN moderator_notater TO moderator_notes;
ALTER TABLE reviews RENAME COLUMN opprettet_dato TO created_at;
ALTER TABLE reviews RENAME COLUMN oppdatert_dato TO updated_at;

-- 10. Rename columns in amenity tables
ALTER TABLE box_amenities RENAME COLUMN opprettet_dato TO created_at;
ALTER TABLE box_amenities RENAME COLUMN oppdatert_dato TO updated_at;

ALTER TABLE stable_amenities RENAME COLUMN opprettet_dato TO created_at;
ALTER TABLE stable_amenities RENAME COLUMN oppdatert_dato TO updated_at;

-- 11. Rename columns in link tables
ALTER TABLE box_amenity_links RENAME COLUMN stallplass_id TO box_id;
ALTER TABLE box_amenity_links RENAME COLUMN fasilitet_id TO amenity_id;
ALTER TABLE box_amenity_links RENAME COLUMN opprettet_dato TO created_at;

ALTER TABLE stable_amenity_links RENAME COLUMN stall_id TO stable_id;
ALTER TABLE stable_amenity_links RENAME COLUMN fasilitet_id TO amenity_id;
ALTER TABLE stable_amenity_links RENAME COLUMN opprettet_dato TO created_at;

-- 12. Rename columns in stable_faqs table
ALTER TABLE stable_faqs RENAME COLUMN stall_id TO stable_id;
ALTER TABLE stable_faqs RENAME COLUMN sporsmal TO question;
ALTER TABLE stable_faqs RENAME COLUMN svar TO answer;
ALTER TABLE stable_faqs RENAME COLUMN opprettet_dato TO created_at;
-- Note: updated_at was not renamed in the Norwegian migration, so it's already in English

-- 13. Rename columns in page_views table
ALTER TABLE page_views RENAME COLUMN seer_id TO viewer_id;
ALTER TABLE page_views RENAME COLUMN entitet_type TO entity_type;
ALTER TABLE page_views RENAME COLUMN entitet_id TO entity_id;
ALTER TABLE page_views RENAME COLUMN ip_adresse TO ip_address;
ALTER TABLE page_views RENAME COLUMN bruker_agent TO user_agent;
ALTER TABLE page_views RENAME COLUMN opprettet_dato TO created_at;

-- 14. Rename columns in base_prices table
ALTER TABLE base_prices RENAME COLUMN grunnpris TO price;
ALTER TABLE base_prices RENAME COLUMN er_aktiv TO is_active;
ALTER TABLE base_prices RENAME COLUMN opprettet_dato TO created_at;
ALTER TABLE base_prices RENAME COLUMN oppdatert_dato TO updated_at;

-- 15. Rename columns in pricing_discounts table
ALTER TABLE pricing_discounts RENAME COLUMN rabatt_prosent TO percentage;
ALTER TABLE pricing_discounts RENAME COLUMN maaneder TO months;
ALTER TABLE pricing_discounts RENAME COLUMN er_aktiv TO is_active;
ALTER TABLE pricing_discounts RENAME COLUMN opprettet_dato TO created_at;
ALTER TABLE pricing_discounts RENAME COLUMN oppdatert_dato TO updated_at;

-- 16. Rename columns in roadmap_items table
ALTER TABLE roadmap_items RENAME COLUMN opprettet_dato TO created_at;
ALTER TABLE roadmap_items RENAME COLUMN oppdatert_dato TO updated_at;

-- All foreign key constraints are automatically updated when tables/columns are renamed in PostgreSQL
-- Indexes are also automatically updated with new names

COMMIT;

-- Rollback script (in case we need to revert)
-- To create a rollback, run the Norwegian migration file: 20250721085710_migrate_to_norwegian_terminology.sql
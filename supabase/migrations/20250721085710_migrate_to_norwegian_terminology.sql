-- Complete migration to Norwegian terminology
-- This migration renames all tables and columns to use Norwegian terms

-- 1. First, create all new tables with Norwegian names

-- Rename users to brukere
ALTER TABLE users RENAME TO brukere;

-- Rename stables to staller  
ALTER TABLE stables RENAME TO staller;

-- Rename boxes to stallplasser
ALTER TABLE boxes RENAME TO stallplasser;

-- Rename rentals to utleie
ALTER TABLE rentals RENAME TO utleie;

-- Rename payments to betalinger  
ALTER TABLE payments RENAME TO betalinger;

-- Rename conversations to samtaler
ALTER TABLE conversations RENAME TO samtaler;

-- Rename messages to meldinger
ALTER TABLE messages RENAME TO meldinger;

-- Rename reviews to anmeldelser
ALTER TABLE reviews RENAME TO anmeldelser;

-- Rename box_amenities to stallplass_fasiliteter
ALTER TABLE box_amenities RENAME TO stallplass_fasiliteter;

-- Rename stable_amenities to stall_fasiliteter  
ALTER TABLE stable_amenities RENAME TO stall_fasiliteter;

-- Rename box_amenity_links to stallplass_fasilitet_lenker
ALTER TABLE box_amenity_links RENAME TO stallplass_fasilitet_lenker;

-- Rename stable_amenity_links to stall_fasilitet_lenker
ALTER TABLE stable_amenity_links RENAME TO stall_fasilitet_lenker;

-- Rename stable_faqs to stall_ofte_spurte_sporsmal
ALTER TABLE stable_faqs RENAME TO stall_ofte_spurte_sporsmal;

-- 2. Update column names in staller table
ALTER TABLE staller RENAME COLUMN owner_id TO eier_id;
ALTER TABLE staller RENAME COLUMN owner_name TO eier_navn;
ALTER TABLE staller RENAME COLUMN review_count TO antall_anmeldelser;
ALTER TABLE staller RENAME COLUMN total_boxes TO antall_stallplasser;
ALTER TABLE staller RENAME COLUMN image_descriptions TO bilde_beskrivelser;
ALTER TABLE staller RENAME COLUMN advertising_active TO reklame_aktiv;
ALTER TABLE staller RENAME COLUMN advertising_start_date TO reklame_start_dato;
ALTER TABLE staller RENAME COLUMN advertising_end_date TO reklame_slutt_dato;
ALTER TABLE staller RENAME COLUMN created_at TO opprettet_dato;
ALTER TABLE staller RENAME COLUMN updated_at TO oppdatert_dato;

-- 3. Update column names in stallplasser table
ALTER TABLE stallplasser RENAME COLUMN stable_id TO stall_id;
ALTER TABLE stallplasser RENAME COLUMN price TO maanedlig_pris;
ALTER TABLE stallplasser RENAME COLUMN is_available TO er_tilgjengelig;
ALTER TABLE stallplasser RENAME COLUMN is_active TO er_aktiv;
ALTER TABLE stallplasser RENAME COLUMN is_indoor TO er_innendors;
ALTER TABLE stallplasser RENAME COLUMN has_window TO har_vindu;
ALTER TABLE stallplasser RENAME COLUMN has_electricity TO har_strom;
ALTER TABLE stallplasser RENAME COLUMN has_water TO har_vann;
ALTER TABLE stallplasser RENAME COLUMN max_horse_size TO maks_hest_storrelse;
ALTER TABLE stallplasser RENAME COLUMN is_sponsored TO er_sponset;
ALTER TABLE stallplasser RENAME COLUMN sponsored_until TO sponset_til;
ALTER TABLE stallplasser RENAME COLUMN sponsored_start_date TO sponset_start_dato;
ALTER TABLE stallplasser RENAME COLUMN image_descriptions TO bilde_beskrivelser;
ALTER TABLE stallplasser RENAME COLUMN special_notes TO spesielle_notater;
ALTER TABLE stallplasser RENAME COLUMN box_type TO stallplass_type;
ALTER TABLE stallplasser RENAME COLUMN created_at TO opprettet_dato;
ALTER TABLE stallplasser RENAME COLUMN updated_at TO oppdatert_dato;

-- 4. Update column names in utleie table
ALTER TABLE utleie RENAME COLUMN box_id TO stallplass_id;
ALTER TABLE utleie RENAME COLUMN stable_id TO stall_id;
ALTER TABLE utleie RENAME COLUMN rider_id TO leietaker_id;
ALTER TABLE utleie RENAME COLUMN conversation_id TO samtale_id;
ALTER TABLE utleie RENAME COLUMN start_date TO start_dato;
ALTER TABLE utleie RENAME COLUMN end_date TO slutt_dato;
ALTER TABLE utleie RENAME COLUMN monthly_price TO maanedlig_pris;
ALTER TABLE utleie RENAME COLUMN created_at TO opprettet_dato;
ALTER TABLE utleie RENAME COLUMN updated_at TO oppdatert_dato;

-- 5. Update column names in betalinger table  
ALTER TABLE betalinger RENAME COLUMN user_id TO bruker_id;
ALTER TABLE betalinger RENAME COLUMN stable_id TO stall_id;
ALTER TABLE betalinger RENAME COLUMN total_amount TO total_belop;
ALTER TABLE betalinger RENAME COLUMN payment_method TO betalingsmetode;
ALTER TABLE betalinger RENAME COLUMN vipps_order_id TO vipps_ordre_id;
ALTER TABLE betalinger RENAME COLUMN vipps_reference TO vipps_referanse;
ALTER TABLE betalinger RENAME COLUMN paid_at TO betalt_dato;
ALTER TABLE betalinger RENAME COLUMN failed_at TO feilet_dato;
ALTER TABLE betalinger RENAME COLUMN failure_reason TO feil_arsak;
ALTER TABLE betalinger RENAME COLUMN created_at TO opprettet_dato;
ALTER TABLE betalinger RENAME COLUMN updated_at TO oppdatert_dato;

-- 6. Update column names in samtaler table
ALTER TABLE samtaler RENAME COLUMN rider_id TO leietaker_id;
ALTER TABLE samtaler RENAME COLUMN stable_id TO stall_id;
ALTER TABLE samtaler RENAME COLUMN box_id TO stallplass_id;
ALTER TABLE samtaler RENAME COLUMN created_at TO opprettet_dato;
ALTER TABLE samtaler RENAME COLUMN updated_at TO oppdatert_dato;

-- 7. Update column names in meldinger table
ALTER TABLE meldinger RENAME COLUMN conversation_id TO samtale_id;
ALTER TABLE meldinger RENAME COLUMN sender_id TO avsender_id;
ALTER TABLE meldinger RENAME COLUMN message_type TO melding_type;
ALTER TABLE meldinger RENAME COLUMN is_read TO er_lest;
ALTER TABLE meldinger RENAME COLUMN created_at TO opprettet_dato;

-- 8. Update column names in anmeldelser table
ALTER TABLE anmeldelser RENAME COLUMN rental_id TO utleie_id;
ALTER TABLE anmeldelser RENAME COLUMN reviewer_id TO anmelder_id;
ALTER TABLE anmeldelser RENAME COLUMN reviewee_id TO anmeldt_id;
ALTER TABLE anmeldelser RENAME COLUMN reviewee_type TO anmeldt_type;
ALTER TABLE anmeldelser RENAME COLUMN stable_id TO stall_id;
ALTER TABLE anmeldelser RENAME COLUMN communication_rating TO kommunikasjon_vurdering;
ALTER TABLE anmeldelser RENAME COLUMN cleanliness_rating TO renslighet_vurdering;
ALTER TABLE anmeldelser RENAME COLUMN facilities_rating TO fasiliteter_vurdering;
ALTER TABLE anmeldelser RENAME COLUMN reliability_rating TO palitelighet_vurdering;
ALTER TABLE anmeldelser RENAME COLUMN is_public TO er_offentlig;
ALTER TABLE anmeldelser RENAME COLUMN is_moderated TO er_moderert;
ALTER TABLE anmeldelser RENAME COLUMN moderator_notes TO moderator_notater;
ALTER TABLE anmeldelser RENAME COLUMN created_at TO opprettet_dato;
ALTER TABLE anmeldelser RENAME COLUMN updated_at TO oppdatert_dato;

-- 9. Update column names in brukere table
ALTER TABLE brukere RENAME COLUMN is_admin TO er_admin;
ALTER TABLE brukere RENAME COLUMN created_at TO opprettet_dato;
ALTER TABLE brukere RENAME COLUMN updated_at TO oppdatert_dato;

-- 10. Update amenity tables
ALTER TABLE stallplass_fasiliteter RENAME COLUMN created_at TO opprettet_dato;
ALTER TABLE stallplass_fasiliteter RENAME COLUMN updated_at TO oppdatert_dato;

ALTER TABLE stall_fasiliteter RENAME COLUMN created_at TO opprettet_dato;
ALTER TABLE stall_fasiliteter RENAME COLUMN updated_at TO oppdatert_dato;

-- 11. Update link tables  
ALTER TABLE stallplass_fasilitet_lenker RENAME COLUMN box_id TO stallplass_id;
ALTER TABLE stallplass_fasilitet_lenker RENAME COLUMN amenity_id TO fasilitet_id;
ALTER TABLE stallplass_fasilitet_lenker RENAME COLUMN created_at TO opprettet_dato;

ALTER TABLE stall_fasilitet_lenker RENAME COLUMN stable_id TO stall_id;
ALTER TABLE stall_fasilitet_lenker RENAME COLUMN amenity_id TO fasilitet_id;
ALTER TABLE stall_fasilitet_lenker RENAME COLUMN created_at TO opprettet_dato;

-- 12. Update FAQ table
ALTER TABLE stall_ofte_spurte_sporsmal RENAME COLUMN stable_id TO stall_id;
ALTER TABLE stall_ofte_spurte_sporsmal RENAME COLUMN question TO sporsmal;
ALTER TABLE stall_ofte_spurte_sporsmal RENAME COLUMN answer TO svar;
ALTER TABLE stall_ofte_spurte_sporsmal RENAME COLUMN created_at TO opprettet_dato;

-- 13. Update any indexes to use new names (if needed)
-- PostgreSQL automatically renames indexes when tables are renamed

-- 14. Update page_views table
ALTER TABLE page_views RENAME COLUMN viewer_id TO seer_id;
ALTER TABLE page_views RENAME COLUMN entity_type TO entitet_type;
ALTER TABLE page_views RENAME COLUMN entity_id TO entitet_id;
ALTER TABLE page_views RENAME COLUMN ip_address TO ip_adresse;
ALTER TABLE page_views RENAME COLUMN user_agent TO bruker_agent;
ALTER TABLE page_views RENAME COLUMN created_at TO opprettet_dato;

-- 15. Update pricing tables
ALTER TABLE base_prices RENAME COLUMN price TO grunnpris;
ALTER TABLE base_prices RENAME COLUMN is_active TO er_aktiv;
ALTER TABLE base_prices RENAME COLUMN created_at TO opprettet_dato;
ALTER TABLE base_prices RENAME COLUMN updated_at TO oppdatert_dato;

ALTER TABLE pricing_discounts RENAME COLUMN percentage TO rabatt_prosent;
ALTER TABLE pricing_discounts RENAME COLUMN months TO maaneder;
ALTER TABLE pricing_discounts RENAME COLUMN is_active TO er_aktiv;
ALTER TABLE pricing_discounts RENAME COLUMN created_at TO opprettet_dato;
ALTER TABLE pricing_discounts RENAME COLUMN updated_at TO oppdatert_dato;

-- 16. Update roadmap_items table  
ALTER TABLE roadmap_items RENAME COLUMN created_at TO opprettet_dato;
ALTER TABLE roadmap_items RENAME COLUMN updated_at TO oppdatert_dato;
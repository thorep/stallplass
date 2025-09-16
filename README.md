# Stallplass

## PostHog Events

Følgende hendelser logges til PostHog. Når eventer sendes via `usePostHogEvents`, legges disse feltene automatisk til når bruker er innlogget: `timestamp`, `user_id`, `user_email`.

- Autentisering
  - `user_signed_up`
    - Properties: `method?`, `source?`, `email_consent?`

- Annonser (opprettelse)
  - `stable_created`
    - Properties: `stable_id?`, `location?`
  - `box_created`
    - Properties: `box_id?`, `stable_id?`, `price?`
  - `service_created`
    - Properties: `service_id?`, `service_type?`, `location?`
  - `horse_sale_created`
    - Properties: `horse_sale_id?`, `price?`, `breed_id?`, `discipline_id?`, `size?`
  - `horse_buy_created`
    - Properties: `horse_buy_id?`, `price_min?`, `price_max?`, `age_min?`, `age_max?`, `breed_id?`, `discipline_id?`
  - `part_loan_horse_created`
    - Properties: `part_loan_horse_id?`, `county_id?`, `municipality_id?`

- Annonser (redigert/lagret)
  - `stable_updated`
    - Properties: `stable_id`
  - `box_updated`
    - Properties: `box_id`
  - `service_updated`
    - Properties: `service_id`
  - `horse_sale_updated`
    - Properties: `horse_sale_id`
  - `horse_buy_updated`
    - Properties: `horse_buy_id`
  - `part_loan_horse_updated`
    - Properties: `part_loan_horse_id`

- Forum
  - `forum_reply_posted`
    - Properties: `thread_id?`, `category?`, `reply_length?`

- Søk
  - `search_result_clicked`
    - Properties (påkrevd): `result_type` = `stable|box|service|forhest|horse_sale|horse_buy`, `result_id`
    - Properties (valgfri): `search_query?`, `position?`
  - `search_pagination_clicked`
    - Properties: `action` = `next|prev|number`, `from_page`, `to_page`, `mode` = `stables|boxes|services|forhest|horse_sales`, `horse_trade?` = `sell|buy`, `page_size?`, `total_pages?`, `total_results?`, `sort_by?`

- Feature flags/nyhetsbanner
  - `news_banner_dismissed`
    - Properties: `banner_title?`, `banner_content?`

- Visningssporing (feil)
  - `view_tracking_failed`
    - Properties: `entityType`, `entityId`, `message`

- Mine hester
  - `horse_log_added` (server)
    - Properties: `horse_id`, `category_id`, `images_count`, `has_images`, `timestamp`

- Feilhåndtering
  - `captureException` (PostHog-metode for exceptions – brukes både klient og server)
    - Typiske properties: `source`, `digest` (React errors), `context`, `route`, `http_method`, samt tilleggsdata per call

Mer detaljer (inkl. teknisk implementasjon og hooks): se `posthog-events.md`.

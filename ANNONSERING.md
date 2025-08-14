# Annonsesystem for Stallplass.no

Dette dokumentet beskriver det fullstendige annonsesystemet for Stallplass.no som lar administratorer administrere kunders annonser med forskjellige prisnivåer og spore ytelse.

## Oversikt

Annonsesystemet består av tre prisnivåer der annonser vises strategisk plassert mellom søkeresultatene:
- **Premium (Tier 1)**: 999 kr/måned - Blant de 15 øverste resultatene
- **Standard (Tier 2)**: 599 kr/måned - Blant de 40 øverste resultatene  
- **Grunnleggende (Tier 3)**: 399 kr/måned - Under de 40 første resultatene

## Database Schema

### Hovedmodeller

#### `ad_customers` - Annonsekunder
```prisma
model ad_customers {
  id            String   @id @default(dbgenerated("gen_random_uuid()"))
  name          String
  email         String
  phone         String?
  company       String?
  contactPerson String?
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime? // Soft delete support
}
```

#### `advertisements` - Annonser
```prisma
model advertisements {
  id          String   @id @default(dbgenerated("gen_random_uuid()"))
  customerId  String
  title       String
  description String?
  imageUrl    String   // Bildebanner (16:9 format anbefalt)
  linkUrl     String   // Hvor annonsen skal lenke til
  tier        Int      // 1, 2, eller 3
  status      AdStatus @default(ACTIVE)
  startDate   DateTime @default(now())
  endDate     DateTime? // Valgfri sluttdato
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
}
```

#### `ad_analytics` - Annonse statistikk
```prisma
model ad_analytics {
  id             String    @id
  advertisementId String
  eventType      AdEvent   // VIEW eller CLICK
  timestamp      DateTime  @default(now())
  ipAddress      String?
  userAgent      String?
  referer        String?
  userId         String?   // Hvis bruker er logget inn
}
```

#### `ad_placements` - Annonseplasseringer
```prisma
model ad_placements {
  id             String   @id
  advertisementId String
  searchQuery    String?  // Hvilket søk som resulterte i plasseringen
  position       Int      // Posisjon i søkeresultatene
  timestamp      DateTime @default(now())
}
```

### Enums
- `AdStatus`: ACTIVE, PAUSED, EXPIRED, DRAFT
- `AdEvent`: VIEW, CLICK

## Arkitektur

### Service Layer (`advertisement-service.ts`)
Håndterer all forretningslogikk:

#### Kunde administrasjon
- `createAdCustomer()` - Opprett ny annonsekunde
- `getAdCustomers()` - Hent alle kunder
- `updateAdCustomer()` - Oppdater kundeinformasjon
- `deleteAdCustomer()` - Slett kunde (soft delete)

#### Annonsehåndtering
- `createAdvertisement()` - Opprett ny annonse
- `getAdvertisements()` - Hent annonser med filtrering
- `updateAdvertisement()` - Oppdater annonse
- `deleteAdvertisement()` - Slett annonse

#### Statistikk og sporing
- `recordAdView()` - Logg annonsevisning
- `recordAdClick()` - Logg annonseklikk
- `recordAdPlacement()` - Logg annonseplassering

#### Søkeintegrasjon
- `getActiveAdsForSearchResults()` - Hent aktive annonser for søkeresultater
  - Respekterer tier-baserte posisjoner
  - Tilfeldig rotasjon innen hver tier
  - Automatisk plasseringssporing

#### Ytelsesrapportering
- `getAdAnalytics()` - Detaljert statistikk per annonse
- `getPerformanceMetrics()` - Systemomfattende ytelse

### API Endpoints

#### Admin endpoints
- `GET/POST /api/admin/advertisements` - Liste/opprett annonser
- `GET/PUT/DELETE /api/admin/advertisements/[id]` - Administrer enkeltannonse
- `GET/POST /api/admin/ad-customers` - Liste/opprett kunder
- `GET/PUT/DELETE /api/admin/ad-customers/[id]` - Administrer enkeltkunde
- `GET /api/admin/ad-analytics` - Systemstatistikk
- `GET /api/admin/ad-analytics/[id]` - Annonsestatistikk

#### Offentlige endpoints
- `POST /api/advertisements/track` - Spor klikk og visninger
- `GET /api/advertisements/active` - Hent aktive annonser

### Admin Interface

#### Ny fane i AdminDashboard: "Annonser"
Legges til i navigasjonen med undermenyer:

```typescript
case "advertisements":
  return [
    { id: "ads-overview", label: "Annonse Oversikt", icon: RocketLaunchIcon },
    { id: "ads-customers", label: "Kunder", icon: UsersIcon },
    { id: "ads-analytics", label: "Statistikk", icon: ChartBarIcon },
  ];
```

#### Komponenter
- `AdvertisementsAdmin.tsx` - Hovedadministrasjon
- `AdCustomersAdmin.tsx` - Kundeadministrasjon  
- `AdAnalyticsAdmin.tsx` - Statistikkoversikt
- `CreateAdModal.tsx` - Modal for å lage annonser
- `EditAdModal.tsx` - Modal for å redigere annonser

### Søkeresultat Integrasjon

#### Annonseplassering Logic
```typescript
// Tier 1 (Premium): Posisjon 1-15
// Tier 2 (Standard): Posisjon 1-40
// Tier 3 (Basic): Posisjon 41+

const getAdPosition = (tier: number, totalResults: number) => {
  switch(tier) {
    case 1: return Math.floor(Math.random() * Math.min(15, totalResults)) + 1;
    case 2: return Math.floor(Math.random() * Math.min(40, totalResults)) + 1;
    case 3: return Math.max(41, Math.floor(Math.random() * totalResults) + 1);
  }
}
```

#### Komponenter
- `SearchResultAd.tsx` - Viser annonse i søkeresultater
- `AdPlaceholder.tsx` - Grå placeholder når ingen annonser er tilgjengelige

#### Integrasjon i SearchPageClientSimple
Annonser injiseres mellom søkeresultatene basert på:
- Annonsens tier-niveau
- Tilfeldig posisjonering innen tier-grenser
- Automatisk sporing av visninger og plasseringer

### Bildehåndtering

#### Krav til annonsebilde
- **Format**: 16:9 forhold anbefalt (f.eks. 800x450px)
- **Filstørrelse**: Maksimalt 2MB
- **Formater**: JPG, PNG, WebP
- **Lagring**: Supabase Storage i eksisterende bucket-struktur

#### Upload prosess
```typescript
// Bruker eksisterende /api/upload endpoint
const uploadAdImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'advertisement'); // Ny type
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};
```

### Statistikk og Rapportering

#### Sporede Metrics
- **Visninger (Impressions)**: Hver gang en annonse vises i søkeresultater
- **Klikk**: Hver gang noen klikker på en annonse
- **CTR (Click-Through Rate)**: Klikk / Visninger * 100
- **Posisjonssporing**: Hvor i søkeresultatene annonsen vises

#### Tidsbaserte Data
- Daglige tall
- Ukentlige sammendrag  
- Månedlige rapporter
- Tier-sammenligning

#### Rapporter
- Annonse ytelse per kunde
- Tier-sammenligning (hvilken tier presterer best)
- Top presterende annonser
- Systemomfattende statistikk

### Sikkerhet og Tillatelser

#### Autentisering
- Alle admin-endpoints krever admin-tillatelser
- Bruker eksisterende `requireAuth()` pattern
- Sporingsendepunkter er offentlige men logger metadata

#### Validering
- Inndata valideres i service layer
- Bildeopplasting følger eksisterende sikkerhetstiltak
- SQL injection beskyttelse via Prisma

### Deployment

#### Database Migrasjoner
```bash
# Etter schema endringer
npm run prisma:migrate:dev
npm run prisma:generate
```

#### Environment Variabler
Bruker eksisterende Supabase konfiguration:
- `DATABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`

### Overvåking og Vedlikehold

#### Automatiske Prosesser
- `checkAdvertisementExpiry()` - Kontrollerer og oppdaterer utløpte annonser
- Automatisk arkivering av gamle analytics data
- Regelmessig cache invalidering

#### Logging
- Detaljert logging av alle annonseoperasjoner
- Error tracking for mislykkede visninger/klikk
- Performance monitoring

## Bruksscenarioer

### Scenario 1: Ny Annonsekunde
1. Admin åpner admin dashboard → Annonser → Kunder
2. Klikker "Legg til kunde" 
3. Fyller ut kontaktinformasjon
4. Oppretter første annonse for kunden
5. Laster opp bilde og setter tier
6. Annonsen går live og begynner å vises i søkeresultater

### Scenario 2: Ytelsesanalyse
1. Admin åpner Annonser → Statistikk
2. Ser oversikt over alle aktive annonser
3. Sammenligner ytelse mellom tiers
4. Identifiserer top-presterende annonser
5. Eksporterer rapport for kunde

### Scenario 3: Søkeresultat med Annonser
1. Bruker søker etter stallplasser
2. System henter aktive annonser basert på tier
3. Annonser plasseres tilfeldig innen tier-grenser
4. Visning logges automatisk
5. Ved klikk logges klikk-event og bruker redirectes

## Fremtidige Utvidelser

### Fase 2 Funksjoner
- Geografisk targeting av annonser
- A/B testing av annonseinnhold
- Automatisk budgiving system
- Integrert faktureringssystem
- Annonse scheduler for fremtidige kampanjer

### Fase 3 Funksjoner  
- Selvbetjening portal for kunder
- Avanserte targeting alternativer
- Video annonser
- Mobil app integrasjon

## Support og Dokumentasjon

- Teknisk dokumentasjon i kodekommentarer
- Admin brukerguide (lages separat)
- Kunde guide for annonseformater
- API dokumentasjon via Swagger/OpenAPI
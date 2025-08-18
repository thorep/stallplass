# PostHog Events - Stallplass

Dette dokumentet lister opp alle PostHog events som sendes fra Stallplass-appen.

## Oversikt over Event-kategorier

### 1. Brukerregistrering og autentisering
### 2. Annonse-opprettelse (staller, bokser, tjenester)
### 3. Forum-aktivitet
### 4. Søkeinteraksjoner
### 5. Feilhåndtering

---

## Detaljert EventListe

### 1. Brukerregistrering og autentisering

#### `user_signed_up`
**Beskrivelse:** Spores når en ny bruker registrerer seg på plattformen

**Properties:**
- `method` (string, optional): Registreringsmetode (f.eks. "email")
- `source` (string, optional): Kilde for registrering
- `email_consent` (boolean): Om brukeren har samtykket til e-post

**Sendes fra:**
- `src/lib/supabase-auth-context.tsx:141`

**Trigger:** Når bruker fullfører registrering

---

### 2. Annonse-opprettelse

#### `stable_created`
**Beskrivelse:** Spores når en stal-annonse opprettes

**Properties:**
- `stable_id` (string, optional): ID til den opprettede stallen
- `location` (string, optional): Lokasjon for stallen

**Sendes fra:**
- `src/hooks/useStableMutations.ts:61`

**Trigger:** Etter vellykket opprettelse av stal

#### `box_created`
**Beskrivelse:** Spores når en stallboks-annonse opprettes

**Properties:**
- `box_id` (string, optional): ID til den opprettede boksen
- `stable_id` (string, optional): ID til stallen boksen tilhører
- `price` (number, optional): Pris for boksen

**Sendes fra:**
- `src/hooks/useBoxMutations.ts:94`

**Trigger:** Etter vellykket opprettelse av stallboks

#### `service_created`
**Beskrivelse:** Spores når en tjeneste-annonse opprettes

**Properties:**
- `service_id` (string, optional): ID til den opprettede tjenesten
- `service_type` (string, optional): Type tjeneste
- `location` (string, optional): Lokasjon for tjenesten

**Sendes fra:**
- `src/hooks/useServiceMutations.ts:111`

**Trigger:** Etter vellykket opprettelse av tjeneste

---

### 3. Forum-aktivitet

#### `forum_reply_posted`
**Beskrivelse:** Spores når en bruker poster et svar i forumet

**Properties:**
- `thread_id` (string, optional): ID til forum-tråden
- `category` (string, optional): Kategori for forum-tråden
- `reply_length` (number, optional): Lengde på svaret i karakterer

**Sendes fra:**
- `src/hooks/useForum.ts:298`

**Trigger:** Etter vellykket posting av forum-svar

---

### 4. Søkeinteraksjoner

#### `search_result_clicked`
**Beskrivelse:** Spores når en bruker klikker på et søkeresultat

**Properties (required):**
- `result_type`: 'stable' | 'box' | 'service' | 'forhest' | 'horse_sale'
- `result_id` (string): ID til det klikkede resultatet

**Properties (optional):**
- `search_query` (string): Søketermer som ble brukt
- `position` (number): Posisjon av resultatet i søkelisten

**Sendes fra:**
- `src/components/organisms/SearchPageClientSimple.tsx:611` (stable clicks)
- `src/components/organisms/SearchPageClientSimple.tsx:619` (box clicks)
- `src/components/organisms/SearchPageClientSimple.tsx:627` (service clicks)
- `src/components/organisms/SearchPageClientSimple.tsx:635` (part-loan horse clicks)
- `src/components/organisms/SearchPageClientSimple.tsx:643` (horse sale clicks)

**Trigger:** Når bruker klikker på søkeresultat på søkesiden

---

### 5. Feilhåndtering

#### Exception Tracking
**Event Type:** `captureException` (PostHog metode)

**Beskrivelse:** Sporer feil som oppstår i applikasjonen

**Sendes fra:**
- `src/hooks/useErrorTracking.ts:21` - Manuell feilsporing
- `src/app/global-error.tsx:18` - Globale feil
- `src/app/error.tsx:20` - React error boundary feil
- `src/app/api/conversations/[id]/messages/route.ts:404` - API-feil i meldingssystem

**Properties varierer basert på context:**
- `source`: Hvor feilen oppstod
- `component`: Hvilken komponent som feilet
- `digest`: Feil-digest (for React errors)
- `context`: Kontekst for feilen

---

## Teknisk Implementering

### Hooks og Utilities

#### `usePostHogEvents` Hook
**Lokasjon:** `src/hooks/usePostHogEvents.ts`

Gir tilgang til alle event-funksjoner gjennom:
```typescript
const { 
  userSignedUp, 
  stableCreated, 
  boxCreated, 
  serviceCreated, 
  forumReplyPosted, 
  searchResultClicked,
  custom 
} = usePostHogEvents();
```

#### `useErrorTracking` Hook
**Lokasjon:** `src/hooks/useErrorTracking.ts`

For manuell feilsporing:
```typescript
const { trackError } = useErrorTracking();
```

### Server-side PostHog
**Lokasjon:** `src/lib/posthog-server.ts`

Brukes for server-side event tracking, primært for feilhåndtering i API-ruter.

---

## Event Properties Standard

Alle events inkluderer automatisk følgende properties fra `usePostHogEvents`:

- `user_id`: Brukerens ID (hvis innlogget)
- `user_email`: Brukerens e-post (hvis innlogget)
- `timestamp`: Når eventet ble sendt
- **Plus eventspesifikke properties listet ovenfor**

---

## Notater

- Events sendes kun når PostHog er konfigurert og tilgjengelig
- Alle event-kall er wrappet i null-sjekker for PostHog-instansen
- Server-side events bruker egen PostHog-instans med service role nøkkel
- Feilsporing skjer automatisk gjennom error boundaries og exception handlers
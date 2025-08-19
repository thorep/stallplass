# Skjemastandard: TanStack Form + Zod + feltkomponenter

Mål: ensartet design, god mobil‑UX, tydelig validering, og rask utvikling på tvers av skjema.

## Arkitektur og prinsipper
- State/submit: TanStack Form (`@tanstack/react-form`).
- Validering: Zod, koblet til felter via små validator‑helpers (uten adaptere).
- Gjenbrukbare felt:
  - `InputField`, `TextAreaField`, `SelectField`
  - `AddressSearchField`: setter `address`, `postalCode`, `poststed`, `fylke`, `municipality`, `kommuneNumber`, `coordinates`.
  - `ImageUploadField`: valgt/opplastet bilder, inline‑feil for «minst ett bilde».
- API‑feil (400) merges inn per felt (samme styling som lokal feil).
- Design: behold eksisterende Tailwind‑klasser; ingen visuell endring ved migrering.

## Valideringsregler (oppsummering)
- Inline‑feil under felt (rød border + rød tekst).
- Adresse:
  - «Adresse er påkrevd».
  - Create: krever valg fra søkeresultat (må ha `kommuneNumber`).
  - Edit: krever kun innhold (ikke tvunget ny seleksjon).
- Bilder: minst 1 bilde må være valgt (staged eller opplastet).
- Tall i UI som string → cast til number i submit.

## Komponenter og bruksområde
- Se detaljert API i `src/components/forms/README.md`.
- Komponenter ligger i `src/components/forms/*`.
- Små helpers for validering: `src/lib/validation/utils.ts`.

## Migreringssjekkliste (legacy → standard)
1. Bytt lokal state til `useForm` med `defaultValues` fra eksisterende data.
2. Flytt valideringsregler til Zod (per felt), bruk `zodValidators` der det passer.
3. Erstatt rå inputs med `InputField`, `TextAreaField`, `SelectField`.
4. Erstatt adresseblokken med `AddressSearchField` (kobler alle felt + regler).
5. Erstatt bildefelt med `ImageUploadField`; bruk `uploadPendingImages()` ved submit.
6. Mapp string→number ved submit (price/age/height etc.).
7. Merge API‑feil (`{ field, message }`) inn i feltene.
8. Behold CSS‑klasser; ingen visuell forskjell.
9. Test create/edit, spesielt adressevalg og bildekrav (mobil først).

## Submit‑mapping (typisk eksempel)
```ts
const imageUrls = (await imageRef.current?.uploadPendingImages()) || values.images;
const payload = {
  name: values.name.trim(),
  description: values.description.trim(),
  price: parseInt(values.price, 10),
  age: parseInt(values.age, 10),
  height: values.height ? parseInt(values.height, 10) : undefined,
  address: values.address || undefined,
  postalCode: values.postalCode || undefined,
  postalPlace: values.poststed || undefined,
  latitude: values.coordinates.lat || undefined,
  longitude: values.coordinates.lon || undefined,
  kommuneNumber: values.kommuneNumber,
  contactName: values.contactName.trim(),
  contactEmail: values.contactEmail?.trim(),
  contactPhone: values.contactPhone?.trim() || undefined,
  images: imageUrls,
  imageDescriptions: values.imageDescriptions,
};
```

## Mal for nye skjema
- Se `docs/forms-template.md` for en kopier‑og‑lim‑mal som viser oppsett av `useForm`, feltkomponenter, zod‑validators, og submit‑mapping.


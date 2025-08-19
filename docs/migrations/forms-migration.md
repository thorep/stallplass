# Migrering til TanStack Form + Zod + feltkomponenter

Denne guiden viser steg for steg hvordan et eksisterende (legacy) skjema migreres.

## Sjekkliste
1. Installer avhengigheter (hvis mangler): `@tanstack/react-form`, `zod`.
2. Opprett `useForm` i komponenten og sett `defaultValues` fra eksisterende data/props.
3. Definer Zod‑validering per felt (f.eks. `name`, `description`, `price`, ...).
4. Bytt rå inputs/textarea/select til `InputField`, `TextAreaField`, `SelectField`.
5. Bytt adresseblokk til `AddressSearchField` (kobler address/kommuneNumber/coordinates).
6. Bytt bilder til `ImageUploadField` + `uploadPendingImages()` i submit.
7. I submit: cast tall fra string → number, trim strings, sett `undefined` for tomme valg.
8. Merge API (400) valideringsdetaljer `{ field, message }` inn som `apiError` per felt.
9. Test create + edit på mobil (adressevalg og bildekrav er kritiske).

## Før/etter (omriss)

Før:
```tsx
const [formData, setFormData] = useState({ name: '', ... });
<input value={formData.name} onChange={...} />
<textarea value={formData.description} onChange={...} />
<AddressSearch onAddressSelect={...} />
<UnifiedImageUpload images={formData.images} onChange={...} />
// submit: fetch(...formData)
```

Etter:
```tsx
const form = useForm({ defaultValues, onSubmit: async ({ value }) => { /* map + submit */ } });
<InputField form={form} name="name" label="Overskrift" required schema={nameSchema} apiError={getApiError('name')} />
<TextAreaField form={form} name="description" label="Beskrivelse" required schema={descSchema} />
<AddressSearchField form={form} mode={mode} nameAddress="address" nameKommuneNumber="kommuneNumber" nameCoordinates="coordinates" namePostalCode="postalCode" namePostalPlace="poststed" nameCountyName="fylke" nameMunicipalityName="municipality" />
<ImageUploadField ref={imageRef} images={form.state.values.images} onImagesChange={(urls)=>form.setFieldValue('images', urls)} onDescriptionsChange={(desc)=>form.setFieldValue('imageDescriptions', Object.values(desc))} initialDescriptions={initialDesc} entityType="horse-sale" required />
```

## Vanlige fallgruver
- Adresse i create krever valgt resultat (dvs. `kommuneNumber` må settes).
- «Minst ett bilde»: bruk `ImageUploadField` (teller staged + uploaded) — ikke bare `images.length`.
- Husk å caste `price/age/height` fra string til number i submit.
- API‑feil må mates inn på feltet («apiError») for konsistent styling.


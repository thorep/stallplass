# Feltkomponenter for skjema

Disse komponentene standardiserer markup, styling og feltfeil. De fungerer med TanStack Form og Zod uten adaptere.

## Hjelpere
- `src/lib/validation/utils.ts`
  - `firstError(schema, value)` → første Zod‑feiltekst eller undefined
  - `zodValidators(schema)` → `{ onChange, onBlur }` til `form.Field`

## InputField
- Props: `form, name, label, type?, placeholder?, required?, schema?, apiError?, inputProps?`
- Eksempel:
```tsx
<InputField
  form={form}
  name="price"
  label="Pris (NOK)"
  type="number"
  placeholder="0"
  required
  schema={z.string().regex(/^\d+$/, 'Pris må være et heltall')}
  apiError={getApiFieldError('price')}
  inputProps={{ min: 0 }}
/>
```

## TextAreaField
- Props: `form, name, label, rows?, placeholder?, required?, schema?, apiError?`
- Eksempel:
```tsx
<TextAreaField
  form={form}
  name="description"
  label="Beskrivelse"
  placeholder="Beskriv ..."
  rows={6}
  required
  schema={z.string().min(1, 'Beskrivelse er påkrevd')}
  apiError={getApiFieldError('description')}
/>
```

## SelectField
- Props: `form, name, label, options, placeholderOption?, required?, schema?, apiError?`
- Eksempel:
```tsx
<SelectField
  form={form}
  name="breedId"
  label="Rase"
  required
  options={breeds.map(b => ({ value: b.id, label: b.name }))}
  placeholderOption={{ value: '', label: 'Velg rase' }}
  schema={z.string().min(1, 'Rase er påkrevd')}
  apiError={getApiFieldError('breedId')}
/>
```

## AddressSearchField
- Props:
  - `form, mode?, label?, placeholder?, nameAddress, namePostalCode, namePostalPlace, nameCountyName, nameMunicipalityName, nameKommuneNumber, nameCoordinates`
- Oppførsel:
  - Setter alle adressefelt ved valg fra søkekomponenten.
  - Validering: «Adresse er påkrevd». I create kreves også valg fra søkeresultat (dvs. `kommuneNumber`).
- Eksempel:
```tsx
<AddressSearchField
  form={form}
  mode={mode}
  label="Lokasjon"
  placeholder="Søk etter adresse"
  nameAddress="address"
  namePostalCode="postalCode"
  namePostalPlace="poststed"
  nameCountyName="fylke"
  nameMunicipalityName="municipality"
  nameKommuneNumber="kommuneNumber"
  nameCoordinates="coordinates"
/>
```

## ImageUploadField
- Props:
  - `images, onImagesChange, onDescriptionsChange, initialDescriptions, entityType, maxImages?, required?, mode?, onCountChange?, ref`
- Oppførsel:
  - Viser inline‑feil «Legg til minst ett bilde» når none valgt.
  - Bruk ref (`UnifiedImageUploadRef`) for `uploadPendingImages()` ved submit.
- Eksempel:
```tsx
<ImageUploadField
  ref={imageRef}
  images={form.state.values.images}
  onImagesChange={(images) => form.setFieldValue('images', images)}
  onDescriptionsChange={(desc) => form.setFieldValue('imageDescriptions', Object.values(desc))}
  initialDescriptions={initialDesc}
  entityType="horse-sale"
  required
  onCountChange={(count) => setSelectedImagesCount(count)}
/>
```

## Tips
- Preferer `onBlur`‑validering for tekstfelt (mobilvennlig).
- Merge API‑feil på feltet via `apiError`.
- Hold tall som string i UI, cast i submit.
- Ikke bruk global feilliste nederst; bruk inline + topp‑banner.


# Forms – Patterns and Usage

This codebase uses TanStack React Form v1 + Zod for validation and a small set of reusable, typed form fields. Follow these patterns to build reliable forms with minimal boilerplate.

## Building Blocks

- InputField: Text/number input with Zod schema and API error rendering.
- TextAreaField: Multiline input with Zod schema and API error rendering.
- SelectField: Simple select with Zod schema and API error rendering.
- AddressSearchField: Address autocomplete + field syncing; supports create/edit flows and sets kommuneNumber.
- ImageUploadField: Integrates with UnifiedImageUpload for selecting, describing, and uploading images.

All fields accept:
- `form`: TanStack Form instance (we intentionally keep this loosely typed to avoid the heavy generics of v1).
- `name`: Field path (e.g., `"name"`, `"address"`, `"coordinates.lat"`).
- `schema`: Optional Zod schema for the field; when provided the component wires `zodValidators` for `onChange`/`onBlur`.
- `apiError`: Optional server-side error message for this field.

## Validation

- Prefer Zod schemas per field. Pass the schema to the field component via `schema`.
- Use `firstError`/`zodValidators` utilities from `@/lib/validation/utils` for consistent error extraction.
- Server/API validation errors should be shaped as `{ field: string; message: string }[]`. Surface each on the matching field via `apiError`.

## Address Handling

Use `AddressSearchField` for address input. It:
- Wires the `AddressSearch` autocomplete and writes all address-related values to your form via `setFieldValue`.
- In create-mode, requires users to pick a result, not just type.
- Sets `kommuneNumber`, which the API uses to map to `countyId` and `municipalityId`.
- Uses `form.Subscribe` so the validation message updates immediately after selection.

Required props:
- `nameAddress`, `namePostalCode`, `namePostalPlace`, `nameCountyName`, `nameMunicipalityName`, `nameKommuneNumber`, `nameCoordinates`.

Example:

```
<AddressSearchField
  form={form}
  mode="create"
  label="Lokasjon"
  nameAddress="address"
  namePostalCode="postalCode"
  namePostalPlace="poststed"
  nameCountyName="fylke"
  nameMunicipalityName="municipality"
  nameKommuneNumber="kommuneNumber"
  nameCoordinates="coordinates"
/>
```

## Images

- Use `ImageUploadField` and call `await imageUploadRef.current?.uploadPendingImages()` before submitting.
- On submission error, best-effort cleanup via `StorageService.deleteImageByUrl` is recommended.

## Submit Pattern

```
const form = useForm({
  defaultValues,
  onSubmit: async ({ value }) => {
    const images = await imageUploadRef.current?.uploadPendingImages();
    const data = {
      ...value,
      price: parseInt(value.price, 10),
      age: parseInt(value.age, 10),
      height: value.height ? parseInt(value.height, 10) : undefined,
      kommuneNumber: value.kommuneNumber || undefined,
    };
    // call mutation
  },
});
```

## Notes on TypeScript

- TanStack Form v1 generics are extremely verbose. The field components intentionally relax typings to avoid friction and TS errors during development. Do not “tighten” these without validating against the v1 API.
- Keep Zod schemas as the source of truth for runtime validation and error messaging.

## Re-exports

Import fields via the forms barrel for cleaner imports:

```
import { InputField, TextAreaField, SelectField, AddressSearchField, ImageUploadField } from '@/components/forms';
```


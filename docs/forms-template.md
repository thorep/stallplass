# Mal for nye skjema (TanStack Form + Zod + feltkomponenter)

```tsx
"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import Button from "@/components/atoms/Button";
import { InputField } from "@/components/forms/InputField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { SelectField } from "@/components/forms/SelectField";
import { AddressSearchField } from "@/components/forms/AddressSearchField";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import { useRef } from "react";

// 1) Definer zod‑regler pr felt (enkelt per komponent/felt)
const validators = {
  name: z.string().min(2, "Navn må være minst 2 tegn").max(100),
  description: z.string().min(1, "Beskrivelse er påkrevd").max(2000),
  price: z.string().regex(/^\d+$/, "Pris må være heltall"),
};

// 2) Default values for skjemaet
const defaultValues = {
  name: "",
  description: "",
  price: "",
  address: "",
  postalCode: "",
  poststed: "",
  fylke: "",
  municipality: "",
  kommuneNumber: "",
  coordinates: { lat: 0, lon: 0 },
  images: [] as string[],
  imageDescriptions: [] as string[],
};

export default function ExampleForm() {
  const imageRef = useRef<UnifiedImageUploadRef>(null);

  const form = useForm<typeof defaultValues>({
    defaultValues,
    onSubmit: async ({ value }) => {
      // 3) Valider tverrsnittskrav (adresse/bilder/min 1 bilde o.l.)
      if (!value.address?.trim()) throw new Error("Adresse er påkrevd");

      // 4) Last opp pending bilder og map payload (string→number)
      const images = (await imageRef.current?.uploadPendingImages()) || value.images;
      const payload = {
        name: value.name.trim(),
        description: value.description.trim(),
        price: parseInt(value.price, 10),
        address: value.address || undefined,
        postalCode: value.postalCode || undefined,
        postalPlace: value.poststed || undefined,
        latitude: value.coordinates.lat || undefined,
        longitude: value.coordinates.lon || undefined,
        kommuneNumber: value.kommuneNumber,
        images,
        imageDescriptions: value.imageDescriptions,
      };

      // 5) Kall API
      await fetch("/api/example", { method: "POST", body: JSON.stringify(payload) });
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-6">
      <InputField form={form} name="name" label="Navn" required schema={validators.name} />
      <TextAreaField form={form} name="description" label="Beskrivelse" required schema={validators.description} />
      <InputField form={form} name="price" label="Pris (NOK)" type="number" required schema={validators.price} />

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

      <ImageUploadField
        ref={imageRef}
        images={form.state.values.images}
        onImagesChange={(images) => form.setFieldValue("images", images)}
        onDescriptionsChange={(desc) => form.setFieldValue("imageDescriptions", Object.values(desc))}
        initialDescriptions={{}}
        entityType="example"
        required
      />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline">Avbryt</Button>
        <Button type="submit" variant="primary">Lagre</Button>
      </div>
    </form>
  );
}
```


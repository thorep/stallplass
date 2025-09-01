"use client";

import { Button } from "@/components/ui/button";
import { InputField } from "@/components/forms/InputField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import { useHorseBreeds, useHorseDisciplines } from "@/hooks/useHorseSales";
import { useHorseBuyMutations } from "@/hooks/useHorseBuys";
import type { HorseBuy } from "@/hooks/useHorseBuys";
import type { User } from "@supabase/supabase-js";
import { useForm } from "@tanstack/react-form";
import { useMemo, useRef, useState } from "react";
import { z } from "zod";
import { StorageService } from "@/services/storage-service";
import ContactInfoNotice from "@/components/molecules/ContactInfoNotice";

interface HorseBuyFormProps {
  user: User;
  onSuccess?: () => void;
  horseBuy?: HorseBuy;
  mode?: 'create' | 'edit';
}

type FormValues = {
  name: string;
  description: string;
  priceMin: string;
  priceMax: string;
  ageMin: string;
  ageMax: string;
  gender: "ALLE" | "HOPPE" | "HINGST" | "VALLACH";
  heightMin: string;
  heightMax: string;
  breedId: string; // optional, empty string means all
  disciplineId: string; // optional, empty string means all
  images: string[];
  imageDescriptions: string[];
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

const fieldValidators = {
  name: z.string().min(2, "Overskrift må være minst 2 tegn").max(100, "Maks 100 tegn"),
  description: z.string().min(1, "Beskrivelse er påkrevd").max(2000, "Maks 2000 tegn"),
  priceMin: z.string().optional(),
  priceMax: z.string().optional(),
  ageMin: z.string().optional(),
  ageMax: z.string().optional(),
  heightMin: z.string().optional(),
  heightMax: z.string().optional(),
  contactName: z.string().min(2, "Kontaktperson er påkrevd").max(100, "Maks 100 tegn"),
  contactEmail: z.string().optional().refine((v) => !v || z.string().email().safeParse(v).success, "Ugyldig e-post"),
  contactPhone: z
    .string()
    .optional()
    .refine((v) => !v || /[\d\s+\-()]{8,}/.test(v), "Ugyldig telefonnummer"),
};

const genderOptions = [
  { value: "ALLE", label: "Alle" },
  { value: "HOPPE", label: "Hoppe" },
  { value: "HINGST", label: "Hingst" },
  { value: "VALLACH", label: "Vallach" },
];

export default function HorseBuyForm({ user, onSuccess, horseBuy, mode = 'create' }: HorseBuyFormProps) {
  const { data: breeds = [] } = useHorseBreeds();
  const { data: disciplines = [] } = useHorseDisciplines();
  const { createHorseBuy, updateHorseBuy } = useHorseBuyMutations();

  const [error, setError] = useState<string | null>(null);
  const imageUploadRef = useRef<UnifiedImageUploadRef>(null);

  const defaultValues: FormValues = useMemo(
    () => ({
      name: horseBuy?.name || "",
      description: horseBuy?.description || "",
      priceMin: horseBuy?.priceMin?.toString?.() || "",
      priceMax: horseBuy?.priceMax?.toString?.() || "",
      ageMin: horseBuy?.ageMin?.toString?.() || "",
      ageMax: horseBuy?.ageMax?.toString?.() || "",
      gender: (horseBuy?.gender || 'ALLE') as FormValues['gender'],
      heightMin: horseBuy?.heightMin?.toString?.() || "",
      heightMax: horseBuy?.heightMax?.toString?.() || "",
      breedId: horseBuy?.breedId || "",
      disciplineId: horseBuy?.disciplineId || "",
      images: horseBuy?.images || [],
      imageDescriptions: horseBuy?.imageDescriptions || [],
      contactName: horseBuy?.contactName || user?.user_metadata?.full_name || "",
      contactEmail: horseBuy?.contactEmail || user?.email || "",
      contactPhone: horseBuy?.contactPhone || "",
    }),
    [horseBuy, user]
  );

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setError(null);
      // Basic required checks
      if (!fieldValidators.name.safeParse(value.name).success) {
        setError("Vennligst fyll ut overskrift");
        return;
      }
      if (!fieldValidators.description.safeParse(value.description).success) {
        setError("Vennligst fyll ut beskrivelse");
        return;
      }
      if (!fieldValidators.contactName.safeParse(value.contactName).success) {
        setError("Vennligst fyll ut kontaktperson");
        return;
      }
      if (!fieldValidators.contactEmail.safeParse(value.contactEmail).success) {
        setError("Ugyldig e-postadresse");
        return;
      }
      if (!fieldValidators.contactPhone.safeParse(value.contactPhone).success) {
        setError("Ugyldig telefonnummer");
        return;
      }

      try {
        const imageUrls = (await imageUploadRef.current?.uploadPendingImages()) || value.images;
        const payload = {
          name: value.name.trim(),
          description: value.description.trim(),
          priceMin: value.priceMin ? parseInt(value.priceMin, 10) : undefined,
          priceMax: value.priceMax ? parseInt(value.priceMax, 10) : undefined,
          ageMin: value.ageMin ? parseInt(value.ageMin, 10) : undefined,
          ageMax: value.ageMax ? parseInt(value.ageMax, 10) : undefined,
          gender: value.gender === "ALLE" ? undefined : (value.gender as "HOPPE" | "HINGST" | "VALLACH"),
          heightMin: value.heightMin ? parseInt(value.heightMin, 10) : undefined,
          heightMax: value.heightMax ? parseInt(value.heightMax, 10) : undefined,
          breedId: value.breedId || undefined,
          disciplineId: value.disciplineId || undefined,
          contactName: value.contactName.trim(),
          contactEmail: value.contactEmail.trim() || undefined,
          contactPhone: value.contactPhone.trim() || undefined,
          images: imageUrls,
          imageDescriptions: value.imageDescriptions,
        };

        if (mode === 'edit' && horseBuy?.id) {
          await updateHorseBuy.mutateAsync({ id: horseBuy.id, data: payload });
        } else {
          await createHorseBuy.mutateAsync(payload);
        }
        onSuccess?.();
      } catch (err) {
        // cleanup
        try {
          for (const url of form.state.values.images) {
            await StorageService.deleteImageByUrl(url);
          }
        } catch {}
        const message =
          err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
            ? (err as { message: string }).message
            : "Det oppstod en feil. Prøv igjen senere.";
        setError(message);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
      data-cy="horse-buy-form"
    >
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">{error}</div>}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Grunnleggende informasjon</h3>

        <InputField form={form} name="name" label="Overskrift" placeholder="Hva ønsker du å kjøpe?" required schema={fieldValidators.name} />

        <TextAreaField form={form} name="description" label="Beskrivelse" placeholder="Beskriv hvilken hest du ser etter" required schema={fieldValidators.description} />

        {/* Price range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form.Field name="priceMin">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pris fra (NOK)</label>
                <input type="number" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="0" min={0} />
              </div>
            )}
          </form.Field>
          <form.Field name="priceMax">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pris til (NOK)</label>
                <input type="number" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="500000" min={0} />
              </div>
            )}
          </form.Field>
        </div>

        {/* Age range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form.Field name="ageMin">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alder fra (år)</label>
                <input type="number" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="0" min={0} max={50} />
              </div>
            )}
          </form.Field>
          <form.Field name="ageMax">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alder til (år)</label>
                <input type="number" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="20" min={0} max={50} />
              </div>
            )}
          </form.Field>
        </div>

        {/* Gender and height range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form.Field name="gender">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kjønn</label>
                <select value={field.state.value} onChange={(e) => field.handleChange(e.target.value as FormValues['gender'])} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                  {genderOptions.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="heightMin">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mankehøyde fra (cm)</label>
                  <input type="number" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="140" min={50} max={250} />
                </div>
              )}
            </form.Field>
            <form.Field name="heightMax">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mankehøyde til (cm)</label>
                  <input type="number" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="180" min={50} max={250} />
                </div>
              )}
            </form.Field>
          </div>
        </div>

        {/* Breed and discipline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form.Field name="breedId">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rase</label>
                <select value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                  <option value="">Alle</option>
                  {breeds.filter((b) => b.isActive).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>
          <form.Field name="disciplineId">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gren</label>
                <select value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                  <option value="">Alle</option>
                  {disciplines.filter((d) => d.isActive).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>
        </div>
      </div>

      {/* Images (optional) */}
      <ImageUploadField
        ref={imageUploadRef}
        images={form.state.values.images}
        onImagesChange={(urls) => form.setFieldValue("images", urls)}
        onDescriptionsChange={(descriptions) => {
          const ordered = form.state.values.images.map((url) => descriptions[url] || "");
          form.setFieldValue("imageDescriptions", ordered);
        }}
        initialDescriptions={Object.fromEntries(
          form.state.values.images.map((url, idx) => [url, form.state.values.imageDescriptions[idx] || ""]) || []
        )}
        entityType="horse-sale"
        maxImages={5}
        required={false}
        onCountChange={() => {}}
      />

      {/* Contact info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Kontaktinformasjon</h3>
        <ContactInfoNotice />
        <InputField form={form} name="contactName" label="Kontaktperson" placeholder="Navn" required schema={fieldValidators.contactName} />
        <InputField form={form} name="contactEmail" label="E-post" placeholder="din@epost.no" schema={z.string().email().optional()} />
        <InputField form={form} name="contactPhone" label="Telefon" placeholder="" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" variant="default">{mode === 'edit' ? 'Oppdater ønskes kjøpt' : 'Lagre ønskes kjøpt'}</Button>
      </div>
    </form>
  );
}

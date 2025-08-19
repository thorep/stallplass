"use client";

import Button from "@/components/atoms/Button";
import { UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import { FeedbackLink } from "@/components/ui/feedback-link";
import {
  HorseSale,
  useHorseBreeds,
  useHorseDisciplines,
  useHorseSaleMutations,
  type CreateHorseSaleData,
} from "@/hooks/useHorseSales";
import { StorageService } from "@/services/storage-service";
import type { User } from "@supabase/supabase-js";
import { useForm } from "@tanstack/react-form";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { InputField } from "@/components/forms/InputField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { AddressSearchField } from "@/components/forms/AddressSearchField";
import { ImageUploadField } from "@/components/forms/ImageUploadField";

interface HorseSaleFormProps {
  user: User;
  onSuccess?: () => void;
  horseSale?: HorseSale;
  mode?: "create" | "edit";
}

type FormValues = {
  name: string;
  description: string;
  price: string; // keep as string in UI, convert to number on submit
  age: string; // string in UI
  gender: "HOPPE" | "HINGST" | "VALLACH";
  breedId: string;
  disciplineId: string;
  size: "KATEGORI_4" | "KATEGORI_3" | "KATEGORI_2" | "KATEGORI_1" | "UNDER_160" | "SIZE_160_170" | "OVER_170";
  height: string; // optional, string in UI
  address: string;
  postalCode: string;
  poststed: string;
  fylke: string;
  municipality: string;
  kommuneNumber: string;
  coordinates: { lat: number; lon: number };
  images: string[];
  imageDescriptions: string[];
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

// Minimal zod validators for field-level feedback (no adapter required)
const fieldValidators = {
  name: z.string().min(2, "Navn må være minst 2 tegn").max(100, "Navn kan ikke være mer enn 100 tegn"),
  description: z
    .string()
    .min(1, "Beskrivelse må være minst 10 tegn")
    .max(2000, "Beskrivelse kan ikke være mer enn 2000 tegn"),
  price: z
    .string()
    .refine((v) => v.trim().length > 0, "Pris er påkrevd")
    .refine((v) => /^\d+$/.test(v), "Pris må være et heltall")
    .refine((v) => parseInt(v, 10) > 0, "Pris må være positiv"),
  age: z
    .string()
    .refine((v) => v.trim().length > 0, "Alder er påkrevd")
    .refine((v) => /^\d+$/.test(v), "Alder må være et heltall")
    .refine((v) => parseInt(v, 10) >= 0 && parseInt(v, 10) <= 50, "Alder må være mellom 0 og 50"),
  height: z
    .string()
    .refine((v) => v.trim().length > 0, "Mankehøyde er påkrevd")
    .refine((v) => /^\d+$/.test(v), "Høyde må være et heltall")
    .refine((v) => parseInt(v, 10) >= 50 && parseInt(v, 10) <= 250, "Høyde må være mellom 50 og 250"),
  breedId: z
    .string()
    .min(1, "Rase er påkrevd")
    .refine((v) => v === "" || /^[0-9a-fA-F-]{36}$/.test(v), "Ugyldig rase ID"),
  disciplineId: z
    .string()
    .min(1, "Gren er påkrevd")
    .refine((v) => v === "" || /^[0-9a-fA-F-]{36}$/.test(v), "Ugyldig disiplin ID"),
  size: z.enum(["KATEGORI_4", "KATEGORI_3", "KATEGORI_2", "KATEGORI_1", "UNDER_160", "SIZE_160_170", "OVER_170"], {
    message: "Ugyldig størrelse",
  }),
  gender: z.enum(["HOPPE", "HINGST", "VALLACH"], { message: "Ugyldig kjønn" }),
  address: z.string().min(3, "Adresse må være minst 3 tegn"),
  kommuneNumber: z.string().min(1, "Velg en adresse fra søket"),
  contactName: z
    .string()
    .min(2, "Kontaktnavn må være minst 2 tegn")
    .max(100, "Kontaktnavn kan ikke være mer enn 100 tegn"),
  contactEmail: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, "Ugyldig e-postadresse"),
  contactPhone: z
    .string()
    .optional()
    .refine((v) => !v || /^[\d\s+\-()]{8,}$/.test(v), "Ugyldig telefonnummer"),
};

const HorseSaleForm2 = ({ user, onSuccess, horseSale, mode = "create" }: HorseSaleFormProps) => {
  const { createHorseSale, updateHorseSale } = useHorseSaleMutations();
  const { data: breeds = [] } = useHorseBreeds();
  const { data: disciplines = [] } = useHorseDisciplines();

  const [error, setError] = useState<string | null>(null);
  const [apiValidationErrors, setApiValidationErrors] = useState<
    Array<{ field: string; message: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImagesCount, setSelectedImagesCount] = useState<number>(
    horseSale?.images?.length || 0
  );
  const hasUnsavedImages = useRef(false);
  const cleanupInProgress = useRef(false);
  const imageUploadRef = useRef<UnifiedImageUploadRef>(null);

  const defaultValues: FormValues = useMemo(
    () => ({
      name: horseSale?.name || "",
      description: horseSale?.description || "",
      price: horseSale?.price?.toString() || "",
      age: horseSale?.age?.toString() || "",
      gender: horseSale?.gender || ("HOPPE" as const),
      breedId: horseSale?.breedId || "",
      disciplineId: horseSale?.disciplineId || "",
      size: horseSale?.size || ("KATEGORI_1" as const),
      height: horseSale?.height?.toString() || "",
      address: horseSale?.address || "",
      postalCode: horseSale?.postalCode || "",
      poststed: horseSale?.postalPlace || "",
      fylke: "", // display only
      municipality: "", // display only
      kommuneNumber: "",
      coordinates: {
        lat: horseSale?.latitude || 0,
        lon: horseSale?.longitude || 0,
      },
      images: horseSale?.images || [],
      imageDescriptions: horseSale?.imageDescriptions || [],
      contactName: horseSale?.contactName || user?.user_metadata?.full_name || "",
      contactEmail: horseSale?.contactEmail || user?.email || "",
      contactPhone: horseSale?.contactPhone || "",
    }),
    [horseSale, user]
  );

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      // Full-form validation against our fieldValidators to gate submit
      const requiredChecks: string[] = [];
      if (!fieldValidators.name.safeParse(value.name).success) requiredChecks.push("Navn er påkrevd");
      if (!fieldValidators.description.safeParse(value.description).success)
        requiredChecks.push("Beskrivelse er påkrevd");
      if (!fieldValidators.price.safeParse(value.price).success) requiredChecks.push("Pris er påkrevd");
      if (!fieldValidators.age.safeParse(value.age).success) requiredChecks.push("Alder er påkrevd");
      if (!value.breedId) requiredChecks.push("Rase er påkrevd");
      if (!value.disciplineId) requiredChecks.push("Gren er påkrevd");
      if (!fieldValidators.address.safeParse(value.address).success) requiredChecks.push("Adresse er påkrevd");
      if (!fieldValidators.height.safeParse(value.height).success) requiredChecks.push("Mankehøyde er påkrevd");
      if (!selectedImagesCount || selectedImagesCount < 1)
        requiredChecks.push("Minst ett bilde er påkrevd");
      if (mode === "create") {
        if (!fieldValidators.kommuneNumber.safeParse(value.kommuneNumber).success)
          requiredChecks.push("Velg en adresse fra søket");
      }
      if (!fieldValidators.contactName.safeParse(value.contactName).success)
        requiredChecks.push("Kontaktperson er påkrevd");

      if (requiredChecks.length > 0) {
        setError("Vennligst fyll ut alle påkrevde felt");
        return;
      }

      setError(null);
      setApiValidationErrors([]);
      setIsSubmitting(true);

      try {
        const imageUrls = (await imageUploadRef.current?.uploadPendingImages()) || value.images;

        const submitData: CreateHorseSaleData = {
          name: value.name.trim(),
          description: value.description.trim(),
          price: parseInt(value.price, 10),
          age: parseInt(value.age, 10),
          gender: value.gender,
          breedId: value.breedId,
          disciplineId: value.disciplineId,
          size: value.size,
          height: value.height ? parseInt(value.height, 10) : undefined,
          address: value.address.trim() || undefined,
          postalCode: value.postalCode.trim() || undefined,
          postalPlace: value.poststed.trim() || undefined,
          latitude: value.coordinates.lat !== 0 ? value.coordinates.lat : undefined,
          longitude: value.coordinates.lon !== 0 ? value.coordinates.lon : undefined,
          kommuneNumber: value.kommuneNumber || undefined,
          contactName: value.contactName.trim(),
          contactEmail: value.contactEmail.trim(),
          contactPhone: value.contactPhone.trim() || undefined,
          images: imageUrls,
          imageDescriptions: value.imageDescriptions,
        };

        if (mode === "edit" && horseSale) {
          await updateHorseSale.mutateAsync({
            id: horseSale.id,
            data: submitData as Partial<CreateHorseSaleData>,
          });
        } else {
          await createHorseSale.mutateAsync(submitData);
        }

        hasUnsavedImages.current = false;
        onSuccess?.();
      } catch (error: unknown) {
        // Clean up uploaded images on submission failure
        try {
          await cleanupUploadedImages(form.state.values.images);
        } catch {}

        console.error("Error submitting horse sale (TanStack Form):", error);
        const errorObj = error as { status?: number; details?: unknown; message?: string };
        if (errorObj.status === 400 && errorObj.details) {
          setApiValidationErrors(errorObj.details as Array<{ field: string; message: string }>);
          setError("Vennligst rett opp feilene nedenfor");
        } else {
          setError(errorObj.message || "Det oppstod en feil. Prøv igjen senere.");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Cleanup function to delete orphaned images
  const cleanupUploadedImages = useCallback(async (images: string[]) => {
    if (cleanupInProgress.current || images.length === 0) return;
    cleanupInProgress.current = true;
    try {
      for (const imageUrl of images) {
        try {
          await StorageService.deleteImageByUrl(imageUrl);
        } catch {}
      }
    } finally {
      cleanupInProgress.current = false;
    }
  }, []);

  // Handle page unload - warn user and attempt cleanup
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedImages.current) {
        e.preventDefault();
        e.returnValue = "Du har ulagrede bilder. Er du sikker på at du vil forlate siden?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);


  const getApiFieldError = (fieldName: string): string | undefined =>
    apiValidationErrors.find((e) => e.field === fieldName)?.message;

  const genderOptions = [
    { value: "HOPPE", label: "Hoppe" },
    { value: "HINGST", label: "Hingst" },
    { value: "VALLACH", label: "Vallak" },
  ];

  const sizeOptions = [
    { value: "KATEGORI_4", label: "Kategori 4: < 107 cm" },
    { value: "KATEGORI_3", label: "Kategori 3: 107 cm – 130 cm" },
    { value: "KATEGORI_2", label: "Kategori 2: 130 cm – 140 cm" },
    { value: "KATEGORI_1", label: "Kategori 1: 140,5 cm – 148 cm" },
    { value: "UNDER_160", label: "Hester < 160 cm" },
    { value: "SIZE_160_170", label: "Hester 160-170 cm" },
    { value: "OVER_170", label: "Hester > 170 cm" },
  ];

  const handleCancel = async () => {
    if (hasUnsavedImages.current && mode === "create") {
      if (window.confirm("Du har ulagrede bilder. Er du sikker på at du vil avbryte?")) {
        await cleanupUploadedImages(form.state.values.images);
        onSuccess?.();
      }
    } else {
      onSuccess?.();
    }
  };

  

  const renderFieldError = (fieldName: keyof FormValues, localError?: string) => {
    const apiError = getApiFieldError(fieldName as string);
    const message = apiError || localError;
    return message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null;
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Grunnleggende informasjon</h3>

        <InputField
          form={form}
          name="name"
          label="Overskrift"
          placeholder="Skriv inn hestenavnet"
          required
          schema={fieldValidators.name}
          apiError={getApiFieldError("name")}
        />

        <TextAreaField
          form={form}
          name="description"
          label="Beskrivelse"
          placeholder="Beskriv hesten, temperament, erfaring, etc."
          required
          schema={fieldValidators.description}
          apiError={getApiFieldError("description")}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price */}
          <form.Field
            name="price"
            validators={{
              onChange: ({ value }) => fieldValidators.price.safeParse(value).success ? undefined : fieldValidators.price.safeParse(value).error?.issues?.[0]?.message,
              onBlur: ({ value }) => fieldValidators.price.safeParse(value).success ? undefined : fieldValidators.price.safeParse(value).error?.issues?.[0]?.message,
            }}
          >
            {(field) => {
              const localError = field.state.meta.errors[0];
              return (
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Pris (NOK) *
                  </label>
                  <input
                    id="price"
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                    required
                  />
                  {renderFieldError("price", localError)}
                </div>
              );
            }}
          </form.Field>

          {/* Age */}
          <form.Field
            name="age"
            validators={{
              onChange: ({ value }) => fieldValidators.age.safeParse(value).success ? undefined : fieldValidators.age.safeParse(value).error?.issues?.[0]?.message,
              onBlur: ({ value }) => fieldValidators.age.safeParse(value).success ? undefined : fieldValidators.age.safeParse(value).error?.issues?.[0]?.message,
            }}
          >
            {(field) => {
              const localError = field.state.meta.errors[0];
              return (
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                    Alder (år) *
                  </label>
                  <input
                    id="age"
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                    max="50"
                    required
                  />
                  {renderFieldError("age", localError)}
                </div>
              );
            }}
          </form.Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gender */}
          <form.Field name="gender">
            {(field) => (
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Kjønn *
                </label>
                <select
                  id="gender"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as FormValues["gender"])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>

          {/* Height */}
          <form.Field
            name="height"
            validators={{
              onChange: ({ value }) => fieldValidators.height.safeParse(value).success ? undefined : fieldValidators.height.safeParse(value).error?.issues?.[0]?.message,
              onBlur: ({ value }) => fieldValidators.height.safeParse(value).success ? undefined : fieldValidators.height.safeParse(value).error?.issues?.[0]?.message,
            }}
          >
            {(field) => {
              const localError = field.state.meta.errors[0];
              return (
                <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                  Mankehøyde (cm) *
                </label>
                  <input
                    id="height"
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="160"
                  min="50"
                  max="250"
                />
                  {renderFieldError("height", localError)}
                </div>
              );
            }}
          </form.Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Breed */}
          <form.Field
            name="breedId"
            validators={{
              onChange: ({ value }) => fieldValidators.breedId.safeParse(value).success ? undefined : fieldValidators.breedId.safeParse(value).error?.issues?.[0]?.message,
              onBlur: ({ value }) => fieldValidators.breedId.safeParse(value).success ? undefined : fieldValidators.breedId.safeParse(value).error?.issues?.[0]?.message,
            }}
          >
            {(field) => {
              const localError = field.state.meta.errors[0];
              return (
                <div>
                  <label htmlFor="breedId" className="block text-sm font-medium text-gray-700 mb-1">
                    Rase *
                  </label>
                  <select
                    id="breedId"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Velg rase</option>
                    {breeds
                      .filter((breed) => breed.isActive)
                      .map((breed) => (
                        <option key={breed.id} value={breed.id}>
                          {breed.name}
                        </option>
                      ))}
                  </select>
                  {renderFieldError("breedId", localError)}
                </div>
              );
            }}
          </form.Field>

          {/* Discipline */}
          <form.Field
            name="disciplineId"
            validators={{
              onChange: ({ value }) => fieldValidators.disciplineId.safeParse(value).success ? undefined : fieldValidators.disciplineId.safeParse(value).error?.issues?.[0]?.message,
              onBlur: ({ value }) => fieldValidators.disciplineId.safeParse(value).success ? undefined : fieldValidators.disciplineId.safeParse(value).error?.issues?.[0]?.message,
            }}
          >
            {(field) => {
              const localError = field.state.meta.errors[0];
              return (
                <div>
                  <label htmlFor="disciplineId" className="block text-sm font-medium text-gray-700 mb-1">
                    Gren *
                  </label>
                  <select
                    id="disciplineId"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Velg gren</option>
                    {disciplines
                      .filter((d) => d.isActive)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                  {renderFieldError("disciplineId", localError)}
                </div>
              );
            }}
          </form.Field>
        </div>

        {/* Size */}
        <form.Field name="size">
          {(field) => (
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                Størrelse *
              </label>
              <select
                id="size"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value as FormValues["size"])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {sizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form.Field>
      </div>

      {/* Location */}
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

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Kontaktinformasjon</h3>

        {/* Contact Name */}
        <form.Field
          name="contactName"
          validators={{
            onChange: ({ value }) => fieldValidators.contactName.safeParse(value).success ? undefined : fieldValidators.contactName.safeParse(value).error?.issues?.[0]?.message,
            onBlur: ({ value }) => fieldValidators.contactName.safeParse(value).success ? undefined : fieldValidators.contactName.safeParse(value).error?.issues?.[0]?.message,
          }}
        >
          {(field) => {
            const localError = field.state.meta.errors[0];
            const hasError = !!(localError || getApiFieldError("contactName"));
            return (
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                  Kontaktperson *
                </label>
                <input
                  id="contactName"
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    setApiValidationErrors((prev) => prev.filter((err) => err.field !== "contactName"));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    hasError ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                  }`}
                  required
                />
                {renderFieldError("contactName", localError)}
              </div>
            );
          }}
        </form.Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <form.Field
            name="contactEmail"
            validators={{
              onChange: ({ value }) => fieldValidators.contactEmail.safeParse(value).success ? undefined : fieldValidators.contactEmail.safeParse(value).error?.issues?.[0]?.message,
              onBlur: ({ value }) => fieldValidators.contactEmail.safeParse(value).success ? undefined : fieldValidators.contactEmail.safeParse(value).error?.issues?.[0]?.message,
            }}
          >
            {(field) => {
              const localError = field.state.meta.errors[0];
              const hasError = !!(localError || getApiFieldError("contactEmail"));
              return (
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    E-post (valgfritt)
                  </label>
                  <input
                    id="contactEmail"
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      hasError ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                    }`}
                  />
                  {renderFieldError("contactEmail", localError)}
                </div>
              );
            }}
          </form.Field>

          {/* Phone */}
          <form.Field
            name="contactPhone"
            validators={{
              onChange: ({ value }) => fieldValidators.contactPhone.safeParse(value).success ? undefined : fieldValidators.contactPhone.safeParse(value).error?.issues?.[0]?.message,
              onBlur: ({ value }) => fieldValidators.contactPhone.safeParse(value).success ? undefined : fieldValidators.contactPhone.safeParse(value).error?.issues?.[0]?.message,
            }}
          >
            {(field) => {
              const localError = field.state.meta.errors[0];
              const hasError = !!(localError || getApiFieldError("contactPhone"));
              return (
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon (valgfritt)
                  </label>
                  <input
                    id="contactPhone"
                    type="tel"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      hasError ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="+47 xxx xx xxx"
                  />
                  {renderFieldError("contactPhone", localError)}
                </div>
              );
            }}
          </form.Field>
        </div>
      </div>

      {/* Images */}
      <ImageUploadField
        ref={imageUploadRef}
        images={form.state.values.images}
        onImagesChange={(images) => {
          form.setFieldValue("images", images);
        }}
        onDescriptionsChange={(descriptions) => {
          const imageDescriptions = Object.values(descriptions);
          form.setFieldValue("imageDescriptions", imageDescriptions);
        }}
        initialDescriptions={form.state.values.imageDescriptions.reduce((acc, desc, index) => {
          acc[form.state.values.images[index]] = desc;
          return acc;
        }, {} as Record<string, string>)}
        entityType="horse-sale"
        maxImages={10}
        required
        mode={mode}
        onCountChange={(count) => {
          setSelectedImagesCount(count);
          hasUnsavedImages.current = count > 0 && mode === "create";
        }}
      />

      {/* Submit buttons */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
          Avbryt
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Lagrer..." : mode === "edit" ? "Oppdater" : "Opprett"}
        </Button>
      </div>


      <div className="mt-4 text-center">
        <FeedbackLink />
      </div>
    </form>
  );
};

export default HorseSaleForm2;

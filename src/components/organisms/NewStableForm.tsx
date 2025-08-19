"use client";

import Button from "@/components/atoms/Button";
import { FeedbackLink } from "@/components/ui/feedback-link";
import {
  UnifiedImageUploadRef,
} from "@/components/ui/UnifiedImageUpload";
import { useCreateStable } from "@/hooks/useStableMutations";
import { StorageService } from "@/services/storage-service";
import { StableAmenity } from "@/types";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
  AddressSearchField,
  ImageUploadField,
  InputField,
  TextAreaField,
} from "@/components/forms";

interface NewStableFormProps {
  amenities: StableAmenity[];
  user: User;
  onSuccess?: () => void;
}

type FormValues = {
  name: string;
  description: string;
  address: string;
  postalCode: string;
  poststed: string;
  fylke: string;
  municipality: string;
  kommuneNumber: string;
  coordinates: { lat: number; lon: number };
  images: string[];
  imageDescriptions: string[];
  selectedAmenityIds: string[];
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

const fieldValidators = {
  name: z
    .string()
    .min(2, "Navn må være minst 2 tegn")
    .max(100, "Navn kan ikke være mer enn 100 tegn"),
  description: z
    .string()
    .min(1, "Beskrivelse er påkrevd")
    .max(2000, "Beskrivelse kan ikke være mer enn 2000 tegn"),
  kommuneNumber: z.string().min(1, "Velg en adresse fra søket"),
  contactName: z
    .string()
    .min(2, "Kontaktnavn må være minst 2 tegn")
    .max(100, "Kontaktnavn kan ikke være mer enn 100 tegn"),
  contactEmail: z
    .string()
    .optional()
    .refine(
      (v) => !v || z.string().email().safeParse(v).success,
      "Ugyldig e-postadresse",
    ),
  contactPhone: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[\d\s+\-()]{8,}$/.test(v),
      "Ugyldig telefonnummer",
    ),
};

export default function NewStableForm({
  amenities,
  user,
  onSuccess,
}: NewStableFormProps) {
  const router = useRouter();
  const createStableMutation = useCreateStable();

  const [error, setError] = useState<string | null>(null);
  const [apiValidationErrors, setApiValidationErrors] = useState<
    Array<{ field: string; message: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImagesCount, setSelectedImagesCount] = useState(0);
  const hasUnsavedImages = useRef(false);
  const cleanupInProgress = useRef(false);
  const imageUploadRef = useRef<UnifiedImageUploadRef>(null);

  const defaultValues: FormValues = {
    name: "",
    description: "",
    address: "",
    postalCode: "",
    poststed: "",
    fylke: "",
    municipality: "",
    kommuneNumber: "",
    coordinates: { lat: 0, lon: 0 },
    images: [],
    imageDescriptions: [],
    selectedAmenityIds: [],
    contactName: user?.user_metadata?.full_name || "",
    contactEmail: user?.email || "",
    contactPhone: "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setError(null);
      setApiValidationErrors([]);

      const errors: string[] = [];
      if (!fieldValidators.name.safeParse(value.name).success)
        errors.push("Navn er påkrevd");
      if (!fieldValidators.description.safeParse(value.description).success)
        errors.push("Beskrivelse er påkrevd");
      if (!fieldValidators.kommuneNumber.safeParse(value.kommuneNumber).success)
        errors.push("Velg en adresse fra søket");
      if (selectedImagesCount === 0) errors.push("Last opp minst ett bilde");

      if (errors.length > 0) {
        setError(errors.join(". "));
        return;
      }

      setIsSubmitting(true);
      try {
        const imageUrls =
          (await imageUploadRef.current?.uploadPendingImages()) ||
          value.images;

        const payload = {
          name: value.name.trim(),
          description: value.description.trim(),
          address: value.address,
          postalCode: value.postalCode,
          poststed: value.poststed,
          city: value.poststed,
          county: value.fylke,
          municipality: value.municipality,
          kommuneNumber: value.kommuneNumber,
          images: imageUrls,
          imageDescriptions: value.imageDescriptions,
          amenityIds: value.selectedAmenityIds,
          ownerId: user.id,
          latitude: value.coordinates.lat,
          longitude: value.coordinates.lon,
          contactName: value.contactName || null,
          contactEmail: value.contactEmail || null,
          contactPhone: value.contactPhone || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await createStableMutation.mutateAsync(payload);
        hasUnsavedImages.current = false;
        onSuccess?.();
        } catch (err: unknown) {
          const data = (err as {
            data?: { errors?: Array<{ field: string; message: string }> };
          })?.data;
        if (data?.errors) {
          setApiValidationErrors(data.errors);
        } else {
          setError("Feil ved opprettelse av stall. Prøv igjen.");
        }
        await cleanupUploadedImages(form.state.values.images);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const cleanupUploadedImages = useCallback(async (urls: string[]) => {
    if (cleanupInProgress.current || urls.length === 0) return;
    cleanupInProgress.current = true;
    try {
      for (const url of urls) {
        try {
          await StorageService.deleteImageByUrl(url);
        } catch {
          // ignore
        }
      }
    } finally {
      cleanupInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedImages.current) {
        e.preventDefault();
        e.returnValue =
          "Du har ulagrede bilder. Er du sikker på at du vil forlate siden?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const getApiFieldError = (field: string): string | undefined =>
    apiValidationErrors.find((e) => e.field === field)?.message;

  const toggleAmenity = (amenityId: string) => {
    const current = form.state.values.selectedAmenityIds;
    if (current.includes(amenityId)) {
      form.setFieldValue(
        "selectedAmenityIds",
        current.filter((id) => id !== amenityId),
      );
    } else {
      form.setFieldValue("selectedAmenityIds", [...current, amenityId]);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
      data-cy="create-stable-form"
    >
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-md">
          <p className="text-error">{error}</p>
        </div>
      )}

      <InputField
        form={form}
        name="name"
        label="Navn på stall"
        placeholder="F.eks. Hestesenteret Nord"
        required
        schema={fieldValidators.name}
        apiError={getApiFieldError("name")}
      />

      <AddressSearchField
        form={form}
        mode="create"
        label="Adresseinformasjon"
        nameAddress="address"
        namePostalCode="postalCode"
        namePostalPlace="poststed"
        nameCountyName="fylke"
        nameMunicipalityName="municipality"
        nameKommuneNumber="kommuneNumber"
        nameCoordinates="coordinates"
      />

      <TextAreaField
        form={form}
        name="description"
        label="Beskrivelse"
        placeholder="Beskriv din stall, fasiliteter og det som gjør den spesiell..."
        required
        schema={fieldValidators.description}
        apiError={getApiFieldError("description")}
      />

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Kontaktinformasjon</h3>

        <InputField
          form={form}
          name="contactName"
          label="Kontaktnavn eller firma"
          required
          schema={fieldValidators.contactName}
          apiError={getApiFieldError("contactName")}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            form={form}
            name="contactEmail"
            label="E-post (valgfritt)"
            type="email"
            schema={fieldValidators.contactEmail}
            apiError={getApiFieldError("contactEmail")}
          />

          <InputField
            form={form}
            name="contactPhone"
            label="Telefon (valgfritt)"
            type="tel"
            schema={fieldValidators.contactPhone}
            apiError={getApiFieldError("contactPhone")}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          📋 Om stallbokser
        </h3>
        <p className="text-blue-800 text-sm">
          Etter at du har opprettet stallen kan du legge til individuelle
          stallbokser med egne priser, fasiliteter og tilgjengelighet fra
          dashboardet ditt.
        </p>
      </div>

      <ImageUploadField
        ref={imageUploadRef}
        images={form.state.values.images}
        onImagesChange={(images) => {
          form.setFieldValue("images", images);
        }}
        onDescriptionsChange={(descriptions) => {
          const imageDescriptions = form.state.values.images.map(
            (url) => descriptions[url] || "",
          );
          form.setFieldValue("imageDescriptions", imageDescriptions);
        }}
        initialDescriptions={form.state.values.imageDescriptions.reduce(
          (acc, desc, index) => {
            acc[form.state.values.images[index]] = desc;
            return acc;
          },
          {} as Record<string, string>,
        )}
        entityType="stable"
        maxImages={10}
        required
        mode="create"
        onCountChange={(count) => {
          setSelectedImagesCount(count);
          hasUnsavedImages.current = count > 0;
        }}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Fasiliteter
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {amenities.map((amenity) => (
            <label
              key={amenity.id}
              className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={form.state.values.selectedAmenityIds.includes(
                  amenity.id,
                )}
                onChange={() => toggleAmenity(amenity.id)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
                data-cy={`amenity-${amenity.id}`}
              />
              <span className="text-sm text-gray-700">{amenity.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            if (hasUnsavedImages.current) {
              await cleanupUploadedImages(form.state.values.images);
            }
            if (onSuccess) {
              onSuccess();
            } else {
              router.push("/dashboard?tab=stables");
            }
          }}
          data-cy="cancel-stable-button"
        >
          Avbryt
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || createStableMutation.isPending}
          data-cy="save-stable-button"
        >
          {isSubmitting || createStableMutation.isPending
            ? "Oppretter..."
            : "Opprett"}
        </Button>
      </div>

      <div className="mt-4 text-center">
        <FeedbackLink />
      </div>
    </form>
  );
}


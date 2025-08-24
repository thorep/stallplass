"use client";

import { Button } from "@/components/ui/button";
import AddressSearch from "@/components/molecules/AddressSearch";
import { UnifiedImageUpload, UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import { FeedbackLink } from "@/components/ui/feedback-link";
import {
  HorseSale,
  useHorseBreeds,
  useHorseDisciplines,
  useHorseSaleMutations,
} from "@/hooks/useHorseSales";
import { StorageService } from "@/services/storage-service";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

interface HorseSaleFormProps {
  user: User;
  onSuccess?: () => void;
  horseSale?: HorseSale;
  mode?: "create" | "edit";
}

export default function HorseSaleForm({
  user,
  onSuccess,
  horseSale,
  mode = "create",
}: HorseSaleFormProps) {
  const { createHorseSale, updateHorseSale } = useHorseSaleMutations();
  const { data: breeds = [] } = useHorseBreeds();
  const { data: disciplines = [] } = useHorseDisciplines();

  const [formData, setFormData] = useState({
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
    fylke: horseSale?.countyId || "",
    municipality: horseSale?.municipalityId || "",
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
  });

  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [apiValidationErrors, setApiValidationErrors] = useState<
    Array<{ field: string; message: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasUnsavedImages = useRef(false);
  const cleanupInProgress = useRef(false);
  const imageUploadRef = useRef<UnifiedImageUploadRef>(null);

  // Cleanup function to delete orphaned images
  const cleanupUploadedImages = useCallback(async () => {
    if (cleanupInProgress.current || formData.images.length === 0) {
      return;
    }

    cleanupInProgress.current = true;

    try {
      for (const imageUrl of formData.images) {
        try {
          await StorageService.deleteImageByUrl(imageUrl);
        } catch {
          // Silently ignore cleanup errors - best effort cleanup
        }
      }
    } finally {
      cleanupInProgress.current = false;
    }
  }, [formData.images]);

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

  // Clear validation errors when user fixes issues
  useEffect(() => {
    const errors: string[] = [];

    // Check required fields
    if (!formData.name.trim()) errors.push("Navn er påkrevd");
    if (!formData.description.trim()) errors.push("Beskrivelse er påkrevd");
    if (!formData.price.trim()) errors.push("Pris er påkrevd");
    if (!formData.age.trim()) errors.push("Alder er påkrevd");
    if (!formData.breedId) errors.push("Rase er påkrevd");
    if (!formData.disciplineId) errors.push("Gren er påkrevd");
    if (!formData.address.trim()) errors.push("Adresse er påkrevd");
    if (!formData.kommuneNumber) errors.push("Velg en adresse fra søket");
    if (!formData.contactName.trim()) errors.push("Kontaktperson er påkrevd");

    setValidationErrors(errors);
  }, [formData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
    // Clear API validation errors for this field
    setApiValidationErrors((prev) => prev.filter((err) => err.field !== field));
  };

  const handleAddressSelect = (addressData: {
    address?: string;
    postalCode?: string;
    poststed?: string;
    fylke?: string;
    municipality?: string;
    kommuneNumber?: string;
    lat?: number;
    lon?: number;
  }) => {
    console.log("HorseSaleForm handleAddressSelect:", addressData);
    setFormData((prev) => {
      const newData = {
        ...prev,
        address: addressData.address || "",
        postalCode: addressData.postalCode || "",
        poststed: addressData.poststed || "",
        fylke: addressData.fylke || "", // This is now fylke name, not ID
        municipality: addressData.municipality || "", // This is now municipality name, not ID
        kommuneNumber: addressData.kommuneNumber || "",
        coordinates: {
          lat: addressData.lat || 0,
          lon: addressData.lon || 0,
        },
      };
      console.log("HorseSaleForm new formData:", newData);
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validationErrors.length > 0) {
      setError("Vennligst fyll ut alle påkrevde felt");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setApiValidationErrors([]);

    try {
      // Upload any pending images first
      const imageUrls = (await imageUploadRef.current?.uploadPendingImages()) || formData.images;

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseInt(formData.price),
        age: parseInt(formData.age),
        gender: formData.gender,
        breedId: formData.breedId,
        disciplineId: formData.disciplineId,
        size: formData.size,
        height: formData.height ? parseInt(formData.height) : undefined,
        address: formData.address.trim() || undefined,
        postalCode: formData.postalCode.trim() || undefined,
        postalPlace: formData.poststed.trim() || undefined,
        latitude: formData.coordinates.lat !== 0 ? formData.coordinates.lat : undefined,
        longitude: formData.coordinates.lon !== 0 ? formData.coordinates.lon : undefined,
        kommuneNumber: formData.kommuneNumber, // This will be used to lookup countyId/municipalityId in API
        contactName: formData.contactName.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim() || undefined,
        images: imageUrls,
        imageDescriptions: formData.imageDescriptions,
      };

      if (mode === "edit" && horseSale) {
        await updateHorseSale.mutateAsync({
          id: horseSale.id,
          data: submitData,
        });
      } else {
        await createHorseSale.mutateAsync(submitData);
      }

      hasUnsavedImages.current = false;
      onSuccess?.();
    } catch (error: unknown) {
      // Clean up uploaded images on submission failure
      await cleanupUploadedImages();
      setFormData((prev) => ({ ...prev, images: [] }));
      hasUnsavedImages.current = false;

      console.error("Error submitting horse sale:", error);

      // Check if this is a validation error from the API
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
  };

  // Helper function to get API validation error for a specific field
  const getFieldError = (fieldName: string): string | undefined => {
    return apiValidationErrors.find((err) => err.field === fieldName)?.message;
  };

  const handleCancel = async () => {
    if (hasUnsavedImages.current && mode === "create") {
      if (window.confirm("Du har ulagrede bilder. Er du sikker på at du vil avbryte?")) {
        await cleanupUploadedImages();
        onSuccess?.();
      }
    } else {
      onSuccess?.();
    }
  };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Grunnleggende informasjon</h3>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Overskrift *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              getFieldError("name")
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="Skriv inn hestenavnet"
            required
          />
          {getFieldError("name") && (
            <p className="mt-1 text-sm text-red-600">{getFieldError("name")}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Beskrivelse *
          </label>
          <div className="relative">
            <textarea
              id="description"
              rows={6}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                getFieldError("description")
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Beskriv hesten, temperament, erfaring, etc."
              required
            />
          </div>
          {getFieldError("description") && (
            <p className="mt-1 text-sm text-red-600">{getFieldError("description")}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Pris (NOK) *
            </label>
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min="0"
              required
            />
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
              Alder (år) *
            </label>
            <input
              type="number"
              id="age"
              value={formData.age}
              onChange={(e) => handleInputChange("age", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min="0"
              max="50"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
              Kjønn *
            </label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => handleInputChange("gender", e.target.value)}
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

          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
              Mankehøyde (cm)
            </label>
            <input
              type="number"
              id="height"
              value={formData.height}
              onChange={(e) => handleInputChange("height", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="160"
              min="30"
              max="320"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="breedId" className="block text-sm font-medium text-gray-700 mb-1">
              Rase *
            </label>
            <select
              id="breedId"
              value={formData.breedId}
              onChange={(e) => handleInputChange("breedId", e.target.value)}
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
          </div>

          <div>
            <label htmlFor="disciplineId" className="block text-sm font-medium text-gray-700 mb-1">
              Gren *
            </label>
            <select
              id="disciplineId"
              value={formData.disciplineId}
              onChange={(e) => handleInputChange("disciplineId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Velg gren</option>
              {disciplines
                .filter((discipline) => discipline.isActive)
                .map((discipline) => (
                  <option key={discipline.id} value={discipline.id}>
                    {discipline.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
            Størrelse *
          </label>
          <select
            id="size"
            value={formData.size}
            onChange={(e) => handleInputChange("size", e.target.value)}
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
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Lokasjon</h3>
        <AddressSearch
          onAddressSelect={handleAddressSelect}
          initialValue={formData.address}
          placeholder="Søk etter adresse"
        />
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Kontaktinformasjon</h3>

        <div>
          <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
            Kontaktperson *
          </label>
          <input
            type="text"
            id="contactName"
            value={formData.contactName}
            onChange={(e) => handleInputChange("contactName", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              getFieldError("contactName")
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            required
          />
          {getFieldError("contactName") && (
            <p className="mt-1 text-sm text-red-600">{getFieldError("contactName")}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
              E-post (valgfritt)
            </label>
            <input
              type="email"
              id="contactEmail"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange("contactEmail", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                getFieldError("contactEmail")
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {getFieldError("contactEmail") && (
              <p className="mt-1 text-sm text-red-600">{getFieldError("contactEmail")}</p>
            )}
          </div>

          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Telefon (valgfritt)
            </label>
            <input
              type="tel"
              id="contactPhone"
              value={formData.contactPhone}
              onChange={(e) => handleInputChange("contactPhone", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                getFieldError("contactPhone")
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="+47 xxx xx xxx"
            />
            {getFieldError("contactPhone") && (
              <p className="mt-1 text-sm text-red-600">{getFieldError("contactPhone")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Bilder</h3>
        <UnifiedImageUpload
          ref={imageUploadRef}
          images={formData.images}
          onChange={(images) => {
            setFormData((prev) => ({
              ...prev,
              images,
            }));
            hasUnsavedImages.current = images.length > 0 && mode === "create";
          }}
          onDescriptionsChange={(descriptions) => {
            setFormData((prev) => ({
              ...prev,
              imageDescriptions: Object.values(descriptions),
            }));
          }}
          initialDescriptions={formData.imageDescriptions.reduce((acc, desc, index) => {
            acc[formData.images[index]] = desc;
            return acc;
          }, {} as Record<string, string>)}
          maxImages={10}
          entityType="horse-sale"
          hideUploadButton={true}
        />
      </div>

      {/* Submit buttons */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
          Avbryt
        </Button>
        <Button
          type="submit"
          variant="default"
          disabled={isSubmitting || validationErrors.length > 0}
        >
          {isSubmitting ? "Lagrer..." : mode === "edit" ? "Oppdater" : "Opprett"}
        </Button>
      </div>

      {validationErrors.length > 0 && (
        <div className="text-sm text-red-600">
          <p>Følgende felt må fylles ut:</p>
          <ul className="list-disc list-inside mt-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 text-center">
        <FeedbackLink />
      </div>
    </form>
  );
}

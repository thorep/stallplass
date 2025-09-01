"use client";

import { Button } from "@/components/ui/button";
import AddressSearch from "@/components/molecules/AddressSearch";
import { UnifiedImageUpload, UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import { FeedbackLink } from "@/components/ui/feedback-link";
import { usePartLoanHorseMutations, PartLoanHorse } from "@/hooks/usePartLoanHorses";
import { StorageService } from "@/services/storage-service";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ContactInfoNotice from "@/components/molecules/ContactInfoNotice";

interface PartLoanHorseFormProps {
  user: User;
  onSuccess?: () => void;
  partLoanHorse?: PartLoanHorse;
  mode?: "create" | "edit";
}

export default function PartLoanHorseForm({ 
  user, 
  onSuccess, 
  partLoanHorse, 
  mode = "create" 
}: PartLoanHorseFormProps) {
  const router = useRouter();
  const { create: createMutation, update: updateMutation } = usePartLoanHorseMutations();

  const [formData, setFormData] = useState({
    name: partLoanHorse?.name || "",
    description: partLoanHorse?.description || "",
    address: partLoanHorse?.address || "",
    postalCode: partLoanHorse?.postalCode || "",
    poststed: partLoanHorse?.postalPlace || "",
    fylke: partLoanHorse?.countyId || "",
    municipality: partLoanHorse?.municipalityId || "",
    kommuneNumber: "",
    coordinates: { 
      lat: partLoanHorse?.latitude || 0, 
      lon: partLoanHorse?.longitude || 0 
    },
    images: partLoanHorse?.images || [],
    imageDescriptions: partLoanHorse?.imageDescriptions || [],
    contactName: partLoanHorse?.contactName || user?.user_metadata?.full_name || "",
    contactEmail: partLoanHorse?.contactEmail || user?.email || "",
    contactPhone: partLoanHorse?.contactPhone || "",
  });
  
  const [error, setError] = useState<string | null>(null);
  const [selectedImagesCount, setSelectedImagesCount] = useState(
    partLoanHorse?.images?.length || 0
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
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

    // Check address
    if (!formData.address.trim()) {
      errors.push("Velg en adresse fra søket");
    }

    // Check images
    if (selectedImagesCount === 0) {
      errors.push("Last opp minst ett bilde");
    }

    setValidationErrors(errors);
  }, [formData.address, selectedImagesCount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImagesChange = (newImages: string[]) => {
    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));
    // Track that we have unsaved images that need cleanup if form is abandoned
    hasUnsavedImages.current = newImages.length > 0 && mode === "create";
  };

  const handleImageDescriptionsChange = (descriptions: Record<string, string>) => {
    // Convert URL-based descriptions to array matching image order
    const descriptionArray = formData.images.map((imageUrl) => descriptions[imageUrl] || "");
    setFormData((prev) => ({
      ...prev,
      imageDescriptions: descriptionArray,
    }));
  };

  // Convert array-based descriptions to URL-based for ImageGalleryManager
  const getInitialDescriptions = (): Record<string, string> => {
    const descriptions: Record<string, string> = {};
    formData.images.forEach((imageUrl, index) => {
      if (formData.imageDescriptions[index]) {
        descriptions[imageUrl] = formData.imageDescriptions[index];
      }
    });
    return descriptions;
  };

  const handleAddressSelect = (addressData: {
    address: string;
    poststed: string;
    postalCode: string;
    fylke: string;
    municipality: string;
    kommuneNumber: string;
    lat: number;
    lon: number;
  }) => {
    setFormData((prev) => ({
      ...prev,
      address: addressData.address,
      poststed: addressData.poststed,
      postalCode: addressData.postalCode,
      fylke: addressData.fylke,
      municipality: addressData.municipality,
      kommuneNumber: addressData.kommuneNumber,
      coordinates: { lat: addressData.lat, lon: addressData.lon },
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submissions
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    setError(null);
    setValidationErrors([]);

    const errors: string[] = [];

    // Check for missing address
    if (!formData.address.trim()) {
      errors.push("Velg en adresse fra søket");
    }

    // Check for missing images
    if (selectedImagesCount === 0) {
      errors.push("Last opp minst ett bilde");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsSubmitting(false);
      return;
    }

    // Let browser handle name and description validation
    const form = e.target as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      setIsSubmitting(false);
      return;
    }

    try {
      // Upload any pending images first
      const imageUrls = (await imageUploadRef.current?.uploadPendingImages()) || formData.images;

      const partLoanHorseData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        postalCode: formData.postalCode,
        postalPlace: formData.poststed,
        latitude: formData.coordinates.lat,
        longitude: formData.coordinates.lon,
        countyId: formData.fylke, // This should be the fylke ID from address search
        municipalityId: formData.municipality, // This should be the municipality ID from address search
        kommuneNumber: formData.kommuneNumber, // Official kommune number for lookup
        images: imageUrls,
        imageDescriptions: formData.imageDescriptions,
        contactName: formData.contactName || null,
        contactEmail: formData.contactEmail || null,
        contactPhone: formData.contactPhone || null,
      };

      if (mode === "edit" && partLoanHorse) {
        await updateMutation.mutateAsync({
          id: partLoanHorse.id,
          data: partLoanHorseData,
        });
      } else {
        await createMutation.mutateAsync(partLoanHorseData);
      }

      // Mark images as saved (no cleanup needed)
      hasUnsavedImages.current = false;
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard?tab=forhest");
      }
    } catch {
      // Clean up uploaded images on submission failure (only for create mode)
      if (mode === "create") {
        await cleanupUploadedImages();
        setFormData((prev) => ({ ...prev, images: [] }));
        hasUnsavedImages.current = false;
      }

      setError(`Feil ved ${mode === "edit" ? "oppdatering" : "opprettelse"} av fôrhest. Prøv igjen.`);
      setIsSubmitting(false);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-md">
          <p className="text-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" data-cy="part-loan-horse-form">
        {/* Basic Information */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Navn på hest *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            onInvalid={(e) => {
              (e.target as HTMLInputElement).setCustomValidity("Vennligst fyll ut dette feltet");
            }}
            onInput={(e) => {
              (e.target as HTMLInputElement).setCustomValidity("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="F.eks. Bella"
            data-cy="horse-name-input"
          />
        </div>

        {/* Location Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Adresseinformasjon</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Søk etter adresse *
            </label>
            <AddressSearch
              onAddressSelect={handleAddressSelect}
              placeholder="Begynn å skrive adressen..."
              initialValue={formData.address}
            />
          </div>

          {/* Show selected address if available */}
          {formData.address && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <h4 className="text-sm font-medium text-green-800 mb-1">Valgt adresse:</h4>
              <p className="text-sm text-green-700">
                {formData.address}, {formData.postalCode} {formData.poststed}
              </p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Beskrivelse *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            onInvalid={(e) => {
              (e.target as HTMLTextAreaElement).setCustomValidity("Vennligst fyll ut dette feltet");
            }}
            onInput={(e) => {
              (e.target as HTMLTextAreaElement).setCustomValidity("");
            }}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            data-cy="horse-description-input"
            placeholder="Beskriv hesten, erfaring, temperament og hva slags rytter som passer..."
          />
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <span className="inline-flex items-center gap-2">
              ℹ️ Kontaktinformasjon
            </span>
          </h3>
          <ContactInfoNotice />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
                Kontaktnavn eller firma
              </label>
              <input
                type="text"
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="f.eks. Kari Nordmann eller Hestesenteret Nord"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                E-post (valgfritt)
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="din.epost@eksempel.com"
              />
            </div>

            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefon (valgfritt)
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="+47 123 45 678"
              />
            </div>
          </div>
        </div>

        {/* Info about part-loan */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">🐴 Om fôrhest</h3>
          <p className="text-blue-800 text-sm">
            En fôrhest er en hest som eieren ønsker at andre skal ri eller trene. Dette kan være mot betaling 
            eller som en avtale hvor rytteren hjelper til med stellet.
          </p>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bilder og beskrivelser
          </label>
          <UnifiedImageUpload
            ref={imageUploadRef}
            images={formData.images}
            onChange={handleImagesChange}
            onDescriptionsChange={handleImageDescriptionsChange}
            selectedImageCountFunc={(count) => {
              setSelectedImagesCount(count);
            }}
            initialDescriptions={getInitialDescriptions()}
            maxImages={10}
            entityType="part-loan-horse"
            title="Administrer bilder av hesten"
            mode="inline"
            hideUploadButton={true}
          />
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            {validationErrors.map((error, index) => (
              <p key={index} className="text-red-600 text-sm">
                • {error}
              </p>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              // Clean up uploaded images before canceling (only for create mode)
              if (hasUnsavedImages.current && mode === "create") {
                await cleanupUploadedImages();
              }
              if (onSuccess) {
                onSuccess();
              } else {
                router.push("/dashboard?tab=forhest");
              }
            }}
            data-cy="cancel-horse-button"
          >
            Avbryt
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={isSubmitting || isLoading}
            data-cy="save-horse-button"
          >
            {isSubmitting || isLoading 
              ? (mode === "edit" ? "Oppdaterer..." : "Oppretter...") 
              : (mode === "edit" ? "Oppdater" : "Opprett")
            }
          </Button>
        </div>
        
        <div className="mt-4 text-center">
          <FeedbackLink />
        </div>
      </form>
    </>
  );
}

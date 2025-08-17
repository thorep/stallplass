"use client";

import Button from "@/components/atoms/Button";
import AddressSearch from "@/components/molecules/AddressSearch";
import { UnifiedImageUpload, UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import { FeedbackLink } from "@/components/ui/feedback-link";
import { useCreateStable } from "@/hooks/useStableMutations";
import { StorageService } from "@/services/storage-service";
import { StableAmenity } from "@/types";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface NewStableFormProps {
  amenities: StableAmenity[];
  user: User;
  onSuccess?: () => void;
}

export default function NewStableForm({ amenities, user, onSuccess }: NewStableFormProps) {
  const router = useRouter();
  const createStableMutation = useCreateStable();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    postalCode: "",
    poststed: "", // Norwegian postal place name
    fylke: "", // Norwegian county from database lookup
    municipality: "", // Kommune name from database lookup
    kommuneNumber: "", // Official kommune number for location mapping
    coordinates: { lat: 0, lon: 0 },
    images: [] as string[],
    imageDescriptions: [] as string[],
    selectedAmenityIds: [] as string[],
    contactName: user?.user_metadata?.full_name || "",
    contactEmail: user?.email || "",
    contactPhone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedImagesCount, setSelectedImagesCount] = useState(0);
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

  // Cleanup on component unmount (when navigating away)
  useEffect(() => {
    return () => {
      if (hasUnsavedImages.current && !cleanupInProgress.current) {
        // Fire and forget cleanup - can't await in cleanup function
      }
    };
  }, [cleanupUploadedImages]);

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
  }, [formData.address, selectedImagesCount]); // Trigger when these change

  // User is guaranteed to be authenticated via server-side requireAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImagesChange = (newImages: string[]) => {
    console.log("handleImagesChange called with:", newImages);
    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));
    // Track that we have unsaved images that need cleanup if form is abandoned
    hasUnsavedImages.current = newImages.length > 0;
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

  const handleAmenityToggle = (amenityId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedAmenityIds: prev.selectedAmenityIds.includes(amenityId)
        ? prev.selectedAmenityIds.filter((id) => id !== amenityId)
        : [...prev.selectedAmenityIds, amenityId],
    }));
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
      fylke: addressData.fylke, // Fylke name from database lookup
      municipality: addressData.municipality, // Kommune name from database lookup
      kommuneNumber: addressData.kommuneNumber, // Official number for location mapping
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
    console.log("Selected images count:", selectedImagesCount);
    if (selectedImagesCount === 0) {
      errors.push("Last opp minst ett bilde");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsSubmitting(false); // Reset on validation error
      return;
    }

    // Let browser handle name and description validation
    const form = e.target as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    try {
      // Upload any pending images first
      const imageUrls = (await imageUploadRef.current?.uploadPendingImages()) || formData.images;

      const stableData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        postalCode: formData.postalCode,
        poststed: formData.poststed,
        city: formData.poststed, // City is same as poststed in Norway
        county: formData.fylke, // County from address lookup
        municipality: formData.municipality,
        kommuneNumber: formData.kommuneNumber, // For location mapping
        images: imageUrls,
        imageDescriptions: formData.imageDescriptions,
        amenityIds: formData.selectedAmenityIds,
        ownerId: user.id,
        latitude: formData.coordinates.lat,
        longitude: formData.coordinates.lon,
        contactName: formData.contactName || null,
        contactEmail: formData.contactEmail || null,
        contactPhone: formData.contactPhone || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await createStableMutation.mutateAsync(stableData);

      // Mark images as saved (no cleanup needed)
      hasUnsavedImages.current = false;
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard?tab=stables");
      }
    } catch {
      // Clean up uploaded images on submission failure
      await cleanupUploadedImages();
      setFormData((prev) => ({ ...prev, images: [] }));
      hasUnsavedImages.current = false;

      setError("Feil ved opprettelse av stall. Prøv igjen.");
      setIsSubmitting(false); // Reset on error
    }
  };

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-md">
          <p className="text-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" data-cy="create-stable-form">
        {/* Basic Information */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Navn på stall *
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
            placeholder="F.eks. Hestesenteret Nord"
            data-cy="stable-name-input"
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
            data-cy="stable-description-input"
            placeholder="Beskriv din stall, fasiliteter og det som gjør den spesiell..."
          />
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <span className="inline-flex items-center gap-2">
              ℹ️ Kontaktinformasjon
            </span>
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm">
              Denne informasjonen vises på tjenestesiden for potensielle kunder.
            </p>
          </div>

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
                placeholder="f.eks. Dr. Kari Nordmann eller Nordmann Veterinærklinikk"
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

        {/* Info about boxes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">📋 Om stallbokser</h3>
          <p className="text-blue-800 text-sm">
            Etter at du har opprettet stallen kan du legge til individuelle stallbokser med egne
            priser, fasiliteter og tilgjengelighet fra dashboardet ditt.
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
            entityType="stable"
            title="Administrer stallbilder"
            mode="inline"
            hideUploadButton={true}
          />
        </div>

        {/* Amenities Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Fasiliteter</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {amenities.map((amenity) => (
              <label
                key={amenity.id}
                className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.selectedAmenityIds.includes(amenity.id)}
                  onChange={() => handleAmenityToggle(amenity.id)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  data-cy={`amenity-${amenity.id}`}
                />
                <span className="text-sm text-gray-700">{amenity.name}</span>
              </label>
            ))}
          </div>
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
              // Clean up uploaded images before canceling
              if (hasUnsavedImages.current) {
                await cleanupUploadedImages();
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
            {isSubmitting || createStableMutation.isPending ? "Oppretter..." : "Opprett stall"}
          </Button>
        </div>
        
        <div className="mt-4 text-center">
          <FeedbackLink />
        </div>
      </form>
    </>
  );
}

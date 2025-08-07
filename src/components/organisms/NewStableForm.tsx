"use client";

import Button from "@/components/atoms/Button";
import AddressSearch from "@/components/molecules/AddressSearch";
import { UnifiedImageUpload, UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import { useImproveDescription } from "@/hooks/useAIDescriptionImprover";
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
  const improveDescriptionMutation = useImproveDescription();

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
  });
  const [error, setError] = useState<string | null>(null);
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
        } catch (error) {
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

  // User is guaranteed to be authenticated via server-side requireAuth()

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

  const handleImproveDescription = async () => {
    if (!formData.description.trim()) {
      setError("Skriv inn en beskrivelse først for å forbedre den med AI");
      return;
    }

    try {
      const result = await improveDescriptionMutation.mutateAsync({
        description: formData.description,
      });

      setFormData((prev) => ({
        ...prev,
        description: result.improvedDescription,
      }));

      setError(null);
    } catch (err) {
      setError("Kunne ikke forbedre beskrivelsen med AI. Prøv igjen.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.name.trim()) {
      setError("Navn på stall er påkrevd");
      return;
    }

    if (!formData.description.trim()) {
      setError("Beskrivelse er påkrevd");
      return;
    }

    if (!formData.address.trim()) {
      setError("Adresse er påkrevd. Vennligst velg en adresse fra søket.");
      return;
    }

    if (!formData.postalCode.trim()) {
      setError("Postnummer er påkrevd. Vennligst velg en adresse fra søket.");
      return;
    }

    if (!formData.poststed.trim()) {
      setError("Poststed er påkrevd. Vennligst velg en adresse fra søket.");
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="F.eks. Hestesenteret Nord1"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Gateadresse *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                data-cy="address-input"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50"
                placeholder="Velg adresse fra søket over"
                readOnly
              />
            </div>

            <div>
              <label htmlFor="poststed" className="block text-sm font-medium text-gray-700 mb-2">
                Poststed *
              </label>
              <input
                type="text"
                id="poststed"
                name="poststed"
                data-cy="poststed-input"
                value={formData.poststed}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50"
                placeholder="Automatisk utfylt"
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                Postnummer *
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                data-cy="postalcode-input"
                value={formData.postalCode}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50"
                placeholder="Automatisk utfylt"
                readOnly
              />
            </div>

            <div>
              <label htmlFor="fylke" className="block text-sm font-medium text-gray-700 mb-2">
                Fylke
              </label>
              <input
                type="text"
                id="fylke"
                name="fylke"
                data-cy="fylke-input"
                value={formData.fylke}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50"
                placeholder="Automatisk utfylt"
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label
                htmlFor="municipality"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Kommune
              </label>
              <input
                type="text"
                id="municipality"
                name="municipality"
                data-cy="municipality-input"
                value={formData.municipality}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50"
                placeholder="Automatisk utfylt"
                readOnly
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Beskrivelse *
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImproveDescription}
              disabled={
                improveDescriptionMutation.isPending ||
                !formData.description.trim() ||
                formData.description.length < 250 ||
                improveDescriptionMutation.isWaiting
              }
              className="text-xs px-2 py-1 h-auto"
              data-cy="ai-improve-description-button"
            >
              {improveDescriptionMutation.isPending ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-1 h-3 w-3 text-current"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Forbedrer...
                </>
              ) : improveDescriptionMutation.isWaiting ? (
                <>⏱️ Vent {improveDescriptionMutation.remainingWaitTime}s</>
              ) : formData.description.length < 250 ? (
                <>✨ Forbedre med AI ({formData.description.length}/250)</>
              ) : (
                <>✨ Forbedre med AI</>
              )}
            </Button>
          </div>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            data-cy="stable-description-input"
            placeholder="Beskriv din stall, fasiliteter og det som gjør den spesiell..."
          />
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
            disabled={createStableMutation.isPending}
            data-cy="save-stable-button"
          >
            {createStableMutation.isPending ? "Oppretter..." : "Opprett stall"}
          </Button>
        </div>
      </form>
    </>
  );
}

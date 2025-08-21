"use client";

import { Button } from "@/components/ui/button";
import AddressSearch from "@/components/molecules/AddressSearch";
import FAQManager from "@/components/molecules/FAQManager";
import { Modal } from "@/components/ui/modal";
import { UnifiedImageUpload, UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import { useUpdateStable } from "@/hooks/useStableMutations";
import { Stable, StableAmenity, StableFAQ } from "@/types/stable";
import { useEffect, useRef, useState } from "react";

interface StableEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  stableId: string;
  userId: string;
}

export default function StableEditModal({
  isOpen,
  onClose,
  stableId,
  userId,
}: StableEditModalProps) {
  const updateStableMutation = useUpdateStable();

  const [stable, setStable] = useState<Stable | null>(null);
  const [amenities, setAmenities] = useState<StableAmenity[]>([]);
  const [faqs, setFaqs] = useState<StableFAQ[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    postalCode: "",
    city: "",
    county: "",
    poststed: "",
    fylke: "",
    municipality: "",
    kommuneNumber: "",
    coordinates: { lat: 0, lon: 0 },
    images: [] as string[],
    imageDescriptions: [] as string[],
    selectedAmenityIds: [] as string[],
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imageUploadRef = useRef<UnifiedImageUploadRef>(null);

  const saving = updateStableMutation.isPending;


  useEffect(() => {
    if (!isOpen || !stableId) {
      return;
    }

    const fetchStableAndAmenities = async () => {
      try {
        setLoading(true);
        setError(null);

        const [stableResponse, amenitiesResponse, faqResponse] = await Promise.all([
          fetch(`/api/stables/${stableId}`, { credentials: "include" }),
          fetch("/api/stable-amenities", { credentials: "include" }),
          fetch(`/api/stables/${stableId}/faqs`, { credentials: "include" }),
        ]);

        if (!stableResponse.ok) {
          throw new Error("Failed to fetch stable");
        }

        const stableData = await stableResponse.json();
        const amenitiesData = amenitiesResponse.ok ? await amenitiesResponse.json() : [];
        const faqData = faqResponse.ok ? await faqResponse.json() : [];

        // Check if user owns this stable
        if (stableData.ownerId !== userId) {
          throw new Error("You do not have permission to edit this stable");
        }

        setStable(stableData);
        setAmenities(Array.isArray(amenitiesData) ? amenitiesData : []);
        setFaqs(Array.isArray(faqData) ? faqData : []);

        // Populate form with stable data
        setFormData({
          name: stableData.name,
          description: stableData.description,
          address: stableData.address || "",
          postalCode: stableData.postalCode || "",
          city: stableData.postalPlace || stableData.city || "",
          county: stableData.county || "",
          poststed: stableData.postalPlace || stableData.city || "",
          fylke: stableData.fylke || stableData.county || "",
          municipality: stableData.municipality || "",
          kommuneNumber: stableData.kommuneNumber || "",
          coordinates: {
            lat: stableData.latitude || 0,
            lon: stableData.longitude || 0,
          },
          images: stableData.images || [],
          imageDescriptions: stableData.imageDescriptions || [],
          selectedAmenityIds:
            stableData.amenities?.map((a: { amenity: { id: string } }) => a.amenity.id) || [],
          contactName: stableData.contactName || "",
          contactEmail: stableData.contactEmail || "",
          contactPhone: stableData.contactPhone || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Feil ved lasting av stalldata");
      } finally {
        setLoading(false);
      }
    };

    fetchStableAndAmenities();
  }, [isOpen, stableId, userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      fylke: addressData.fylke,
      municipality: addressData.municipality,
      kommuneNumber: addressData.kommuneNumber,
      city: addressData.poststed,
      county: addressData.fylke,
      coordinates: { lat: addressData.lat, lon: addressData.lon },
    }));
  };

  const handleImagesChange = (newImages: string[]) => {
    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));
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

  const handleFAQsChange = (updatedFAQs: StableFAQ[]) => {
    setFaqs(updatedFAQs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Upload any pending images first
      const imageUrls = (await imageUploadRef.current?.uploadPendingImages()) || formData.images;

      const updatedData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        postalCode: formData.postalCode,
        city: formData.city,
        county: formData.county || undefined,
        poststed: formData.poststed,
        fylke: formData.fylke,
        municipality: formData.municipality,
        kommuneNumber: formData.kommuneNumber,
        coordinates: formData.coordinates,
        images: imageUrls,
        imageDescriptions: formData.imageDescriptions,
        amenityIds: formData.selectedAmenityIds,
        contactName: formData.contactName || null,
        contactEmail: formData.contactEmail || null,
        contactPhone: formData.contactPhone || null,
      };

      // Use the mutation hook for stable update (handles auth automatically)
      await updateStableMutation.mutateAsync({ id: stableId, data: updatedData });

      // Handle FAQ update with cookie-based authentication
      await fetch(`/api/stables/${stableId}/faqs`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ faqs }),
      });

      onClose();
    } catch {
      setError("Feil ved oppdatering av stall. Prøv igjen.");
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      );
    }

    if (error || !stable) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error || "Stall ikke funnet"}</p>
          <Button variant="outline" onClick={onClose}>
            Lukk
          </Button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

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
            placeholder="F.eks. Hestesenteret Nord"
          />
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
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
                value={formData.poststed}
                onChange={handleInputChange}
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
                value={formData.postalCode}
                onChange={handleInputChange}
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
                value={formData.municipality}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50"
                placeholder="Automatisk utfylt"
                readOnly
              />
            </div>
          </div>
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
              Denne informasjonen vises på stallsiden for potensielle kunder.
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

        {/* Images */}
        <div id="images">
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
                />
                <span className="text-sm text-gray-700">{amenity.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div data-section="faq">
          <FAQManager
            stable_id={stableId}
            faqs={faqs}
            onChange={handleFAQsChange}
            title="Ofte stilte spørsmål"
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Avbryt
          </Button>
          <Button type="submit" variant="default" disabled={saving}>
            {saving ? "Lagrer..." : "Oppdater"}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rediger stall" maxWidth="xl">
      {renderContent()}
    </Modal>
  );
}

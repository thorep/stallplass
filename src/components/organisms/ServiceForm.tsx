"use client";

import Button from "@/components/atoms/Button";
import ImageUpload from "@/components/molecules/ImageUpload";
import LocationSelector from "@/components/molecules/LocationSelector";
import type { Fylke, KommuneWithFylke } from "@/hooks/useLocationQueries";
import { useCreateService, useUpdateService } from "@/hooks/useServiceMutations";
import { getAllServiceTypes, ServiceType } from "@/lib/service-types";
import { useAuth } from "@/lib/supabase-auth-context";
import { StorageService } from "@/services/storage-service";
import { ServiceWithDetails } from "@/types/service";
import { PlusIcon, XMarkIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ServiceFormProps {
  service?: ServiceWithDetails;
  onSuccess?: (service: ServiceWithDetails) => void;
  onCancel?: () => void;
}

interface ServiceArea {
  county: string; // County ID
  municipality?: string; // Municipality ID (optional)
}

export default function ServiceForm({ service, onSuccess, onCancel }: ServiceFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    service_type: ServiceType;
    price_range_min: string;
    price_range_max: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    areas: ServiceArea[];
    photos: string[];
    is_active: boolean;
  }>({
    title: service?.title || "",
    description: service?.description || "",
    service_type: (service?.serviceType || "veterinarian") as ServiceType,
    price_range_min: service?.priceRangeMin?.toString() || "",
    price_range_max: service?.priceRangeMax?.toString() || "",
    contact_name: service?.contactName || "",
    contact_email: service?.contactEmail || user?.email || "",
    contact_phone: service?.contactPhone || "",
    areas: service?.areas.map((area) => ({
      county: area.county,
      municipality: area.municipality || "",
    })) || [{ county: "", municipality: "" }],
    photos: service?.photos?.map((p) => p.photoUrl) || ([] as string[]),
    is_active: service?.isActive !== false,
  });

  const isLoading = createServiceMutation.isPending || updateServiceMutation.isPending;
  const [error, setError] = useState<string | null>(null);
  const hasUnsavedImages = useRef(false);
  const cleanupInProgress = useRef(false);

  // Cleanup function to delete orphaned images
  const cleanupUploadedImages = useCallback(async () => {
    if (cleanupInProgress.current || formData.photos.length === 0) {
      return;
    }

    cleanupInProgress.current = true;

    try {
      for (const imageUrl of formData.photos) {
        try {
          await StorageService.deleteImageByUrl(imageUrl);
        } catch (error) {
          // Silently ignore cleanup errors - best effort cleanup
          console.warn("Failed to cleanup image during form reset:", error);
        }
      }
    } finally {
      cleanupInProgress.current = false;
    }
  }, [formData.photos]);

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

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (hasUnsavedImages.current && !cleanupInProgress.current) {
      }
    };
  }, [cleanupUploadedImages]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleAreaFylkeChange = (index: number, fylke: Fylke | null) => {
    console.log("🏷️ handleAreaFylkeChange called:", { index, fylke, id: fylke?.id });

    setFormData((prev) => {
      const newAreas = [...prev.areas];
      newAreas[index] = {
        county: fylke?.id || "",
        municipality: "", // Reset municipality when county changes
      };
      console.log("🏷️ Setting new areas:", newAreas);
      return { ...prev, areas: newAreas };
    });
  };

  const handleAreaKommuneChange = (index: number, kommune: KommuneWithFylke | null) => {
    setFormData((prev) => {
      const newAreas = [...prev.areas];
      newAreas[index] = {
        ...newAreas[index],
        municipality: kommune?.id || "",
      };
      return { ...prev, areas: newAreas };
    });
  };

  const addArea = () => {
    setFormData((prev) => ({
      ...prev,
      areas: [...prev.areas, { county: "", municipality: "" }],
    }));
  };

  const removeArea = (index: number) => {
    if (formData.areas.length > 1) {
      const newAreas = formData.areas.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, areas: newAreas }));
    }
  };

  const handleImagesChange = (images: string[]) => {
    setFormData((prev) => ({ ...prev, photos: images }));
    hasUnsavedImages.current = true;
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError("Tittel er påkrevd");
      return false;
    }

    if (!formData.description.trim()) {
      setError("Beskrivelse er påkrevd");
      return false;
    }

    if (!formData.service_type) {
      setError("Tjenestetype er påkrevd");
      return false;
    }

    if (!formData.contact_name.trim()) {
      setError("Kontaktnavn er påkrevd");
      return false;
    }

    // Validate that at least one area has a county selected
    const validAreas = formData.areas.filter((area) => area.county && area.county.trim() !== "");
    if (validAreas.length === 0) {
      setError("Minst ett dekningsområde er påkrevd");
      return false;
    }

    // Validate price ranges
    if (formData.price_range_min && formData.price_range_max) {
      const min = parseFloat(formData.price_range_min);
      const max = parseFloat(formData.price_range_max);
      if (min > max) {
        setError("Minimum pris kan ikke være høyere enn maksimum pris");
        return false;
      }
    }

    return true;
  };

  // Real-time form validation (without setting errors)
  const isFormValid = useMemo(() => {
    console.log("🔍 Validating form:", {
      title: formData.title,
      description: formData.description,
      service_type: formData.service_type,
      areas: formData.areas,
    });

    // Check required fields
    const hasRequiredFields =
      formData.title.trim() && formData.description.trim() && formData.service_type && formData.contact_name.trim();
    console.log("📝 Required fields check:", hasRequiredFields);

    if (!hasRequiredFields) {
      return false;
    }

    // Check that at least one area has a county ID selected
    const validAreas = formData.areas.filter((area) => area.county && area.county.trim() !== "");
    formData.areas.forEach((area, i) => {
      console.log(
        `📍 Area ${i}:`,
        area,
        "county:",
        area.county,
        "empty?",
        !area.county || area.county.trim() === ""
      );
    });
    console.log("📍 Valid areas:", validAreas, "from total:", formData.areas.length);

    if (validAreas.length === 0) {
      console.log("❌ No valid areas found");
      return false;
    }

    // Check price range validity
    if (formData.price_range_min && formData.price_range_max) {
      const min = parseFloat(formData.price_range_min);
      const max = parseFloat(formData.price_range_max);
      if (min > max) {
        console.log("❌ Invalid price range");
        return false;
      }
    }

    console.log("✅ Form is valid!");
    return true;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting");
    if (!validateForm()) {
      console.log("!validateForm");
      return;
    }

    if (!user) {
      setError("Du må være logget inn for å opprette en tjeneste");
      return;
    }

    setError(null);

    try {
      // Prepare the data - filter areas with valid county IDs
      const validAreas = formData.areas.filter((area) => area.county && area.county.trim() !== "");

      const serviceData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        service_type: formData.service_type,
        price_range_min: formData.price_range_min
          ? parseFloat(formData.price_range_min)
          : undefined,
        price_range_max: formData.price_range_max
          ? parseFloat(formData.price_range_max)
          : undefined,
        contact_name: formData.contact_name.trim(),
        contact_email: formData.contact_email.trim() || undefined,
        contact_phone: formData.contact_phone.trim() || undefined,
        areas: validAreas,
        photos: formData.photos,
        is_active: formData.is_active,
      };
      console.log("Trying to create or update");
      const result = service
        ? await updateServiceMutation.mutateAsync({ id: service.id, data: serviceData })
        : await createServiceMutation.mutateAsync(serviceData);
      hasUnsavedImages.current = false; // Mark images as saved

      if (onSuccess) {
        onSuccess(result as unknown as ServiceWithDetails);
      } else {
        router.push("/dashboard?tab=services");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "En feil oppstod");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Tittel *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="f.eks. Veterinærtjenester i Oslo"
            disabled={isLoading}
          />
        </div>

        {/* Service Type */}
        <div>
          <label htmlFor="service_type" className="block text-sm font-medium text-gray-700">
            Tjenestetype *
          </label>
          <select
            id="service_type"
            value={formData.service_type}
            onChange={(e) => handleInputChange("service_type", e.target.value as ServiceType)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            disabled={isLoading}
          >
            {getAllServiceTypes().map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Contact Information */}
        <div className="border-t pt-6">
          <h3 className="text-h4 font-semibold text-gray-900 mb-4">Kontaktinformasjon</h3>
          <p className="text-body-sm text-gray-600 mb-4">
            Denne informasjonen vises på tjenestesiden for potensielle kunder.
          </p>
          
          {/* Contact Name */}
          <div className="mb-4">
            <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700">
              Navn eller firma *
            </label>
            <input
              type="text"
              id="contact_name"
              value={formData.contact_name}
              onChange={(e) => handleInputChange("contact_name", e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="f.eks. Dr. Kari Nordmann eller Nordmann Veterinærklinikk"
              disabled={isLoading}
            />
          </div>

          {/* Contact Email */}
          <div className="mb-4">
            <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700">
              E-post (valgfritt)
            </label>
            <input
              type="email"
              id="contact_email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange("contact_email", e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="kontakt@eksempel.no"
              disabled={isLoading}
            />
          </div>

          {/* Contact Phone */}
          <div className="mb-4">
            <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700">
              Telefon (valgfritt)
            </label>
            <input
              type="tel"
              id="contact_phone"
              value={formData.contact_phone}
              onChange={(e) => handleInputChange("contact_phone", e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="+47 123 45 678"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Beskrivelse *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={6}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Beskriv dine tjenester, erfaring, og hva du tilbyr..."
            disabled={isLoading}
          />
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prisområde (valgfritt)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                value={formData.price_range_min}
                onChange={(e) => handleInputChange("price_range_min", e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Fra (NOK)"
                min="0"
                disabled={isLoading}
              />
            </div>
            <div>
              <input
                type="number"
                value={formData.price_range_max}
                onChange={(e) => handleInputChange("price_range_max", e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Til (NOK)"
                min="0"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Service Areas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dekningsområder *</label>
          {formData.areas.map((area, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-medium text-gray-900">Område {index + 1}</h4>
                {formData.areas.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArea(index)}
                    disabled={isLoading}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <LocationSelector
                selectedFylkeId={area.county || undefined}
                selectedKommuneId={area.municipality || undefined}
                onFylkeChange={(fylke) => handleAreaFylkeChange(index, fylke)}
                onKommuneChange={(kommune) => handleAreaKommuneChange(index, kommune)}
                disabled={isLoading}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addArea}
            className="mt-2"
            disabled={isLoading}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Legg til område
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Velg fylke og eventuelt spesifikk kommune du tilbyr tjenester i. La kommune stå på
            &quot;Hele fylket&quot; hvis du dekker hele fylket.
          </p>
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bilder</label>
          <ImageUpload
            images={formData.photos}
            onChange={handleImagesChange}
            maxImages={6}
            bucket="service-photos" // You'll need to create this bucket
          />
          <p className="text-xs text-gray-500 mt-1">
            Last opp bilder som viser ditt arbeid, utstyr, eller deg i aksjon.
          </p>
        </div>

        {/* Active Status (only for editing) */}
        {service && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange("is_active", e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
              disabled={isLoading}
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Tjenesten er aktiv og synlig for kunder
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4 pt-6">
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="flex-1 px-3 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="w-4 h-4" />
            {isLoading ? "Lagrer..." : service ? "Oppdater tjeneste" : "Opprett tjeneste"}
          </button>

          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Avbryt
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

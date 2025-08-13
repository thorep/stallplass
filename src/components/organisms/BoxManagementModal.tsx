"use client";

import Button from "@/components/atoms/Button";
import { Modal } from "@/components/ui/modal";
import { UnifiedImageUpload, UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import { FeedbackLink } from "@/components/ui/feedback-link";
import { useBoxAmenities } from "@/hooks/useAmenities";
import { useCreateBox, useUpdateBox } from "@/hooks/useBoxMutations";
import { Box, BoxWithAmenities } from "@/types/stable";
import { useEffect, useRef, useState } from "react";
// Real-time functionality only exists for chat, not for boxes

interface BoxManagementModalProps {
  readonly stableId: string;
  readonly box?: Box | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: () => void;
}

export default function BoxManagementModal({
  stableId,
  box,
  open,
  onOpenChange,
  onSave,
}: BoxManagementModalProps) {
  const handleClose = () => {
    onOpenChange(false);
  };
  const { data: amenities = [] } = useBoxAmenities();
  const createBox = useCreateBox();
  const updateBox = useUpdateBox();
  const [error, setError] = useState<string | null>(null);
  const imageUploadRef = useRef<UnifiedImageUploadRef>(null);

  // Use the box data directly (no real-time updates for boxes)
  const currentBox = box;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    size: "",
    sizeText: "",
    boxType: "BOKS" as "BOKS" | "UTEGANG",
    isAvailable: true,
    maxHorseSize: "",
    specialNotes: "",
    images: [] as string[],
    selectedAmenityIds: [] as string[],
    dagsleie: false,
  });
  const [selectedImagesCount, setSelectedImagesCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Amenities are now loaded via TanStack Query

  // Reset form when modal opens/closes and reset or pre-fill based on box data
  useEffect(() => {
    if (open) {
      if (currentBox) {
        // Editing existing box - pre-fill form
        const boxWithAmenities = currentBox as BoxWithAmenities;
        const amenityIds = boxWithAmenities.amenities
          ? boxWithAmenities.amenities.map((amenityLink) => amenityLink.amenity.id)
          : [];

        setFormData({
          name: currentBox.name,
          description: currentBox.description || "",
          price: currentBox.price.toString(),
          size: currentBox.size || "",
          sizeText: currentBox.sizeText || "",
          boxType: currentBox.boxType || "BOKS",
          isAvailable: currentBox.isAvailable ?? true,
          maxHorseSize: currentBox.maxHorseSize || "",
          specialNotes: currentBox.specialNotes || "",
          images: currentBox.images || [],
          selectedAmenityIds: amenityIds,
          dagsleie: 'dagsleie' in currentBox ? (currentBox as typeof currentBox & { dagsleie?: boolean }).dagsleie ?? false : false,
        });
        setSelectedImagesCount(currentBox.images?.length || 0);
      } else {
        // Creating new box - reset to initial state
        setFormData({
          name: "",
          description: "",
          price: "",
          size: "",
          sizeText: "",
          boxType: "BOKS",
          isAvailable: true,
          maxHorseSize: "",
          specialNotes: "",
          images: [],
          selectedAmenityIds: [],
          dagsleie: false,
        });
        setSelectedImagesCount(0);
      }
      // Clear any previous errors when modal opens
      setError(null);
      setValidationErrors([]);
    }
  }, [open, currentBox]);

  // Clear validation errors when user fixes issues
  useEffect(() => {
    const errors: string[] = [];

    // Check images - only require for new boxes (not when editing)
    if (!currentBox && selectedImagesCount === 0) {
      errors.push("Last opp minst ett bilde");
    }

    setValidationErrors(errors);
  }, [selectedImagesCount, currentBox]); // Trigger when these change

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;

      // Check for conflicts when toggling availability
      if (name === "isAvailable" && !checkbox.checked && currentBox) {
        // Allow the change - conflict checking can be implemented later if needed
      }

      setFormData((prev) => ({
        ...prev,
        [name]: checkbox.checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImagesChange = (images: string[]) => {
    setFormData((prev) => ({
      ...prev,
      images,
    }));
  };

  const handleAmenityToggle = (amenityId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedAmenityIds: prev.selectedAmenityIds.includes(amenityId)
        ? prev.selectedAmenityIds.filter((id) => id !== amenityId)
        : [...prev.selectedAmenityIds, amenityId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);

    const errors: string[] = [];

    // Check for missing images - only require for new boxes
    if (!currentBox && selectedImagesCount === 0) {
      errors.push("Last opp minst ett bilde");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      // Upload any pending images first
      const imageUrls = (await imageUploadRef.current?.uploadPendingImages()) || formData.images;

      if (box) {
        // Update existing box
        const updateData = {
          id: box.id,
          name: formData.name,
          description: formData.description || undefined,
          price: parseInt(formData.price),
          size: formData.size ? (formData.size as "SMALL" | "MEDIUM" | "LARGE") : undefined,
          sizeText: formData.sizeText || undefined,
          boxType: formData.boxType,
          isAvailable: formData.isAvailable,
          maxHorseSize: formData.maxHorseSize || undefined,
          specialNotes: formData.specialNotes || undefined,
          images: imageUrls,
          imageDescriptions: [], // Image descriptions handled by UnifiedImageUpload component
          amenityIds: formData.selectedAmenityIds,
          dagsleie: formData.dagsleie,
        };
        await updateBox.mutateAsync(updateData);
      } else {
        // Create new box
        const createData = {
          stableId,
          name: formData.name,
          description: formData.description || undefined,
          price: parseInt(formData.price),
          size: formData.size ? (formData.size as "SMALL" | "MEDIUM" | "LARGE") : undefined,
          sizeText: formData.sizeText || undefined,
          boxType: formData.boxType,
          isAvailable: formData.isAvailable,
          maxHorseSize: formData.maxHorseSize || undefined,
          specialNotes: formData.specialNotes || undefined,
          images: imageUrls,
          imageDescriptions: [], // Image descriptions handled by UnifiedImageUpload component
          amenityIds: formData.selectedAmenityIds,
          dagsleie: formData.dagsleie,
        };
        await createBox.mutateAsync(createData);
      }

      onSave();
      handleClose();
    } catch (error) {
      console.error("Error saving box:", error);
      setError(
        `Feil ved lagring av boks: ${error instanceof Error ? error.message : "Ukjent feil"}`
      );
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={box ? "Rediger stallplass" : "Legg til ny stallplass"}
      maxWidth="md"
    >
      <>
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-md">
            <p className="text-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" data-cy="box-management-form">

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Grunnleggende informasjon</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Navn på stallplass *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="F.eks. Boks 1, Premium Stall A"
                  data-cy="box-name-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Pris per måned *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">kr</span>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="5000"
                      data-cy="box-price-input"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="boxType" className="block text-sm font-medium text-gray-700 mb-2">
                    Type stallplass *
                  </label>
                  <select
                    id="boxType"
                    name="boxType"
                    value={formData.boxType}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        boxType: e.target.value as "BOKS" | "UTEGANG"
                      }));
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    data-cy="box-type-select"
                  >
                    <option value="BOKS">Boks</option>
                    <option value="UTEGANG">Utegang</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Size and Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Størrelse og detaljer</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                    Størrelse
                  </label>
                  <select
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, size: e.target.value }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    data-cy="box-size-select"
                  >
                    <option value="">Ikke spesifisert</option>
                    <option value="SMALL">Liten</option>
                    <option value="MEDIUM">Middels (~3x3m)</option>
                    <option value="LARGE">Stor</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="maxHorseSize" className="block text-sm font-medium text-gray-700 mb-2">
                    Maks hestestørrelse
                  </label>
                  <select
                    id="maxHorseSize"
                    name="maxHorseSize"
                    value={formData.maxHorseSize}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, maxHorseSize: e.target.value }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    data-cy="box-max-horse-size-select"
                  >
                    <option value="">Ikke spesifisert</option>
                    <option value="Pony">Ponni</option>
                    <option value="Small">Liten hest</option>
                    <option value="Medium">Middels hest</option>
                    <option value="Large">Stor hest</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="sizeText" className="block text-sm font-medium text-gray-700 mb-2">
                  Detaljert størrelsesbeskrivelse
                </label>
                <input
                  type="text"
                  id="sizeText"
                  name="sizeText"
                  value={formData.sizeText}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="F.eks. 3.5x3.5m, innvendige mål 12m², med høyt tak"
                  data-cy="box-size-text-input"
                />
                <p className="mt-1 text-sm text-gray-500">Gi mer detaljert informasjon om størrelsen</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Beskrivelse</h3>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
              <p className="text-sm text-amber-800">
                <strong>NB!</strong> Du kan kun beskrive én stallplass i beskrivelsen. 
                Du kan ikke legge ut en stallplass som sier at det er flere ledige.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Beskrivelse
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Beskriv spesielle egenskaper ved denne stallplassen..."
                  data-cy="box-description-textarea"
                />
              </div>

              <div>
                <label htmlFor="specialNotes" className="block text-sm font-medium text-gray-700 mb-2">
                  Spesielle merknader
                </label>
                <textarea
                  id="specialNotes"
                  name="specialNotes"
                  value={formData.specialNotes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Eventuelle krav eller viktig informasjon..."
                />
              </div>
            </div>
          </div>

          {/* Availability Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isAvailable"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  data-cy="box-available-checkbox"
                />
                <label htmlFor="isAvailable" className="text-sm text-gray-700">
                  <span className="font-medium">Tilgjengelig for leie</span>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Marker som ledig eller opptatt
                  </div>
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="dagsleie"
                  name="dagsleie"
                  checked={formData.dagsleie}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  data-cy="box-dagsleie-checkbox"
                />
                <label htmlFor="dagsleie" className="text-sm text-gray-700">
                  <span className="font-medium">Tilbys som dagsleie</span>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Stallplassen kan leies for kortere perioder
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Amenities Selection */}
          {amenities.length > 0 && (
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-3">Fasiliteter</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {amenities.map((amenity: { id: string; name: string }) => (
                  <label
                    key={amenity.id}
                    className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedAmenityIds.includes(amenity.id)}
                      onChange={() => handleAmenityToggle(amenity.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      data-cy={`box-amenity-${amenity.id}`}
                    />
                    <span className="text-sm text-gray-700">{amenity.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Bilder av stallplass {!currentBox && <span className="text-red-500">*</span>}
            </div>
            <UnifiedImageUpload
              ref={imageUploadRef}
              images={formData.images}
              onChange={handleImagesChange}
              selectedImageCountFunc={(count) => {
                setSelectedImagesCount(count);
              }}
              maxImages={10}
              entityType="box"
              title="Administrer stallplassbilder"
              mode="inline"
              hideUploadButton={true}
            />
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              {validationErrors.map((error) => (
                <p key={error} className="text-red-600 text-sm">
                  • {error}
                </p>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              data-cy="cancel-box-button"
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createBox.isPending || updateBox.isPending}
              data-cy="save-box-button"
            >
              {(() => {
                if (createBox.isPending || updateBox.isPending) {
                  return "Lagrer...";
                }
                if (box) {
                  return "Lagre endringer";
                }
                return "Opprett stallplass";
              })()}
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <FeedbackLink />
          </div>
        </form>
      </>
    </Modal>
  );
}

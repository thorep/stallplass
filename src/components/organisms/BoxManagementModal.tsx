"use client";

import { Modal } from "@/components/ui/modal";
import { UnifiedImageUpload, UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import { useBoxAmenities } from "@/hooks/useAmenities";
import { useCreateBox, useUpdateBox } from "@/hooks/useBoxMutations";
import { Box, BoxWithAmenities } from "@/types/stable";
import {
  CheckCircleIcon,
  HomeIcon,
  InformationCircleIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import {
  Alert,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
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
  });

  // Amenities are now loaded via TanStack Query

  // Pre-fill form if editing existing box (use real-time data)
  useEffect(() => {
    if (currentBox) {
      // Extract amenity IDs from the box's amenities
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
      });
    }
  }, [currentBox]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;

      // Check for conflicts when toggling availability
      if (name === "isAvailable" && !checkbox.checked && currentBox) {
        // TODO: Implement conflict checking logic
        // For now, just allow the change
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
          imageDescriptions: [], // TODO: Handle descriptions from ImageGalleryManager
          amenityIds: formData.selectedAmenityIds,
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
          imageDescriptions: [], // TODO: Handle descriptions from ImageGalleryManager
          amenityIds: formData.selectedAmenityIds,
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
      <div>
        <form onSubmit={handleSubmit} className="space-y-0">
          {error && (
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Section 1: Basic Information */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-4">
              <HomeIcon className="h-5 w-5 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-900">Grunnleggende informasjon</h3>
            </div>

            <div className="space-y-6">
              <TextField
                fullWidth
                label="Navn på stallplass"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="F.eks. Boks 1, Premium Stall A"
                size="small"
                data-cy="box-name-input"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "0.5rem",
                  },
                  mb: 4,
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  label="Pris per måned"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  placeholder="5000"
                  size="small"
                  data-cy="box-price-input"
                  InputProps={{
                    startAdornment: <span className="text-slate-500 mr-1">kr</span>,
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "0.5rem",
                    },
                  }}
                />

                <FormControl fullWidth size="small" required>
                  <InputLabel>Type stallplass</InputLabel>
                  <Select
                    name="boxType"
                    value={formData.boxType}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        boxType: e.target.value as "BOKS" | "UTEGANG",
                      }));
                    }}
                    label="Type stallplass"
                    data-cy="box-type-select"
                    sx={{
                      borderRadius: "0.5rem",
                    }}
                  >
                    <MenuItem value="BOKS">Boks</MenuItem>
                    <MenuItem value="UTEGANG">Utegang</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
          </div>

          {/* Section 2: Size and Details */}
          <div className="bg-white  ">
            <div className="flex items-center gap-2 mb-4">
              <InformationCircleIcon className="h-5 w-5 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-900">Størrelse og detaljer</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormControl fullWidth size="small">
                  <InputLabel>Størrelse</InputLabel>
                  <Select
                    name="size"
                    value={formData.size}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, size: e.target.value as string }));
                    }}
                    label="Størrelse"
                    data-cy="box-size-select"
                    sx={{ borderRadius: "0.5rem" }}
                  >
                    <MenuItem value="">Ikke spesifisert</MenuItem>
                    <MenuItem value="SMALL">Liten</MenuItem>
                    <MenuItem value="MEDIUM">Middels (~3x3m)</MenuItem>
                    <MenuItem value="LARGE">Stor</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Maks hestestørrelse</InputLabel>
                  <Select
                    name="maxHorseSize"
                    value={formData.maxHorseSize}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, maxHorseSize: e.target.value as string }));
                    }}
                    label="Maks hestestørrelse"
                    data-cy="box-max-horse-size-select"
                    sx={{ borderRadius: "0.5rem" }}
                  >
                    <MenuItem value="">Ikke spesifisert</MenuItem>
                    <MenuItem value="Pony">Ponni</MenuItem>
                    <MenuItem value="Small">Liten hest</MenuItem>
                    <MenuItem value="Medium">Middels hest</MenuItem>
                    <MenuItem value="Large">Stor hest</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <TextField
                fullWidth
                label="Detaljert størrelsesbeskrivelse"
                name="sizeText"
                value={formData.sizeText}
                onChange={handleInputChange}
                placeholder="F.eks. 3.5x3.5m, innvendige mål 12m², med høyt tak"
                size="small"
                helperText="Gi mer detaljert informasjon om størrelsen"
                data-cy="box-size-text-input"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "0.5rem",
                  },
                }}
              />
            </div>
          </div>

          {/* Section 3: Description */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-4">
              <InformationCircleIcon className="h-5 w-5 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-900">Beskrivelse</h3>
            </div>

            <div className="space-y-6">
              <TextField
                fullWidth
                label="Beskrivelse"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                placeholder="Beskriv spesielle egenskaper ved denne stallplassen..."
                size="small"
                data-cy="box-description-textarea"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "0.5rem",
                  },
                  mb: 3,
                }}
              />

              <TextField
                fullWidth
                label="Spesielle merknader"
                name="specialNotes"
                value={formData.specialNotes}
                onChange={handleInputChange}
                multiline
                rows={2}
                placeholder="Eventuelle krav eller viktig informasjon..."
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "0.5rem",
                  },
                }}
              />
            </div>
          </div>

          {/* Section 4: Status */}
          <div className="bg-white border-b border-slate-200 py-6">
            <div className="flex items-center justify-between">
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isAvailable}
                    onChange={handleInputChange}
                    name="isAvailable"
                    data-cy="box-available-checkbox"
                    color="success"
                  />
                }
                label={
                  <div>
                    <span className="text-sm font-medium text-slate-900">
                      Tilgjengelig for leie
                    </span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Marker som ledig eller opptatt
                    </div>
                  </div>
                }
              />
              {formData.isAvailable && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
            </div>
          </div>

          {/* Section 5: Amenities */}
          {amenities.length > 0 && (
            <div className="bg-white border-b border-slate-200 py-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900 mb-1">Fasiliteter</h3>
                <p className="text-sm text-slate-600">Velg fasiliteter som er tilgjengelige</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity: { id: string; name: string }) => (
                  <Chip
                    key={amenity.id}
                    label={amenity.name}
                    onClick={() => handleAmenityToggle(amenity.id)}
                    color={formData.selectedAmenityIds.includes(amenity.id) ? "primary" : "default"}
                    variant={
                      formData.selectedAmenityIds.includes(amenity.id) ? "filled" : "outlined"
                    }
                    size="small"
                    data-cy={`box-amenity-${amenity.id}`}
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: formData.selectedAmenityIds.includes(amenity.id)
                          ? undefined
                          : "rgba(0, 0, 0, 0.04)",
                      },
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 6: Images */}
          <div className="bg-white py-6">
            <div className="flex items-center gap-2 mb-4">
              <PhotoIcon className="h-5 w-5 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-900">Bilder</h3>
            </div>
            <UnifiedImageUpload
              ref={imageUploadRef}
              images={formData.images}
              onChange={handleImagesChange}
              maxImages={10}
              entityType="box"
              title="Bilder av stallplass"
              mode="inline"
              hideUploadButton={true}
            />
          </div>
        </form>
        {/* Fixed Footer Actions */}
        <Stack direction="row" spacing={2} marginBottom={10} justifyContent="flex-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleSubmit}
            disabled={createBox.isPending || updateBox.isPending}
            data-cy="save-box-button"
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {createBox.isPending || updateBox.isPending
              ? "Lagrer..."
              : box
              ? "Lagre endringer"
              : "Opprett stallplass"}
          </button>
        </Stack>
      </div>
    </Modal>
  );
}

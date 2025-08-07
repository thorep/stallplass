"use client";

import { Modal } from "@/components/ui/modal";
import { UnifiedImageUpload, UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import LocationSelector from "@/components/molecules/LocationSelector";
import type { Fylke, KommuneWithFylke } from "@/hooks/useLocationQueries";
import { useUpdateService } from "@/hooks/useServiceMutations";
import { getAllServiceTypes, ServiceType } from "@/lib/service-types";
import { ServiceWithDetails } from "@/types/service";
import { useEffect, useState, useRef } from "react";
import { 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  TextField,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import { 
  BriefcaseIcon,
  PhotoIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

interface ServiceArea {
  county: string;
  municipality?: string;
}

interface ServiceManagementModalProps {
  readonly service: ServiceWithDetails;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: () => void;
}

export default function ServiceManagementModal({
  service,
  open,
  onOpenChange,
  onSave,
}: ServiceManagementModalProps) {
  const handleClose = () => {
    onOpenChange(false);
  };
  
  const updateService = useUpdateService();
  const [error, setError] = useState<string | null>(null);
  const imageUploadRef = useRef<UnifiedImageUploadRef>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    service_type: "veterinarian" as ServiceType,
    price_range_min: "",
    price_range_max: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    areas: [] as ServiceArea[],
    images: [] as string[],
    is_active: true,
  });

  // Pre-fill form with service data
  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title || "",
        description: service.description || "",
        service_type: (service.serviceType || "veterinarian") as ServiceType,
        price_range_min: service.priceRangeMin?.toString() || "",
        price_range_max: service.priceRangeMax?.toString() || "",
        contact_name: service.contactName || "",
        contact_email: service.contactEmail || "",
        contact_phone: service.contactPhone || "",
        areas: service.areas.map((area) => ({
          county: area.county,
          municipality: area.municipality || "",
        })) || [{ county: "", municipality: "" }],
        images: service.images || [],
        is_active: service.isActive !== false,
      });
    }
  }, [service]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleAreaFylkeChange = (index: number, fylke: Fylke | null) => {
    setFormData((prev) => {
      const newAreas = [...prev.areas];
      newAreas[index] = {
        county: fylke?.id || "",
        municipality: "", // Reset municipality when county changes
      };
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
    setFormData((prev) => ({ ...prev, images }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    
    setError(null);

    try {
      // Upload any pending images first
      const imageUrls = await imageUploadRef.current?.uploadPendingImages() || formData.images;
      
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
        images: imageUrls,
        is_active: formData.is_active,
      };

      await updateService.mutateAsync({ id: service.id, data: serviceData });
      
      onSave();
      handleClose();
    } catch (error) {
      console.error('Error updating service:', error);
      setError(`Feil ved oppdatering av tjeneste: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
    }
  };

  return (
    <Modal 
      isOpen={open} 
      onClose={() => onOpenChange(false)}
      title="Rediger tjeneste"
      maxWidth="md"
    >
      <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-0">
          {error && (
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Section 1: Basic Information */}
          <div className="bg-white border-b border-slate-200 pb-6">
            <div className="flex items-center gap-2 mb-4">
              <BriefcaseIcon className="h-5 w-5 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-900">Grunnleggende informasjon</h3>
            </div>
            
            <div className="space-y-6">
              <TextField
                fullWidth
                label="Tittel"
                name="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                placeholder="f.eks. Veterinærtjenester i Oslo"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0.5rem',
                  },
                }}
              />
              
              <FormControl fullWidth size="small" required>
                <InputLabel>Tjenestetype</InputLabel>
                <Select
                  value={formData.service_type}
                  onChange={(e) => handleInputChange("service_type", e.target.value as ServiceType)}
                  label="Tjenestetype"
                  sx={{ borderRadius: '0.5rem' }}
                >
                  {getAllServiceTypes().map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Kontaktnavn eller firma"
                name="contact_name"
                value={formData.contact_name}
                onChange={(e) => handleInputChange("contact_name", e.target.value)}
                required
                placeholder="f.eks. Dr. Kari Nordmann"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0.5rem',
                  },
                }}
              />
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="bg-white border-b border-slate-200 py-6">
            <div className="flex items-center gap-2 mb-4">
              <InformationCircleIcon className="h-5 w-5 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-900">Kontaktinformasjon</h3>
            </div>
            
            <div className="space-y-4">
              <TextField
                fullWidth
                label="E-post (valgfritt)"
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange("contact_email", e.target.value)}
                placeholder="kontakt@eksempel.no"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0.5rem',
                  },
                }}
              />
              
              <TextField
                fullWidth
                label="Telefon (valgfritt)"
                name="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                placeholder="+47 123 45 678"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0.5rem',
                  },
                }}
              />
            </div>
          </div>

          {/* Section 3: Description */}
          <div className="bg-white border-b border-slate-200 py-6">
            <div className="flex items-center gap-2 mb-4">
              <InformationCircleIcon className="h-5 w-5 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-900">Beskrivelse</h3>
            </div>
            
            <TextField
              fullWidth
              label="Beskrivelse"
              name="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              multiline
              rows={6}
              required
              placeholder="Beskriv dine tjenester, erfaring, og hva du tilbyr..."
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '0.5rem',
                },
              }}
            />
          </div>

          {/* Section 4: Price Range */}
          <div className="bg-white border-b border-slate-200 py-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Prisområde (valgfritt)</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <TextField
                fullWidth
                label="Fra (NOK)"
                name="price_range_min"
                type="number"
                value={formData.price_range_min}
                onChange={(e) => handleInputChange("price_range_min", e.target.value)}
                placeholder="0"
                size="small"
                inputProps={{ min: 0 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0.5rem',
                  },
                }}
              />
              
              <TextField
                fullWidth
                label="Til (NOK)"
                name="price_range_max"
                type="number"
                value={formData.price_range_max}
                onChange={(e) => handleInputChange("price_range_max", e.target.value)}
                placeholder="0"
                size="small"
                inputProps={{ min: 0 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0.5rem',
                  },
                }}
              />
            </div>
          </div>

          {/* Section 5: Service Areas */}
          <div className="bg-white border-b border-slate-200 py-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Dekningsområder</h3>
              <p className="text-sm text-slate-600">
                Velg områder hvor du tilbyr tjenester
              </p>
            </div>
            
            <div className="space-y-4">
              {formData.areas.map((area, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-medium text-slate-900">Område {index + 1}</h4>
                    {formData.areas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArea(index)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <LocationSelector
                    selectedFylkeId={area.county || undefined}
                    selectedKommuneId={area.municipality || undefined}
                    onFylkeChange={(fylke) => handleAreaFylkeChange(index, fylke)}
                    onKommuneChange={(kommune) => handleAreaKommuneChange(index, kommune)}
                    disabled={updateService.isPending}
                  />
                </div>
              ))}
              
              <button
                type="button"
                onClick={addArea}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-lg hover:border-slate-400 hover:text-slate-700"
                disabled={updateService.isPending}
              >
                <PlusIcon className="h-4 w-4" />
                Legg til område
              </button>
            </div>
          </div>

          {/* Section 6: Active Status */}
          <div className="bg-white border-b border-slate-200 py-6">
            <div className="flex items-center justify-between">
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange("is_active", e.target.checked)}
                    name="is_active"
                    color="success"
                  />
                }
                label={
                  <div>
                    <span className="text-sm font-medium text-slate-900">Tjenesten er aktiv</span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Synlig for kunder når aktivert
                    </div>
                  </div>
                }
              />
              {formData.is_active && (
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              )}
            </div>
          </div>

          {/* Section 7: Images */}
          <div className="bg-white py-6">
            <div className="flex items-center gap-2 mb-4">
              <PhotoIcon className="h-5 w-5 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-900">Bilder</h3>
            </div>
            <UnifiedImageUpload
              ref={imageUploadRef}
              images={formData.images}
              onChange={handleImagesChange}
              maxImages={6}
              entityType="service"
              title="Administrer tjenestebilder"
              mode="inline"
              hideUploadButton={true}
            />
          </div>
        </form>
      </div>
      
      {/* Fixed Footer Actions */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 px-3 py-4 sm:px-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Avbryt
        </button>
        <button
          onClick={handleSubmit}
          disabled={updateService.isPending}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {updateService.isPending ? "Lagrer..." : "Lagre endringer"}
        </button>
      </div>
    </Modal>
  );
}
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase-auth-context';
import { ServiceWithDetails } from '@/types/service';
import Button from '@/components/atoms/Button';
import ImageUpload from '@/components/molecules/ImageUpload';
import LocationSelector from '@/components/molecules/LocationSelector';
import { StorageService } from '@/services/storage-service';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { Fylke, KommuneWithFylke } from '@/hooks/useLocationQueries';
import { getAllServiceTypes, ServiceType } from '@/lib/service-types';

interface ServiceFormProps {
  service?: ServiceWithDetails;
  onSuccess?: (service: ServiceWithDetails) => void;
  onCancel?: () => void;
}

interface ServiceArea {
  fylke: Fylke | null;
  kommune: KommuneWithFylke | null;
  // Legacy fields for API compatibility
  county: string;
  municipality?: string;
}

export default function ServiceForm({ service, onSuccess, onCancel }: ServiceFormProps) {
  const { user, getIdToken } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    service_type: ServiceType;
    price_range_min: string;
    price_range_max: string;
    areas: ServiceArea[];
    photos: string[];
    is_active: boolean;
  }>({
    title: service?.title || '',
    description: service?.description || '',
    service_type: (service?.serviceType || 'veterinarian') as ServiceType,
    price_range_min: service?.priceRangeMin?.toString() || '',
    price_range_max: service?.priceRangeMax?.toString() || '',
    areas: service?.areas.map(area => ({ 
      fylke: null, // Will be populated from legacy data
      kommune: null, // Will be populated from legacy data 
      county: area.county, 
      municipality: area.municipality || '' 
    })) || [{ fylke: null, kommune: null, county: '', municipality: '' }],
    photos: service?.photos?.map(p => p.photoUrl) || [] as string[],
    is_active: service?.isActive !== false
  });
  
  const [loading, setLoading] = useState(false);
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
        } catch {
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
        e.returnValue = 'Du har ulagrede bilder. Er du sikker på at du vil forlate siden?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (hasUnsavedImages.current && !cleanupInProgress.current) {
      }
    };
  }, [cleanupUploadedImages]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleAreaFylkeChange = (index: number, fylke: Fylke | null) => {
    const newAreas: ServiceArea[] = [...formData.areas];
    newAreas[index] = { 
      fylke,
      kommune: null,
      county: fylke?.navn || '',
      municipality: ''
    };
    setFormData(prev => ({ ...prev, areas: newAreas }));
  };

  const handleAreaKommuneChange = (index: number, kommune: KommuneWithFylke | null) => {
    const newAreas: ServiceArea[] = [...formData.areas];
    newAreas[index] = { 
      ...newAreas[index], 
      kommune,
      municipality: kommune?.navn || ''
    };
    setFormData(prev => ({ ...prev, areas: newAreas }));
  };

  const addArea = () => {
    setFormData(prev => ({
      ...prev,
      areas: [...prev.areas, { fylke: null, kommune: null, county: '', municipality: '' }]
    }));
  };

  const removeArea = (index: number) => {
    if (formData.areas.length > 1) {
      const newAreas = formData.areas.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, areas: newAreas }));
    }
  };

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({ ...prev, photos: images }));
    hasUnsavedImages.current = true;
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Tittel er påkrevd');
      return false;
    }

    if (!formData.description.trim()) {
      setError('Beskrivelse er påkrevd');
      return false;
    }

    if (!formData.service_type) {
      setError('Tjenestetype er påkrevd');
      return false;
    }

    // Validate that at least one area has a county selected
    const validAreas = formData.areas.filter(area => area.county && area.county.trim() !== '');
    if (validAreas.length === 0) {
      setError('Minst ett dekningsområde er påkrevd');
      return false;
    }

    // Validate price ranges
    if (formData.price_range_min && formData.price_range_max) {
      const min = parseFloat(formData.price_range_min);
      const max = parseFloat(formData.price_range_max);
      if (min > max) {
        setError('Minimum pris kan ikke være høyere enn maksimum pris');
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

    if (!user) {
      setError('Du må være logget inn for å opprette en tjeneste');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare the data
      const validAreas = formData.areas.filter(area => area.fylke !== null);
      
      const serviceData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        service_type: formData.service_type,
        price_range_min: formData.price_range_min ? parseFloat(formData.price_range_min) : undefined,
        price_range_max: formData.price_range_max ? parseFloat(formData.price_range_max) : undefined,
        areas: validAreas,
        photos: formData.photos,
        is_active: formData.is_active
      };

      const token = await getIdToken();
      const url = service ? `/api/services/${service.id}` : '/api/services';
      const method = service ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(serviceData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kunne ikke lagre tjenesten');
      }

      const result = await response.json();
      hasUnsavedImages.current = false; // Mark images as saved
      
      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push(`/tjenester/${result.id}`);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'En feil oppstod');
    } finally {
      setLoading(false);
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
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="f.eks. Veterinærtjenester i Oslo"
            disabled={loading}
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
            onChange={(e) => handleInputChange('service_type', e.target.value as ServiceType)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            disabled={loading}
          >
            {getAllServiceTypes().map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Beskrivelse *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={6}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Beskriv dine tjenester, erfaring, og hva du tilbyr..."
            disabled={loading}
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
                onChange={(e) => handleInputChange('price_range_min', e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Fra (NOK)"
                min="0"
                disabled={loading}
              />
            </div>
            <div>
              <input
                type="number"
                value={formData.price_range_max}
                onChange={(e) => handleInputChange('price_range_max', e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Til (NOK)"
                min="0"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Service Areas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dekningsområder *
          </label>
          {formData.areas.map((area, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-medium text-gray-900">
                  Område {index + 1}
                </h4>
                {formData.areas.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArea(index)}
                    disabled={loading}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <LocationSelector
                selectedFylkeId={area.fylke?.id || undefined}
                selectedKommuneId={area.kommune?.id || undefined}
                onFylkeChange={(fylke) => handleAreaFylkeChange(index, fylke)}
                onKommuneChange={(kommune) => handleAreaKommuneChange(index, kommune)}
                disabled={loading}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addArea}
            className="mt-2"
            disabled={loading}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Legg til område
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Velg fylke og eventuelt spesifikk kommune du tilbyr tjenester i. La kommune stå på &quot;Hele fylket&quot; hvis du dekker hele fylket.
          </p>
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bilder
          </label>
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
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
              disabled={loading}
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Tjenesten er aktiv og synlig for kunder
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4 pt-6">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Lagrer...' : service ? 'Oppdater tjeneste' : 'Opprett tjeneste'}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
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
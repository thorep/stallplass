'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UnifiedImageUpload, UnifiedImageUploadRef } from '@/components/ui/UnifiedImageUpload';
import { useCreateCareLog, useCreateExerciseLog, useCreateFeedingLog, useCreateMedicalLog, useCreateOtherLog, useCreateCustomLog, CreateLogData } from '@/hooks/useHorseLogs';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  horseId: string;
  horseName: string;
  logType: 'care' | 'exercise' | 'feeding' | 'medical' | 'other' | 'custom';
  customCategoryId?: string;
}

export function LogModal({ isOpen, onClose, horseId, horseName, logType, customCategoryId }: LogModalProps) {
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageUploadRef = useRef<UnifiedImageUploadRef>(null);

  const createCareLog = useCreateCareLog();
  const createExerciseLog = useCreateExerciseLog();
  const createFeedingLog = useCreateFeedingLog();
  const createMedicalLog = useCreateMedicalLog();
  const createOtherLog = useCreateOtherLog();
  const createCustomLog = useCreateCustomLog();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast.error('Beskrivelse er påkrevd');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload any pending images first
      const imageUrls = await imageUploadRef.current?.uploadPendingImages() || images;
      
      const logData: CreateLogData = {
        description: description.trim(),
        images: imageUrls,
        imageDescriptions: [], // Not handling descriptions for horse logs yet
      };

      if (logType === 'care') {
        await createCareLog.mutateAsync({ horseId, data: logData });
        toast.success('Stell-logg lagt til');
      } else if (logType === 'exercise') {
        await createExerciseLog.mutateAsync({ horseId, data: logData });
        toast.success('Trenings-logg lagt til');
      } else if (logType === 'feeding') {
        await createFeedingLog.mutateAsync({ horseId, data: logData });
        toast.success('Fôrings-logg lagt til');
      } else if (logType === 'medical') {
        await createMedicalLog.mutateAsync({ horseId, data: logData });
        toast.success('Medisinsk logg lagt til');
      } else if (logType === 'custom' && customCategoryId) {
        await createCustomLog.mutateAsync({ horseId, categoryId: customCategoryId, data: logData });
        toast.success('Logg lagt til');
      } else {
        await createOtherLog.mutateAsync({ horseId, data: logData });
        toast.success('Annen logg lagt til');
      }

      // Reset form
      setDescription('');
      setImages([]);
      onClose();
    } catch (error) {
      const logTypeText = logType === 'care' ? 'stell' 
        : logType === 'exercise' ? 'trenings'
        : logType === 'feeding' ? 'fôrings'
        : logType === 'medical' ? 'medisinsk'
        : logType === 'custom' ? 'egendefinert'
        : 'annen';
      toast.error(`Kunne ikke legge til ${logTypeText}-logg`);
      console.error(`Error creating ${logType} log:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image upload changes
  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages);
  };

  if (!isOpen) return null;

  const title = logType === 'care' ? 'Legg til stell-logg' 
    : logType === 'exercise' ? 'Legg til trenings-logg'
    : logType === 'feeding' ? 'Legg til fôrings-logg'
    : logType === 'medical' ? 'Legg til medisinsk logg'
    : 'Legg til annen logg';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-h3">{title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Horse info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-body-sm text-gray-600">
                {logType === 'care' ? 'Stell-logg for' : 'Trenings-logg for'}: <span className="font-medium">{horseName}</span>
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Beskrivelse *
              </Label>
              <Textarea
                id="description"
                placeholder={
                  logType === 'care' 
                    ? 'Beskriv stellet som ble utført...' 
                    : 'Beskriv treningen som ble utført...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Images */}
            <div className="space-y-4">
              <Label>Bilder (valgfritt)</Label>
              <UnifiedImageUpload
                ref={imageUploadRef}
                images={images}
                onChange={handleImagesChange}
                maxImages={5}
                entityType="horse"
                title="Bilder av hesten"
                mode="inline"
                disabled={isSubmitting}
                hideUploadButton={true}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting 
                  ? (images.length > 0 ? 'Laster opp bilder...' : 'Lagrer...')
                  : 'Legg til logg'
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@mui/material';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDeleteHorse } from '@/hooks/useHorseMutations';
import { HorseWithOwner, HORSE_GENDER_LABELS } from '@/types/horse';
import { Trash2, FileText, Share } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface HorseCardProps {
  horse: HorseWithOwner;
}

export function HorseCard({ horse }: HorseCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteHorse = useDeleteHorse();
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Er du sikker på at du vil slette ${horse.name}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteHorse.mutateAsync(horse.id);
      toast.success(`${horse.name} ble slettet`);
    } catch (error) {
      toast.error('Kunne ikke slette hesten. Prøv igjen.');
      console.error('Error deleting horse:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getDisplayAge = () => {
    if (!horse.age) return null;
    return horse.age === 1 ? '1 år' : `${horse.age} år`;
  };

  const getDisplayHeight = () => {
    if (!horse.height) return null;
    return `${horse.height} cm`;
  };

  const handleView = () => {
    router.push(`/mine-hester/${horse.id}`);
  };


  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-h3">{horse.name}</CardTitle>
              {!horse.isOwner && (
                <Badge variant="secondary" className="text-xs">
                  <Share className="h-3 w-3 mr-1" />
                  Delt
                </Badge>
              )}
            </div>
            {horse.breed && (
              <p className="text-body-sm text-gray-600">{horse.breed}</p>
            )}
            {!horse.isOwner && horse.sharedBy && (
              <p className="text-body-sm text-gray-500 mt-1">
                Delt av {horse.sharedBy.nickname}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Horse image */}
        <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 relative overflow-hidden">
          {horse.images && horse.images.length > 0 ? (
            <Image
              src={horse.images[0]}
              alt={horse.imageDescriptions?.[0] || horse.name}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">🐴</div>
                <p className="text-body-sm">Ingen bilder lagt til</p>
              </div>
            </div>
          )}
        </div>

        {/* Horse details */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-body-sm">
            {horse.gender && (
              <div>
                <span className="text-gray-600">Kjønn:</span>
                <span className="ml-2 font-medium">
                  {HORSE_GENDER_LABELS[horse.gender]}
                </span>
              </div>
            )}
            {horse.age && (
              <div>
                <span className="text-gray-600">Alder:</span>
                <span className="ml-2 font-medium">{getDisplayAge()}</span>
              </div>
            )}
            {horse.color && (
              <div>
                <span className="text-gray-600">Farge:</span>
                <span className="ml-2 font-medium">{horse.color}</span>
              </div>
            )}
            {horse.height && (
              <div>
                <span className="text-gray-600">Høyde:</span>
                <span className="ml-2 font-medium">{getDisplayHeight()}</span>
              </div>
            )}
          </div>

          {horse.description && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-body-sm text-gray-700 line-clamp-3">
                {horse.description}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex gap-3 w-full">
          <Button
            variant="contained"
            color="primary"
            onClick={handleView}
            className="flex-1 h-12"
            startIcon={<FileText className="h-4 w-4" />}
          >
            Vis
          </Button>
          {horse.isOwner && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 h-12"
              startIcon={<Trash2 className="h-4 w-4" />}
            >
              {isDeleting ? 'Sletter...' : 'Slett'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
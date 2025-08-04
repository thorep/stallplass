'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeleteHorse } from '@/hooks/useHorseMutations';
import { HorseWithOwner, HORSE_GENDER_LABELS } from '@/types/horse';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface HorseCardProps {
  horse: HorseWithOwner;
  onEdit: (horse: HorseWithOwner) => void;
}

export function HorseCard({ horse, onEdit }: HorseCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteHorse = useDeleteHorse();

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


  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-h3 mb-1">{horse.name}</CardTitle>
            {horse.breed && (
              <p className="text-body-sm text-gray-600">{horse.breed}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {horse.isPublic ? (
              <div className="flex items-center gap-1" title="Offentlig profil">
                <Eye className="h-4 w-4 text-green-600" />
                <span className="text-body-sm text-green-600">Offentlig</span>
              </div>
            ) : (
              <div className="flex items-center gap-1" title="Privat profil">
                <EyeOff className="h-4 w-4 text-gray-400" />
                <span className="text-body-sm text-gray-400">Privat</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Horse image placeholder */}
        <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">🐴</div>
            <p className="text-body-sm">Bilde kommer snart</p>
          </div>
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
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(horse)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Rediger
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Sletter...' : 'Slett'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
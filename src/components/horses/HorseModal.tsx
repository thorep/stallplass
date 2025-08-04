'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HorseForm } from './HorseForm';
import { HorseWithOwner } from '@/types/horse';

interface HorseModalProps {
  isOpen: boolean;
  onClose: () => void;
  horse?: HorseWithOwner;
}

export function HorseModal({ isOpen, onClose, horse }: HorseModalProps) {
  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-h2">
            {horse ? `Rediger ${horse.name}` : 'Legg til ny hest'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <HorseForm
            horse={horse}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
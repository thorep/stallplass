'use client';

import { Modal } from '@/components/ui/modal';
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={horse ? `Rediger ${horse.name}` : 'Legg til ny hest'}
      maxWidth="lg"
    >
      <HorseForm
        horse={horse}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
}
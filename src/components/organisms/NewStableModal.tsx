"use client";

import NewStableForm from "@/components/organisms/NewStableForm";
import { Modal } from "@/components/ui/modal";
import { StableAmenity } from "@/types";
import type { User } from "@supabase/supabase-js";

interface NewStableModalProps {
  isOpen: boolean;
  onClose: () => void;
  amenities: StableAmenity[];
  user: User;
}

export default function NewStableModal({ isOpen, onClose, amenities, user }: NewStableModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Legg til ny stall"
      maxWidth="lg"
      dataCy="new-stable-modal"
    >
      <NewStableForm amenities={amenities} user={user} onSuccess={onClose} />
    </Modal>
  );
}

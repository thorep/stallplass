"use client";

import { Modal } from "@/components/ui/modal";
import PartLoanHorseForm from "@/components/organisms/PartLoanHorseForm";
import type { User } from "@supabase/supabase-js";
import { PartLoanHorse } from "@/hooks/usePartLoanHorses";

interface PartLoanHorseModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  partLoanHorse?: PartLoanHorse;
  mode?: "create" | "edit";
}

export default function PartLoanHorseModal({
  isOpen,
  onClose,
  user,
  partLoanHorse,
  mode = "create",
}: PartLoanHorseModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "edit" ? "Rediger fôrhest" : "Legg til ny fôrhest"}
      maxWidth="lg"
    >
      <PartLoanHorseForm 
        user={user} 
        onSuccess={onClose} 
        partLoanHorse={partLoanHorse}
        mode={mode}
      />
    </Modal>
  );
}
"use client";

import HorseSaleForm from "@/components/organisms/HorseSaleForm";
import { Modal } from "@/components/ui/modal";
import { HorseSale } from "@/hooks/useHorseSales";
import type { User } from "@supabase/supabase-js";

interface HorseSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  horseSale?: HorseSale;
  mode?: "create" | "edit";
}

export default function HorseSaleModal({
  isOpen,
  onClose,
  user,
  horseSale,
  mode = "create",
}: HorseSaleModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "edit" ? "Rediger annonse" : "Opprett ny annonse"}
      maxWidth="lg"
    >
      <HorseSaleForm user={user} onSuccess={onClose} horseSale={horseSale} mode={mode} />
    </Modal>
  );
}

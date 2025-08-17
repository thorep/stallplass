"use client";

import { Modal } from "@/components/ui/modal";
import HorseSaleForm from "@/components/organisms/HorseSaleForm";
import type { User } from "@supabase/supabase-js";
import { HorseSale } from "@/hooks/useHorseSales";

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
      title={mode === "edit" ? "Rediger hestesalg" : "Legg til ny hestesalg"}
      maxWidth="lg"
    >
      <HorseSaleForm 
        user={user} 
        onSuccess={onClose} 
        horseSale={horseSale}
        mode={mode}
      />
    </Modal>
  );
}
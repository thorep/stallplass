"use client";

import { Modal } from "@/components/ui/modal";
import { CustomCategoriesManager } from "./CustomCategoriesManager";

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  horseId: string;
}

export function CategoryManagementModal({
  isOpen,
  onClose,
  horseId,
}: Readonly<CategoryManagementModalProps>) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Administrer kategorier"
      maxWidth="lg"
      dataCy="category-management-modal"
    >
      <CustomCategoriesManager horseId={horseId} />
    </Modal>
  );
}
"use client";

import { Modal } from "@/components/ui/modal";
import { CustomCategoriesManager } from "./CustomCategoriesManager";

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  horseId: string;
  categories: { id: string; name: string; description?: string; icon: string; color: string; isActive: boolean; sortOrder: number; _count?: { logs: number } }[];
  onCategoryChange?: () => void;
}

export function CategoryManagementModal({
  isOpen,
  onClose,
  horseId,
  categories,
  onCategoryChange,
}: Readonly<CategoryManagementModalProps>) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Administrer kategorier"
      maxWidth="lg"
      dataCy="category-management-modal"
    >
      <CustomCategoriesManager
        horseId={horseId}
        categories={categories}
        onCategoryCreated={onCategoryChange}
        onCategoryUpdated={onCategoryChange}
        onCategoryDeleted={onCategoryChange}
      />
    </Modal>
  );
}
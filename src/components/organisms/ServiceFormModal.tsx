"use client";

import { Modal } from "@/components/ui/modal";
import ServiceForm from "@/components/organisms/ServiceForm";
import { ServiceWithDetails } from "@/types/service";
import type { User } from "@supabase/supabase-js";

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: ServiceWithDetails;
  onSuccess?: (service: ServiceWithDetails) => void;
  user: User;
}

export default function ServiceFormModal({
  isOpen,
  onClose,
  service,
  onSuccess,
  user,
}: ServiceFormModalProps) {
  const handleSuccess = (updatedService: ServiceWithDetails) => {
    if (onSuccess) {
      onSuccess(updatedService);
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={service ? "Rediger tjeneste" : "Opprett ny tjeneste"}
      maxWidth="lg"
    >
      <ServiceForm
        service={service}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        user={user}
      />
    </Modal>
  );
}
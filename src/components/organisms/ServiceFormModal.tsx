"use client";

import { Modal } from "@/components/ui/modal";
import ServiceForm from "@/components/organisms/ServiceForm";
import { ServiceWithDetails } from "@/types/service";

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: ServiceWithDetails;
  onSuccess?: (service: ServiceWithDetails) => void;
}

export default function ServiceFormModal({
  isOpen,
  onClose,
  service,
  onSuccess,
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
      />
    </Modal>
  );
}
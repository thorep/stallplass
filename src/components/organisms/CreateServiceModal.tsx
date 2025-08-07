"use client";

import { ServiceWithDetails } from "@/types/service";
import { Modal } from "@/components/ui/modal";
import ServiceForm from "./ServiceForm";
import type { User } from "@supabase/supabase-js";

interface CreateServiceModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: (service: ServiceWithDetails) => void;
  readonly user: User; // User is guaranteed to be authenticated by server-side auth
}

export default function CreateServiceModal({
  open,
  onOpenChange,
  onSuccess,
  user,
}: CreateServiceModalProps) {

  const handleSuccess = (service: ServiceWithDetails) => {
    onOpenChange(false);
    if (onSuccess) {
      onSuccess(service);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Opprett ny tjeneste"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <p className="text-body-sm text-gray-600">
          Opprett en annonse for dine veterinær-, hovslagare- eller trenertjenester
        </p>
        
        <ServiceForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </Modal>
  );
}
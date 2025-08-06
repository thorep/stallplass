"use client";

import { ServiceWithDetails } from "@/types/service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw] max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-h3">Opprett ny tjeneste</DialogTitle>
          <DialogDescription className="text-body-sm">
            Opprett en annonse for dine veterinær-, hovslagare- eller trenertjenester
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto mt-6 pr-2">
          <ServiceForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
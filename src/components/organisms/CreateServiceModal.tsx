"use client";

import { useAuth } from "@/lib/supabase-auth-context";
import { ServiceWithDetails } from "@/types/service";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ServiceForm from "./ServiceForm";

interface CreateServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (service: ServiceWithDetails) => void;
}

export default function CreateServiceModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateServiceModalProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSuccess = (service: ServiceWithDetails) => {
    onOpenChange(false);
    if (onSuccess) {
      onSuccess(service);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Don't render anything while auth is loading
  if (loading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push("/logg-inn");
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-4xl max-h-[95vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-h3">Opprett ny tjeneste</DialogTitle>
          <DialogDescription className="text-body-sm">
            Opprett en annonse for dine veterinær-, hovslagare- eller trenertjenester
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6">
          <ServiceForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
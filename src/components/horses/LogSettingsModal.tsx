"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useUpdateHorse } from "@/hooks/useHorseMutations";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";


interface LogSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  horseId: string;
  currentDisplayMode: string;
}

export function LogSettingsModal({ 
  isOpen, 
  onClose, 
  horseId, 
  currentDisplayMode
}: Readonly<LogSettingsModalProps>) {
  const [displayMode, setDisplayMode] = useState(currentDisplayMode);
  const updateHorse = useUpdateHorse();

  const handleSave = async () => {
    try {
      await updateHorse.mutateAsync({
        id: horseId,
        data: { 
          logDisplayMode: displayMode as "FULL" | "TRUNCATED",
        }
      });
      toast.success("Innstillinger oppdatert");
      onClose();
    } catch (error) {
      toast.error("Kunne ikke oppdatere innstillinger");
      console.error("Error updating settings:", error);
    }
  };

  const handleCancel = () => {
    setDisplayMode(currentDisplayMode);
    onClose();
  };

  // Check if there are any changes
  const hasChanges = () => {
    return displayMode !== currentDisplayMode;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Logg-visningsinnstillinger"
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Display Mode Settings */}
        <div>
          <Label className="text-body-sm font-medium">
            Hvordan skal logger vises?
          </Label>
          <p className="text-body-sm text-gray-600 mt-1 mb-3">
            Denne innstillingen gjelder for alle synlige seksjoner.
          </p>
          
          <RadioGroup
            value={displayMode}
            onValueChange={(value) => setDisplayMode(value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="FULL" id="full" />
              <Label htmlFor="full" className="text-body cursor-pointer">
                <span className="font-medium">Vis hele beskrivelsen</span>
                <br />
                <span className="text-body-sm text-gray-600">
                  Viser all tekst i loggene (anbefalt for korte logger)
                </span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="TRUNCATED" id="truncated" />
              <Label htmlFor="truncated" className="text-body cursor-pointer">
                <span className="font-medium">Vis forkortet beskrivelse</span>
                <br />
                <span className="text-body-sm text-gray-600">
                  Viser kun de første 200 tegnene (bedre for lange logger)
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>



        <div className="flex gap-2 pt-4 border-t">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateHorse.isPending || !hasChanges()}
            className="flex-1"
          >
            {updateHorse.isPending ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Check className="h-3 w-3 mr-1" />
            )}
            Lagre innstillinger
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={updateHorse.isPending}
            className="flex-1"
          >
            Avbryt
          </Button>
        </div>
      </div>
    </Modal>
  );
}
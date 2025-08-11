"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useUpdateHorse } from "@/hooks/useHorseMutations";
import { Check, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";

interface LogSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  horseId: string;
  currentDisplayMode: string;
  showCareSection: boolean;
  showExerciseSection: boolean;
  showFeedingSection: boolean;
  showMedicalSection: boolean;
  showOtherSection: boolean;
}

export function LogSettingsModal({ 
  isOpen, 
  onClose, 
  horseId, 
  currentDisplayMode,
  showCareSection,
  showExerciseSection,
  showFeedingSection,
  showMedicalSection,
  showOtherSection
}: Readonly<LogSettingsModalProps>) {
  const [displayMode, setDisplayMode] = useState(currentDisplayMode);
  const [sectionVisibility, setSectionVisibility] = useState({
    care: showCareSection ?? true,
    exercise: showExerciseSection ?? true,
    feeding: showFeedingSection ?? true,
    medical: showMedicalSection ?? true,
    other: showOtherSection ?? true,
  });
  const updateHorse = useUpdateHorse();

  const handleSave = async () => {
    try {
      await updateHorse.mutateAsync({
        id: horseId,
        data: { 
          logDisplayMode: displayMode as "FULL" | "TRUNCATED",
          showCareSection: sectionVisibility.care,
          showExerciseSection: sectionVisibility.exercise,
          showFeedingSection: sectionVisibility.feeding,
          showMedicalSection: sectionVisibility.medical,
          showOtherSection: sectionVisibility.other,
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
    setSectionVisibility({
      care: showCareSection ?? true,
      exercise: showExerciseSection ?? true,
      feeding: showFeedingSection ?? true,
      medical: showMedicalSection ?? true,
      other: showOtherSection ?? true,
    });
    onClose();
  };

  const handleSectionVisibilityChange = (section: keyof typeof sectionVisibility) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Check if there are any changes
  const hasChanges = () => {
    const hasDisplayModeChanges = displayMode !== currentDisplayMode;
    const hasSectionVisibilityChanges = 
      sectionVisibility.care !== showCareSection ||
      sectionVisibility.exercise !== showExerciseSection ||
      sectionVisibility.feeding !== showFeedingSection ||
      sectionVisibility.medical !== showMedicalSection ||
      sectionVisibility.other !== showOtherSection;
    
    
    return hasDisplayModeChanges || hasSectionVisibilityChanges;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Logg-visningsinnstillinger"
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Section Visibility Settings */}
        <div>
          <Label className="text-body-sm font-medium flex items-center gap-2 mb-3">
            <Eye className="h-4 w-4" />
            Hvilke seksjoner skal vises?
          </Label>
          <p className="text-body-sm text-gray-600 mb-4">
            Velg hvilke log-seksjoner som skal være synlige for alle som har tilgang til hesten.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="care"
                checked={sectionVisibility.care}
                onCheckedChange={() => handleSectionVisibilityChange('care')}
              />
              <Label htmlFor="care" className="text-body cursor-pointer font-medium">
                Stell og omsorg
              </Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="exercise"
                checked={sectionVisibility.exercise}
                onCheckedChange={() => handleSectionVisibilityChange('exercise')}
              />
              <Label htmlFor="exercise" className="text-body cursor-pointer font-medium">
                Trening og aktivitet
              </Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="feeding"
                checked={sectionVisibility.feeding}
                onCheckedChange={() => handleSectionVisibilityChange('feeding')}
              />
              <Label htmlFor="feeding" className="text-body cursor-pointer font-medium">
                Foring
              </Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="medical"
                checked={sectionVisibility.medical}
                onCheckedChange={() => handleSectionVisibilityChange('medical')}
              />
              <Label htmlFor="medical" className="text-body cursor-pointer font-medium">
                Medisinsk informasjon
              </Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="other"
                checked={sectionVisibility.other}
                onCheckedChange={() => handleSectionVisibilityChange('other')}
              />
              <Label htmlFor="other" className="text-body cursor-pointer font-medium">
                Annet
              </Label>
            </div>
          </div>
        </div>
        
        {/* Display Mode Settings */}
        <div className="border-t pt-6">
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

        <div className="flex gap-2 pt-4">
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
            Lagre
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
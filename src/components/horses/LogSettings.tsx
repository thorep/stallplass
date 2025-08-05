"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useUpdateHorse } from "@/hooks/useHorseMutations";
import { Settings, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LogSettingsProps {
  horseId: string;
  currentDisplayMode: string;
  canEdit: boolean;
}

export function LogSettings({ horseId, currentDisplayMode, canEdit }: LogSettingsProps) {
  const [displayMode, setDisplayMode] = useState(currentDisplayMode);
  const [isExpanded, setIsExpanded] = useState(false);
  const updateHorse = useUpdateHorse();

  const handleSave = async () => {
    try {
      await updateHorse.mutateAsync({
        id: horseId,
        data: { logDisplayMode: displayMode as "FULL" | "TRUNCATED" }
      });
      toast.success("Logg-visningsinnstillinger oppdatert");
      setIsExpanded(false);
    } catch (error) {
      toast.error("Kunne ikke oppdatere innstillinger");
      console.error("Error updating log display settings:", error);
    }
  };

  const handleCancel = () => {
    setDisplayMode(currentDisplayMode);
    setIsExpanded(false);
  };

  if (!canEdit) {
    return null; // Only show settings to users who can edit
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-h4">
            <Settings className="h-4 w-4" />
            Logg-visningsinnstillinger
          </CardTitle>
          {!isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="h-8 px-3 text-xs"
            >
              <Settings className="h-3 w-3 mr-1" />
              Endre
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isExpanded ? (
          <div className="space-y-4">
            <div>
              <Label className="text-body-sm font-medium">
                Hvordan skal logger vises?
              </Label>
              <p className="text-body-sm text-gray-600 mt-1 mb-3">
                Denne innstillingen gjelder for alle som har tilgang til hesten.
              </p>
            </div>
            
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

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateHorse.isPending || displayMode === currentDisplayMode}
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
        ) : (
          <div className="text-body-sm text-gray-600">
            <p>
              <span className="font-medium">Nåværende innstilling:</span>{" "}
              {currentDisplayMode === "FULL" 
                ? "Viser hele beskrivelsen i logger" 
                : "Viser forkortet beskrivelse (200 tegn)"
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
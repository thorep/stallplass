"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HorseCareLog, HorseExerciseLog, HorseFeedingLog, HorseMedicalLog, HorseOtherLog } from "@/hooks/useHorseLogs";
import { useUpdateHorseInstructions } from "@/hooks/useHorseMutations";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Activity, Calendar, Heart, Plus, Utensils, FileText, ClipboardList, User } from "lucide-react";
import { toast } from "sonner";
import { InlineEditableText } from "./InlineEditableText";

interface LogListProps {
  logs: (HorseCareLog | HorseExerciseLog | HorseFeedingLog | HorseMedicalLog | HorseOtherLog)[];
  logType: "care" | "exercise" | "feeding" | "medical" | "other";
  isLoading: boolean;
  onAddLog: () => void;
  horseId: string;
  instructions?: string | null;
}

export function LogList({
  logs,
  logType,
  isLoading,
  onAddLog,
  horseId,
  instructions,
}: LogListProps) {
  const updateInstructions = useUpdateHorseInstructions();

  const title = logType === "care" ? "Stell og omsorg" 
    : logType === "exercise" ? "Trening og aktivitet"
    : logType === "feeding" ? "Fôring"
    : logType === "medical" ? "Medisinsk informasjon"
    : "Annet";
  
  const icon = logType === "care" ? Heart 
    : logType === "exercise" ? Activity
    : logType === "feeding" ? Utensils
    : logType === "medical" ? FileText
    : ClipboardList;
  const Icon = icon;
  const emptyMessage = "Ingen logger lagt til ennå";
  const addButtonText = "Legg til logg";
  const instructionsPlaceholder = "Legg til instruksjoner";

  const handleSaveInstructions = async (value: string) => {
    try {
      const field = logType === "care" ? "careInstructions" 
        : logType === "exercise" ? "exerciseInstructions"
        : logType === "feeding" ? "feedingNotes"
        : logType === "medical" ? "medicalNotes"
        : "otherNotes";
      await updateInstructions.mutateAsync({ horseId, field, value });
      toast.success("Instruksjoner oppdatert");
    } catch (error) {
      toast.error("Kunne ikke oppdatere instruksjoner");
      throw error;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
          <Button onClick={onAddLog} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {addButtonText}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Instructions Section */}
        <div className="mb-6">
          <InlineEditableText
            value={instructions}
            onSave={handleSaveInstructions}
            placeholder={instructionsPlaceholder}
          />
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Icon className="h-12 w-12 mx-auto mb-3" />
              <p className="text-body text-gray-500">{emptyMessage}</p>
            </div>
            <Button onClick={onAddLog} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              {addButtonText}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4 text-body-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDistanceToNow(new Date(log.createdAt), {
                          addSuffix: true,
                          locale: nb,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{log.profile.nickname}</span>
                    </div>
                  </div>
                  <div className="text-body-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleDateString("no-NO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-body leading-relaxed whitespace-pre-wrap">{log.description}</p>

                  {log.images.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {log.images.map((image, index) => (
                        <div key={index} className="space-y-2">
                          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                            <img
                              src={image}
                              alt={log.imageDescriptions[index] || `Bilde ${index + 1}`}
                              className="max-w-full max-h-full object-contain rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="text-center text-gray-500">
                                      <div class="text-2xl mb-2">🖼️</div>
                                      <p class="text-body-sm">Kunne ikke laste bilde</p>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          </div>
                          {log.imageDescriptions[index] && (
                            <p className="text-body-sm text-gray-600">
                              {log.imageDescriptions[index]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

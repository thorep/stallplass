"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HorseCareLog, HorseExerciseLog, HorseFeedingLog, HorseMedicalLog, HorseOtherLog } from "@/hooks/useHorseLogs";
import { useUpdateHorseInstructions } from "@/hooks/useHorseMutations";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Activity, Calendar, Heart, Plus, Utensils, FileText, ClipboardList, User, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { InlineEditableText } from "./InlineEditableText";

interface LogListProps {
  logs: (HorseCareLog | HorseExerciseLog | HorseFeedingLog | HorseMedicalLog | HorseOtherLog)[];
  logType: "care" | "exercise" | "feeding" | "medical" | "other";
  isLoading: boolean;
  onAddLog: () => void;
  horseId: string;
  instructions?: string | null;
  displayMode?: string;
}

export function LogList({
  logs,
  logType,
  isLoading,
  onAddLog,
  horseId,
  instructions,
  displayMode = "FULL",
}: LogListProps) {
  const updateInstructions = useUpdateHorseInstructions();

  // Enhanced configuration with colors and styling
  const logTypeConfig = {
    care: {
      title: "Stell og omsorg",
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      badgeVariant: "secondary" as const,
      accentColor: "bg-pink-500"
    },
    exercise: {
      title: "Trening og aktivitet", 
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200", 
      badgeVariant: "secondary" as const,
      accentColor: "bg-blue-500"
    },
    feeding: {
      title: "Fôring",
      icon: Utensils,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      badgeVariant: "secondary" as const,
      accentColor: "bg-green-500"
    },
    medical: {
      title: "Medisinsk informasjon",
      icon: FileText,
      color: "text-red-600", 
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      badgeVariant: "secondary" as const,
      accentColor: "bg-red-500"
    },
    other: {
      title: "Annet",
      icon: ClipboardList,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50", 
      borderColor: "border-indigo-200",
      badgeVariant: "secondary" as const,
      accentColor: "bg-indigo-500"
    }
  };

  const config = logTypeConfig[logType];
  const Icon = config.icon;
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
      <Card className="shadow-sm border-0 ring-1 ring-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <span className="text-h3">{config.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 ring-1 ring-gray-200 hover:ring-gray-300 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <span className="text-h3">{config.title}</span>
          </CardTitle>
          <Button onClick={onAddLog} size="sm" className="shadow-sm">
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
          <div className="text-center py-12">
            <div className={cn("w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center", config.bgColor)}>
              <Icon className={cn("h-10 w-10", config.color)} />
            </div>
            <p className="text-body text-muted-foreground mb-6">{emptyMessage}</p>
            <Button onClick={onAddLog} variant="outline" className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              {addButtonText}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {logs.map((log) => (
              <div
                key={log.id}
                className="relative bg-card border border-border rounded-xl p-6 hover:shadow-md hover:border-muted-foreground/20 transition-all duration-200 group"
              >
                {/* Accent bar */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", config.accentColor)}></div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Badge variant={config.badgeVariant} className="text-caption font-medium">
                      <Icon className="h-3 w-3 mr-1" />
                      {config.title}
                    </Badge>
                    <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="font-medium text-foreground">{log.profile.nickname}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-body-sm text-muted-foreground mb-1">
                      {formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: true,
                        locale: nb,
                      })}
                    </div>
                    <div className="text-caption text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(log.createdAt).toLocaleDateString("no-NO", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="max-w-none">
                    <p className="text-body leading-relaxed whitespace-pre-wrap text-foreground">
                      {displayMode === "TRUNCATED" && log.description.length > 200 
                        ? `${log.description.slice(0, 200)}...` 
                        : log.description
                      }
                    </p>
                    {displayMode === "TRUNCATED" && log.description.length > 200 && (
                      <p className="text-body-sm text-muted-foreground italic">
                        Tekst forkortet til 200 tegn. Se innstillinger for å vise hele teksten.
                      </p>
                    )}
                  </div>

                  {log.images.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                        <span>Bilder ({log.images.length})</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {log.images.map((image, index) => (
                          <div key={`${log.id}-${index}`} className="space-y-2">
                            <div className="aspect-video bg-muted/50 rounded-xl flex items-center justify-center overflow-hidden border border-border group-hover:border-muted-foreground/20 transition-colors">
                              <img
                                src={image}
                                alt={log.imageDescriptions[index] || `Bilde ${index + 1}`}
                                className="max-w-full max-h-full object-contain rounded-xl hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="flex flex-col items-center text-muted-foreground">
                                        <div class="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-2">
                                          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                        <p class="text-caption text-center">Kunne ikke laste bilde</p>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            </div>
                            {log.imageDescriptions[index] && (
                              <p className="text-body-sm text-muted-foreground px-1">
                                {log.imageDescriptions[index]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
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

"use client";

import {
  HorseCareLog,
  HorseExerciseLog,
  HorseFeedingLog,
  HorseMedicalLog,
  HorseOtherLog,
} from "@/hooks/useHorseLogs";
import { useUpdateHorseInstructions } from "@/hooks/useHorseMutations";
import { cn } from "@/lib/utils";
import { Box, Button, Card, CardContent, CardHeader, Chip, Stack, Typography } from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Activity,
  Calendar,
  ClipboardList,
  FileText,
  Heart,
  ImageIcon,
  Plus,
  User,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { InlineEditableText } from "./InlineEditableText";

interface LogListProps {
  logs: (HorseCareLog | HorseExerciseLog | HorseFeedingLog | HorseMedicalLog | HorseOtherLog)[];
  logType: "care" | "exercise" | "feeding" | "medical" | "other";
  isLoading: boolean;
  onAddLog: () => void;
  horseId: string;
  instructions?: string | null;
  displayMode?: string;
  canAddLogs?: boolean;
}

export function LogList({
  logs,
  logType,
  isLoading,
  onAddLog,
  horseId,
  instructions,
  displayMode = "FULL",
  canAddLogs = true,
}: LogListProps) {
  const updateInstructions = useUpdateHorseInstructions();
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  // Enhanced configuration with colors and styling
  const logTypeConfig = {
    care: {
      title: "Stell og omsorg",
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      badgeVariant: "secondary" as const,
      accentColor: "bg-pink-500",
    },
    exercise: {
      title: "Trening og aktivitet",
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      badgeVariant: "secondary" as const,
      accentColor: "bg-blue-500",
    },
    feeding: {
      title: "Fôring",
      icon: Utensils,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      badgeVariant: "secondary" as const,
      accentColor: "bg-green-500",
    },
    medical: {
      title: "Medisinsk informasjon",
      icon: FileText,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      badgeVariant: "secondary" as const,
      accentColor: "bg-red-500",
    },
    other: {
      title: "Annet",
      icon: ClipboardList,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      badgeVariant: "secondary" as const,
      accentColor: "bg-indigo-500",
    },
  };

  const config = logTypeConfig[logType];
  const Icon = config.icon;
  const emptyMessage = "Ingen logger lagt til ennå";
  const addButtonText = "Legg til logg";
  const instructionsPlaceholder = "Legg til instruksjoner";

  const handleSaveInstructions = async (value: string) => {
    try {
      const field =
        logType === "care"
          ? "careInstructions"
          : logType === "exercise"
          ? "exerciseInstructions"
          : logType === "feeding"
          ? "feedingNotes"
          : logType === "medical"
          ? "medicalNotes"
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
      <Card className="shadow-sm border-0 ring-1 ring-gray-200" sx={{ mx: { xs: 0, sm: "auto" } }}>
        <CardHeader
          className="pb-3"
          sx={{
            alignItems: "center",
            "& .MuiCardHeader-content": {
              alignSelf: "center",
            },
            "& .MuiCardHeader-action": {
              alignSelf: "center",
              margin: 0,
            },
          }}
          title={
            <Box display="flex" alignItems="center" gap={1.5}>
              <div className={cn("p-2 rounded-lg", config.bgColor)}>
                <Icon className={cn("h-5 w-5", config.color)} />
              </div>
              <Typography variant="h6" className="text-h3">
                {config.title}
              </Typography>
            </Box>
          }
        />
        <CardContent>
          <Box className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="shadow-sm border-0 ring-1 ring-gray-200 hover:ring-gray-300 transition-all duration-200"
      sx={{
        mx: { xs: 0, sm: "auto" },
        boxShadow: { xs: 0, sm: 1 },
        border: { xs: "none", sm: "1px solid" },
        borderColor: { xs: "transparent", sm: "divider" },
      }}
    >
      <CardHeader
        className="pb-3"
        sx={{
          alignItems: "center",
          "& .MuiCardHeader-content": {
            alignSelf: "center",
          },
          "& .MuiCardHeader-action": {
            alignSelf: "center",
            margin: 0,
          },
        }}
        title={
          <Box display="flex" alignItems="center" gap={1.5}>
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <Typography variant="h6">{config.title}</Typography>
          </Box>
        }
        action={
          canAddLogs ? (
            <Button
              onClick={onAddLog}
              size="small"
              variant="contained"
              className="shadow-sm"
              sx={{ textTransform: "none" }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {addButtonText}
            </Button>
          ) : null
        }
      />
      <CardContent sx={{ p: { xs: 0, sm: 2 } }}>
        {/* Instructions Section */}
        <Box px={{ xs: 2, sm: 0 }} mb={3}>
          <InlineEditableText
            value={instructions}
            onSave={handleSaveInstructions}
            placeholder={instructionsPlaceholder}
          />
        </Box>

        {logs.length === 0 ? (
          <div className="text-center py-12">
            <div
              className={cn(
                "w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center",
                config.bgColor
              )}
            >
              <Icon className={cn("h-10 w-10", config.color)} />
            </div>
            <p className="text-body text-muted-foreground mb-6">
              {emptyMessage}
              {!canAddLogs && " (kun visning)"}
            </p>
            {canAddLogs && (
              <Button
                onClick={onAddLog}
                variant="outlined"
                className="shadow-sm"
                sx={{ textTransform: "none" }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {addButtonText}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {logs.map((log) => (
              <Box
                key={log.id}
                position="relative"
                px={{ xs: 2, sm: 3 }}
                pt={1}
                pb={3}
                sx={{
                  backgroundColor: { xs: "transparent", sm: "background.paper" },
                  border: { xs: "none", sm: "1px solid" },
                  borderColor: { xs: "transparent", sm: "divider" },
                  borderRadius: { xs: 0, sm: "12px" },
                  borderBottom: { xs: "1px solid", sm: "none" },
                  borderBottomColor: { xs: "divider", sm: "transparent" },
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: { xs: 0, sm: 2 },
                    borderColor: { xs: "divider", sm: "text.secondary" },
                  },
                }}
              >
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
                    config.accentColor
                  )}
                ></div>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { sm: "flex-start" },
                    justifyContent: { sm: "space-between" },
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    <Chip
                      icon={<User className="h-4 w-4" />}
                      label={log.profile.nickname}
                      size="small"
                      variant="filled"
                      className="text-caption font-medium w-fit"
                      sx={{ backgroundColor: "rgba(0,0,0,0.08)" }}
                    />
                  </Box>
                  <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                    <Typography variant="body2" className="text-body-sm text-muted-foreground mb-1">
                      {formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: true,
                        locale: nb,
                      })}
                    </Typography>
                    <Box className="text-caption text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <Typography variant="caption" className="text-caption text-muted-foreground">
                        {new Date(log.createdAt).toLocaleDateString("no-NO", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <div className="space-y-4">
                  <div className="max-w-none">
                    <p className="text-body leading-relaxed whitespace-pre-wrap text-foreground">
                      {displayMode === "TRUNCATED" &&
                      log.description.length > 200 &&
                      !expandedLogs.has(log.id)
                        ? `${log.description.slice(0, 200)}...`
                        : log.description}
                    </p>
                    {displayMode === "TRUNCATED" &&
                      log.description.length > 200 &&
                      !expandedLogs.has(log.id) && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => toggleExpanded(log.id)}
                          sx={{
                            textTransform: "none",
                            padding: "4px 8px",
                            fontSize: "0.875rem",
                            color: "primary.main",
                            "&:hover": {
                              backgroundColor: "transparent",
                              textDecoration: "underline",
                            },
                          }}
                        >
                          Vis mer
                        </Button>
                      )}
                    {displayMode === "TRUNCATED" &&
                      log.description.length > 200 &&
                      expandedLogs.has(log.id) && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => toggleExpanded(log.id)}
                          sx={{
                            textTransform: "none",
                            padding: "4px 8px",
                            fontSize: "0.875rem",
                            color: "primary.main",
                            "&:hover": {
                              backgroundColor: "transparent",
                              textDecoration: "underline",
                            },
                          }}
                        >
                          Vis mindre
                        </Button>
                      )}
                  </div>

                  {log.images.length > 0 && (
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                        <ImageIcon className="h-4 w-4" />
                        <Typography variant="body2">Bilder ({log.images.length})</Typography>
                      </Box>
                      <Box
                        display="grid"
                        gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
                        gap={2}
                      >
                        {log.images.map((image, index) => (
                          <Box
                            key={`${log.id}-${index}`}
                            display="flex"
                            flexDirection="column"
                            gap={1}
                          >
                            <Box
                              sx={{
                                position: "relative",
                                aspectRatio: "16/9",
                                borderRadius: "12px",
                                overflow: "hidden",
                              }}
                            >
                              <Image
                                src={image}
                                alt={log.imageDescriptions[index] || `Bilde ${index + 1}`}
                                fill
                                className="rounded-xl hover:scale-105 transition-transform duration-200"
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                quality={75}
                                style={{
                                  objectFit: "contain",
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div style="display: flex; flex-direction: column; align-items: center; color: #666;">
                                        <div style="width: 48px; height: 48px; border-radius: 8px; background-color: #f5f5f5; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                                          <svg style="height: 24px; width: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                        <p style="font-size: 12px; text-align: center;">Kunne ikke laste bilde</p>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            </Box>
                            {log.imageDescriptions[index] && (
                              <Typography variant="body2" color="text.secondary" px={0.5}>
                                {log.imageDescriptions[index]}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </div>
              </Box>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

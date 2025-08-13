"use client";

import { HorseCustomCategory, useCustomLogs } from "@/hooks/useHorseLogs";
import { cn } from "@/lib/utils";
import { Box, Button, Card, CardContent, CardHeader, Chip, Typography } from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Calendar,
  ImageIcon,
  Plus,
  User,
  ClipboardList,
  Heart,
  Activity,
  Utensils,
  FileText,
  Settings,
  Star,
  Award,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface CustomLogListProps {
  category: HorseCustomCategory;
  isLoading?: boolean;
  onAddLog: (categoryId: string) => void;
  displayMode?: string;
  canAddLogs?: boolean;
}

const iconMap = {
  ClipboardList,
  Heart,
  Activity,
  Utensils,
  FileText,
  Settings,
  Star,
  Award,
  Calendar,
};

export function CustomLogList({
  category,
  isLoading = false,
  onAddLog,
  displayMode = "FULL",
  canAddLogs = true,
}: CustomLogListProps) {
  const { data: logs = [] } = useCustomLogs(category.id);
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

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || ClipboardList;
  };

  const getColorClasses = (color: string) => {
    const colorBase = color.replace('text-', '').replace('-600', '');
    return {
      textColor: color,
      bgColor: `bg-${colorBase}-50`,
      borderColor: `border-${colorBase}-200`,
      accentColor: `bg-${colorBase}-500`,
    };
  };

  const Icon = getIconComponent(category.icon);
  const colors = getColorClasses(category.color);
  const emptyMessage = "Ingen logger lagt til ennå";
  const addButtonText = "Legg til logg";

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
              <div className={cn("p-2 rounded-lg", colors.bgColor)}>
                <Icon className={cn("h-5 w-5", colors.textColor)} />
              </div>
              <Typography variant="h6" className="text-h3">
                {category.name}
              </Typography>
              {category.description && (
                <Typography variant="body2" className="text-body-sm text-muted-foreground">
                  • {category.description}
                </Typography>
              )}
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
            <div className={cn("p-2 rounded-lg", colors.bgColor)}>
              <Icon className={cn("h-5 w-5", colors.textColor)} />
            </div>
            <Box>
              <Typography variant="h6">{category.name}</Typography>
              {category.description && (
                <Typography variant="body2" className="text-body-sm text-muted-foreground">
                  {category.description}
                </Typography>
              )}
            </Box>
          </Box>
        }
        action={
          canAddLogs ? (
            <Button
              onClick={() => onAddLog(category.id)}
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
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <div
              className={cn(
                "w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center",
                colors.bgColor
              )}
            >
              <Icon className={cn("h-10 w-10", colors.textColor)} />
            </div>
            <p className="text-body text-muted-foreground mb-6">
              {emptyMessage}
              {!canAddLogs && " (kun visning)"}
            </p>
            {canAddLogs && (
              <Button
                onClick={() => onAddLog(category.id)}
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
                    colors.accentColor
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
"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import { ReactNode } from "react";

interface AdminStatsCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleColor?: "green" | "slate" | "red";
}

export function AdminStatsCard({
  icon,
  title,
  value,
  subtitle,
  subtitleColor = "slate",
}: AdminStatsCardProps) {
  const getSubtitleColor = (color: string) => {
    switch (color) {
      case "green":
        return "#059669"; // green-600
      case "red":
        return "#dc2626"; // red-600
      default:
        return "#475569"; // slate-600
    }
  };

  return (
    <Card
      className="shadow-sm border border-slate-200"
      sx={{
        borderRadius: "0.5rem",
        "& .MuiPaper-root": {
          boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        },
      }}
    >
      <CardContent className="p-6">
        <Box className="flex items-center">
          {icon}
          <Box className="ml-4">
            <Typography
              variant="body2"
              className="text-sm font-medium text-slate-600"
              sx={{ fontSize: "0.875rem", fontWeight: 500, color: "#475569" }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              className="text-2xl font-bold text-slate-900"
              sx={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                className="text-xs"
                sx={{
                  fontSize: "0.75rem",
                  color: getSubtitleColor(subtitleColor),
                  display: "block",
                  marginTop: "0.25rem",
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

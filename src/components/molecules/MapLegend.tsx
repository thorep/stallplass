"use client";

import { Box, IconButton, Paper } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";

interface MapLegendItem {
  color: string;
  label: string;
}

interface MapLegendProps {
  stableCount: number;
  serviceCount: number;
  partLoanHorseCount: number;
  horseSaleCount: number;
}

export default function MapLegend({ 
  stableCount, 
  serviceCount, 
  partLoanHorseCount, 
  horseSaleCount 
}: MapLegendProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const legendItems: MapLegendItem[] = [
    { color: "#3b82f6", label: "Staller" },
    { color: "#f59e0b", label: "Tjenester" },
    { color: "#7c3aed", label: "Fôrhester" },
    { color: "#dc2626", label: "Hester til salgs" },
  ].filter((item, index) => {
    const counts = [stableCount, serviceCount, partLoanHorseCount, horseSaleCount];
    return counts[index] > 0;
  });

  if (legendItems.length === 0) {
    return null;
  }

  return (
    <Paper
      sx={{
        position: "absolute",
        bottom: 20,
        left: 20,
        zIndex: 1000,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        borderRadius: 2,
        minWidth: isExpanded ? 160 : "auto",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 1.5,
          pb: isExpanded ? 1 : 1.5,
        }}
      >
        <Box sx={{ fontSize: "14px", fontWeight: 600, color: "#212121" }}>
          Kartforklaring
        </Box>
        <IconButton
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{
            ml: 1,
            width: 24,
            height: 24,
            color: "#666",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
          }}
        >
          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>
      
      {isExpanded && (
        <Box sx={{ px: 1.5, pb: 1.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
          {legendItems.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: item.color,
                  borderRadius: "50%",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                  flexShrink: 0,
                }}
              />
              <Box
                sx={{
                  fontSize: "13px",
                  color: "#555",
                }}
              >
                {item.label}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
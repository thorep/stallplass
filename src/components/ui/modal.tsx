"use client";

import { Dialog, DialogTitle, IconButton, Typography, useMediaQuery, useTheme } from "@mui/material";
import { X } from "lucide-react";
import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | false;
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = false,
  showCloseButton = true,
}: ModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg")); // Use lg instead of md for wider mobile detection
  // Force fullScreen on mobile for better UX
  const fullScreen = isMobile;

  const getMaxWidth = () => {
    switch (maxWidth) {
      case "sm":
        return "40rem"; // 640px
      case "md":
        return "48rem"; // 768px
      case "lg":
        return "64rem"; // 1024px
      case "xl":
        return "80rem"; // 1280px
      default:
        return "64rem"; // default
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={false}
      fullScreen={fullScreen}
      slotProps={{
        paper: {
          className: "bg-background text-foreground",
        },
      }}
      sx={{
        zIndex: 9999, // Very high z-index to ensure modal is on top
        "& .MuiDialog-paper": {
          zIndex: 10000, // Even higher for the actual modal content
          backgroundColor: "rgb(255, 255, 255)", // white background
          color: "rgb(0, 0, 0)", // black text
          padding: 0,
          overflow: "auto",
          // Desktop styles (when not fullScreen)
          ...(!fullScreen && {
            width: "90%",
            maxWidth: maxWidth === false ? "64rem" : getMaxWidth(),
            maxHeight: "calc(100vh - 120px)", // Account for header height
            marginTop: "80px", // Push modal down to account for header
            borderRadius: "0.625rem", // rounded-lg
            border: "1px solid rgb(229, 231, 235)", // gray-200 border
          }),
          // Mobile styles (when fullScreen)
          ...(fullScreen && {
            margin: 0,
            borderRadius: 0,
            border: "none",
          }),
        },
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 9998, // High z-index for backdrop
        },
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between pb-4 border-gray-200">
          <Typography variant="h2" component="h2" sx={{ fontWeight: 600, color: "rgb(17, 24, 39)" }}>
            {title || "Modal"}
          </Typography>
          <IconButton
            onClick={onClose}
            size="medium"
            sx={{
              color: "rgb(75, 85, 99)", // gray-600 (darker)
              padding: "0.75rem", // Increased padding
              minWidth: "48px", // Larger touch target
              minHeight: "48px", // Larger touch target
              "&:hover": {
                backgroundColor: "rgb(243, 244, 246)", // gray-100
                color: "rgb(31, 41, 55)", // gray-800
              },
            }}
          >
            <X className="h-5 w-5" />
          </IconButton>
        </div>

        <div>{children}</div>
      </div>
    </Dialog>
  );
}

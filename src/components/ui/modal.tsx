"use client";

import { Modal as MuiModal, Box, IconButton, Typography, useMediaQuery, useTheme } from "@mui/material";
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
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

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
    <MuiModal
      open={isOpen}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isMobile ? '100%' : '90%',
          maxWidth: isMobile ? '100%' : getMaxWidth(),
          maxHeight: isMobile ? '100vh' : 'calc(100vh - 120px)',
          height: isMobile ? '100vh' : 'auto',
          bgcolor: 'background.paper',
          backgroundColor: 'rgb(255, 255, 255)',
          borderRadius: isMobile ? 0 : '0.625rem',
          border: isMobile ? 'none' : '1px solid rgb(229, 231, 235)',
          boxShadow: 24,
          overflow: 'auto',
          outline: 'none',
        }}
      >
        <div className="px-3 py-6 sm:px-6">
          <div className="flex items-center justify-between pb-4 border-gray-200">
            <Typography variant="h2" component="h2" sx={{ fontWeight: 600, color: "rgb(17, 24, 39)" }}>
              {title || "Modal"}
            </Typography>
            {showCloseButton && (
              <IconButton
                onClick={onClose}
                size="medium"
                sx={{
                  color: "rgb(75, 85, 99)",
                  padding: "0.75rem",
                  minWidth: "48px",
                  minHeight: "48px",
                  "&:hover": {
                    backgroundColor: "rgb(243, 244, 246)",
                    color: "rgb(31, 41, 55)",
                  },
                }}
              >
                <X className="h-5 w-5" />
              </IconButton>
            )}
          </div>

          <div>{children}</div>
        </div>
      </Box>
    </MuiModal>
  );
}
